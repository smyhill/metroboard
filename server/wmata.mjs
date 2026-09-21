import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const WMATA_API_BASE_URL = 'https://api.wmata.com'
const REQUEST_TIMEOUT_MS = 8_000
const STATIONS_CACHE_TTL_MS = 24 * 60 * 60 * 1_000
const INCIDENTS_CACHE_TTL_MS = 60_000

const lineNames = {
  BL: 'Blue',
  GR: 'Green',
  OR: 'Orange',
  RD: 'Red',
  SV: 'Silver',
  YL: 'Yellow',
}

const fixtureStation = { code: 'A09', name: 'Bethesda', lines: ['RD'] }
const fixtureDepartures = [
  { destination: 'Shady Grove', minutes: '2', minutesSort: 2, track: '1', line: 'RD' },
  { destination: 'Glenmont', minutes: '5', minutesSort: 5, track: '1', line: 'RD' },
  { destination: 'Shady Grove', minutes: '12', minutesSort: 12, track: '1', line: 'RD' },
  { destination: 'Glenmont', minutes: '20', minutesSort: 20, track: '1', line: 'RD' },
]

function timestamp() {
  return new Date().toISOString()
}

function minutesSort(value) {
  if (value === 'BRD') return -1
  if (value === 'ARR') return 0
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
}

export function normalizePredictions(trains, lineCode) {
  if (!Array.isArray(trains)) return []

  return trains
    .filter((train) => !lineCode || train.Line === lineCode)
    .filter((train) => train.Destination && train.Destination !== 'No Passenger')
    .map((train) => ({
      destination: train.Destination,
      minutes: train.Min === 'BRD' ? 'BRD' : train.Min === 'ARR' ? 'ARR' : String(train.Min ?? '--'),
      minutesSort: minutesSort(train.Min),
      track: train.Group ? String(train.Group) : '--',
      line: train.Line ?? '',
    }))
    .sort((first, second) => first.minutesSort - second.minutesSort)
}

export function normalizeStations(stations) {
  if (!Array.isArray(stations)) return []

  return stations
    .map((station) => ({
      code: station.Code,
      name: station.Name,
      lines: [station.LineCode1, station.LineCode2, station.LineCode3, station.LineCode4]
        .filter((line) => typeof line === 'string' && lineNames[line]),
    }))
    .filter((station) => station.code && station.name)
    .sort((first, second) => first.name.localeCompare(second.name))
}

export function normalizeIncidents(incidents) {
  if (!Array.isArray(incidents)) return []

  return incidents
    .map((incident) => ({
      id: incident.IncidentID,
      severity: incident.DelaySeverity ?? 'Unknown',
      lines: [...new Set(String(incident.LinesAffected ?? '').match(/BL|GR|OR|RD|SV|YL/g) ?? [])],
      summary: String(incident.Description ?? incident.EmergencyText ?? 'Service advisory').replace(/\s+/g, ' ').trim(),
      updatedAt: incident.DateUpdated ?? null,
    }))
    .filter((incident) => incident.id && incident.summary)
}

async function fetchJson(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`WMATA responded with ${response.status}`)
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

