import type { DepartureResponse, IncidentsResponse, LineCode, StationsResponse } from '../data/metro'

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal })
  const body = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(body.error ?? 'MetroBoard could not load data.')
  return body
}

export function fetchDepartures(stationCode: string, lineCode: LineCode, signal?: AbortSignal) {
  const query = new URLSearchParams({ station: stationCode, line: lineCode })
  return requestJson<DepartureResponse>(`/api/departures?${query}`, signal)
}

export function fetchStations(signal?: AbortSignal) {
  return requestJson<StationsResponse>('/api/stations', signal)
}

export function fetchIncidents(lineCode: LineCode, signal?: AbortSignal) {
  return requestJson<IncidentsResponse>(`/api/incidents?line=${lineCode}`, signal)
}
