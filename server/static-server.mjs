import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defaultCachePath, WmataClient } from './wmata.mjs'

const serverDirectory = fileURLToPath(new URL('.', import.meta.url))
const distDirectory = resolve(process.env.METROBOARD_DIST_DIR ?? join(serverDirectory, '..', 'dist'))
const port = Number.parseInt(process.env.METROBOARD_PORT ?? '4173', 10)
const applicationDirectory = resolve(serverDirectory, '..')
const wmata = new WmataClient({
  apiKey: process.env.WMATA_API_KEY,
  apiBaseUrl: process.env.WMATA_API_BASE_URL,
  cachePath: process.env.METROBOARD_CACHE_PATH ?? defaultCachePath(applicationDirectory),
})

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

function resolveAsset(pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname
  const normalizedPath = normalize(requestedPath).replace(/^(\.\.([/\\]|$))+/, '')
  const assetPath = resolve(distDirectory, `.${normalizedPath}`)

  return assetPath.startsWith(`${distDirectory}/`) || assetPath === distDirectory
    ? assetPath
    : join(distDirectory, 'index.html')
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(body))
}

async function handleApi(url, response) {
  if (url.pathname === '/api/status') {
    sendJson(response, 200, { configured: Boolean(process.env.WMATA_API_KEY) })
    return
  }

  if (url.pathname === '/api/stations') {
    const result = await wmata.getStations()
    sendJson(response, 200, result)
    return
  }

  if (url.pathname === '/api/departures') {
    const stationCode = url.searchParams.get('station')?.toUpperCase()
    const lineCode = url.searchParams.get('line')?.toUpperCase()
    if (!stationCode || !/^[A-Z]\d{2}$/.test(stationCode)) {
      sendJson(response, 400, { error: 'A valid WMATA station code is required.' })
      return
    }
    if (lineCode && !/^(BL|GR|OR|RD|SV|YL)$/.test(lineCode)) {
      sendJson(response, 400, { error: 'A valid WMATA line code is required.' })
      return
    }
    sendJson(response, 200, await wmata.getDepartures(stationCode, lineCode))
    return
  }

  if (url.pathname === '/api/incidents') {
    const lineCode = url.searchParams.get('line')?.toUpperCase()
    if (!lineCode || !/^(BL|GR|OR|RD|SV|YL)$/.test(lineCode)) {
      sendJson(response, 400, { error: 'A valid WMATA line code is required.' })
      return
    }
    sendJson(response, 200, await wmata.getIncidents(lineCode))
    return
  }

  sendJson(response, 404, { error: 'Not found.' })
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  const { pathname } = url
  if (pathname.startsWith('/api/')) {
    try {
      await handleApi(url, response)
    } catch (error) {
      console.error(`MetroBoard API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      sendJson(response, 503, { error: 'Live rail data is temporarily unavailable. Please try again shortly.' })
    }
    return
  }
  let assetPath = resolveAsset(pathname)

  try {
    if (!(await stat(assetPath)).isFile()) {
      assetPath = join(distDirectory, 'index.html')
    }

    const contentType = contentTypes[extname(assetPath)] ?? 'application/octet-stream'
    response.writeHead(200, {
      'Cache-Control': assetPath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    })
    createReadStream(assetPath).pipe(response)
  } catch {
    const fallback = join(distDirectory, 'index.html')
    if (existsSync(fallback)) {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      createReadStream(fallback).pipe(response)
      return
    }

    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('MetroBoard assets are not deployed yet. Run scripts/deploy.sh from the development Mac.\n')
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`MetroBoard server listening at http://127.0.0.1:${port}`)
})
