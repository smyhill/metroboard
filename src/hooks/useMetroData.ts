import { useCallback, useEffect, useState } from 'react'
import { fetchDepartures, fetchIncidents, fetchStations } from '../api/metroboard'
import { bethesdaStation } from '../data/metro'
import type { DepartureResponse, LineCode, Station } from '../data/metro'

const REFRESH_INTERVAL_MS = 30_000

type DeparturesState = {
  data: DepartureResponse | null
  error: string | null
  loading: boolean
}

export function useDepartures(station: Station, line: LineCode) {
  const [state, setState] = useState<DeparturesState>({ data: null, error: null, loading: true })

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const data = await fetchDepartures(station.code, line, signal)
      setState({ data, error: null, loading: false })
    } catch (error) {
      if (signal?.aborted) return
      setState((current) => ({ ...current, loading: false, error: error instanceof Error ? error.message : 'Unable to refresh departures.' }))
    }
  }, [line, station.code])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [refresh])

  return { ...state, refresh: () => refresh() }
}

export function useStations() {
  const [stations, setStations] = useState<Station[]>([bethesdaStation])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void fetchStations(controller.signal)
      .then((response) => setStations(response.stations))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load stations.')
        }
      })
    return () => controller.abort()
  }, [])

  return { stations, error }
}

export function useIncidents(line: LineCode) {
  const [incidents, setIncidents] = useState<{ summary: string, severity: string }[]>([])
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const load = () => {
      void fetchIncidents(line, controller.signal)
        .then((response) => {
          setIncidents(response.incidents)
          setUnavailable(response.stale ?? false)
        })
        .catch(() => { if (!controller.signal.aborted) setUnavailable(true) })
    }
    load()
    const interval = window.setInterval(load, 60_000)
    return () => { controller.abort(); window.clearInterval(interval) }
  }, [line])

  return { incidents, unavailable }
}