export class WmataClient {
  constructor({ apiKey, apiBaseUrl = WMATA_API_BASE_URL, cachePath }) {
    this.apiKey = apiKey
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '')
    this.cachePath = cachePath
    this.cache = { departures: {}, stations: null, incidents: null }
    this.loaded = false
  }

  async loadCache() {
    if (this.loaded) return
    this.loaded = true
    try {
      const parsed = JSON.parse(await readFile(this.cachePath, 'utf8'))
      this.cache = {
        departures: parsed && typeof parsed.departures === 'object' && parsed.departures !== null ? parsed.departures : {},
        stations: parsed?.stations ?? null,
        incidents: parsed?.incidents ?? null,
      }
    } catch {
      // A missing or corrupt cache must never prevent the display from starting.
    }
  }

  async saveCache() {
    await mkdir(dirname(this.cachePath), { recursive: true })
    const temporaryPath = `${this.cachePath}.tmp`
    await writeFile(temporaryPath, JSON.stringify(this.cache), 'utf8')
    await rename(temporaryPath, this.cachePath)
  }

  apiUrl(pathname) {
    const url = new URL(pathname, `${this.apiBaseUrl}/`)
    url.searchParams.set('api_key', this.apiKey)
    return url
  }

  async getStations() {
    await this.loadCache()
    const cached = this.cache.stations
    if (!this.apiKey) return { stations: [fixtureStation], source: 'fixture', updatedAt: timestamp() }

    if (cached && Date.now() - Date.parse(cached.updatedAt) < STATIONS_CACHE_TTL_MS) {
      return { ...cached, source: 'cache' }
    }

    try {
      const payload = await fetchJson(this.apiUrl('Rail.svc/json/jStations'))
      const stations = normalizeStations(payload.Stations)
      if (stations.length === 0) throw new Error('WMATA returned no station records')
      const result = { stations, source: 'live', updatedAt: timestamp() }
      this.cache.stations = result
      await this.saveCache()
      return result
    } catch (error) {
      if (cached) return { ...cached, source: 'cache', stale: true }
      throw error
    }
  }

  async getDepartures(stationCode, lineCode) {
    await this.loadCache()
    const cacheKey = `${stationCode}:${lineCode ?? 'all'}`
    const cached = this.cache.departures[cacheKey]

    if (!this.apiKey) {
      if (stationCode === fixtureStation.code && (!lineCode || lineCode === 'RD')) {
        return {
          station: fixtureStation,
          departures: fixtureDepartures,
          source: 'fixture',
          updatedAt: timestamp(),
          message: 'Demo data — set WMATA_API_KEY on the MetroBoard server for live predictions.',
        }
      }
      throw new Error('WMATA_API_KEY is not configured')
    }

    try {
      const payload = await fetchJson(this.apiUrl(`StationPrediction.svc/json/GetPrediction/${encodeURIComponent(stationCode)}`))
      const departures = normalizePredictions(payload.Trains, lineCode)
      let station = { code: stationCode, name: stationCode, lines: [] }
      try {
        const stationList = await this.getStations()
        station = stationList.stations.find((candidate) => candidate.code === stationCode) ?? station
      } catch {
        // A prediction response is still useful if a separate station-list request is unavailable.
      }
      const result = { station, departures, source: 'live', updatedAt: timestamp() }
      this.cache.departures[cacheKey] = result
      await this.saveCache()
      return result
    } catch (error) {
      if (cached) return { ...cached, source: 'cache', stale: true, message: 'Live data unavailable — showing the last successful update.' }
      throw error
    }
  }

  async getIncidents(lineCode) {
    await this.loadCache()
    const cached = this.cache.incidents
    if (!this.apiKey) return { incidents: [], source: 'fixture', updatedAt: timestamp() }

    const filterForLine = (result) => ({
      ...result,
      incidents: result.incidents.filter((incident) => incident.lines.includes(lineCode)),
    })

    if (cached && Date.now() - Date.parse(cached.updatedAt) < INCIDENTS_CACHE_TTL_MS) {
      return filterForLine({ ...cached, source: 'cache' })
    }

    try {
      const payload = await fetchJson(this.apiUrl('Incidents.svc/json/Incidents'))
      const result = { incidents: normalizeIncidents(payload.Incidents), source: 'live', updatedAt: timestamp() }
      this.cache.incidents = result
      await this.saveCache()
      return filterForLine(result)
    } catch (error) {
      if (cached) return filterForLine({ ...cached, source: 'cache', stale: true })
      throw error
    }
  }
}

export const defaultCachePath = (applicationDirectory) => join(applicationDirectory, 'data', 'metroboard-cache.json')
