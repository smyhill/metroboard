import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const serverDirectory = fileURLToPath(new URL('.', import.meta.url))
const distDirectory = resolve(process.env.METROBOARD_DIST_DIR ?? join(serverDirectory, '..', 'dist'))
const port = Number.parseInt(process.env.METROBOARD_PORT ?? '4173', 10)

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

createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`).pathname
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
  console.log(`MetroBoard static server listening at http://127.0.0.1:${port}`)
})
