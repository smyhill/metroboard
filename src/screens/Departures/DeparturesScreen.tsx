import { useEffect, useState } from 'react'
import { railLines } from '../../data/metro'
import type { Departure, LineCode, Station } from '../../data/metro'
import { useDepartures, useIncidents, useStations } from '../../hooks/useMetroData'
import './departures.css'

const STATIONS_PER_PAGE = 8
const MAX_VISIBLE_DEPARTURES = 4
const SELECTION_STORAGE_KEY = 'metroboard.selection.v1'

const defaultStation: Station = { code: 'A09', name: 'Bethesda', lines: ['RD'] }

function storedSelection(): { station: Station, line: LineCode } {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SELECTION_STORAGE_KEY) ?? '')
    const line = railLines.some((candidate) => candidate.code === stored?.line) ? stored.line as LineCode : 'RD'
    if (typeof stored?.station?.code !== 'string' || typeof stored.station.name !== 'string' || !Array.isArray(stored.station.lines)) {
      return { station: defaultStation, line: 'RD' }
    }
    return { station: stored.station, line }
  } catch {
    return { station: defaultStation, line: 'RD' }
  }
}

function MetroMark() {
  return <div className="metro-mark" aria-label="Metro"><strong>M</strong><span>metro</span></div>
}

function LineSelector({ activeLine, onSelect }: { activeLine: LineCode, onSelect: (line: LineCode) => void }) {
  return <nav className="line-selector" aria-label="Choose a rail line">
    {railLines.map((line) => {
      const active = line.code === activeLine
      return <button className={`line-option ${active ? 'line-option--active' : ''}`} type="button" key={line.code}
        aria-current={active ? 'page' : undefined} onClick={() => onSelect(line.code)}>
        <span className="line-marker" aria-hidden="true" /><span>{line.name} Line</span>
      </button>
    })}
  </nav>
}

function DepartureRow({ departure }: { departure: Departure }) {
  return <div className="departure-row"><span className="departure-destination">{departure.destination}</span><span className="departure-minutes">{departure.minutes}</span><span className="departure-track">{departure.track}</span></div>
}

function TrainIllustration() {
  return <svg className="train-illustration" viewBox="20 10 230 135" aria-hidden="true"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M41 120 137 38q12-11 29-11h51q17 0 17 17v72q0 14-16 14H77Z" strokeWidth="2.4" />
    <path d="M41 120 153 58M77 130l4-52m22 40 4-54m22 41 4-51" opacity=".65" />
    <path d="M61 111 76 101l-2 19M88 94l17-11-2 34M116 77l17-11-2 37" opacity=".78" />
    <path d="M167 38h48q11 0 11 11v48h-67V49q0-11 8-11Z" strokeWidth="2.1" />
    <path d="M166 102h59v25h-59zM171 46h19v39h-19zM202 46h19v39h-19zM186 104h20v20h-20z" />
    <path d="M159 87h67M166 95h60M196 105v17M175 127h42" />
    <circle cx="176" cy="114" r="4" fill="currentColor" /><circle cx="215" cy="114" r="4" fill="currentColor" />
    <text x="196" y="120" fill="currentColor" stroke="none" textAnchor="middle" fontSize="13" fontWeight="700">M</text>
  </g></svg>
}

function Skyline() {
  return <svg className="skyline" viewBox="0 0 350 62" aria-hidden="true"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 54h348" strokeWidth="1.5" />
    <path d="M13 54V35h69v19M19 41h5m6 0h5m6 0h5m6 0h5m6 0h5" />
    <path d="M94 54V29h13v-7h72v7h14v25M104 29h84M111 54V32m8 0v22m8 0V32m8 0v22m8 0V32m8 0v22m8 0V32m8 0v22m8 0V32m8 0v22m8 0V32m8 0v22" />
    <path d="M199 54V48h9v-4h8v4h9v6M235 54V17l4-11 4 11v37M239 6V1M255 54V49h11v-4h8v4h13v5" />
    <path d="M292 54V29h5v-7h6v-5h9v5h6v7h5v25M297 29h21M301 22h13M306 17V9M306 9l2-7 3 7M292 35h31M330 54V40h14v14M3 54V48h7v6" />
  </g></svg>
}

function useLocalClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(interval)
  }, [])
  return {
    date: new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: '2-digit' }).format(now).replace(',', '').toUpperCase(),
    time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now),
  }
}

function StationPicker({ line, stations, onChoose, onClose }: { line: LineCode, stations: Station[], onChoose: (station: Station) => void, onClose: () => void }) {
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [line])
  const lineStations = stations.filter((station) => station.lines.includes(line))
  const pages = Math.max(1, Math.ceil(lineStations.length / STATIONS_PER_PAGE))
  const visibleStations = lineStations.slice(page * STATIONS_PER_PAGE, (page + 1) * STATIONS_PER_PAGE)
  const lineName = railLines.find((candidate) => candidate.code === line)?.name

  return <section className="station-picker" aria-label={`Select a ${lineName} Line station`}>
    <div className="picker-header"><span>{lineName} Line stations</span><button type="button" onClick={onClose}>Return</button></div>
    {visibleStations.length > 0 ? <div className="station-list">{visibleStations.map((station) => <button type="button" key={station.code} onClick={() => onChoose(station)}>{station.name}</button>)}</div> : <p className="picker-empty">Connect a WMATA API key to load this line’s station list.</p>}
    <div className="picker-pagination"><button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>‹ Previous</button><span>{lineStations.length ? `${page + 1} / ${pages}` : '—'}</span><button type="button" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>Next ›</button></div>
  </section>
}

function dataStatus(source: 'live' | 'cache' | 'fixture' | undefined, updatedAt: string | undefined, error: string | null, loading: boolean, hiddenCount: number) {
  if (error) return `OFFLINE · ${error}`
  if (!source || loading) return 'REFRESHING DEPARTURES…'
  if (source === 'fixture') return 'DEMO DATA · ADD WMATA_API_KEY FOR LIVE PREDICTIONS'
  const stamp = updatedAt ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(updatedAt)) : '--:--'
  const count = hiddenCount > 0 ? ` · NEXT ${MAX_VISIBLE_DEPARTURES} OF ${hiddenCount + MAX_VISIBLE_DEPARTURES}` : ''
  return `${source === 'cache' ? 'STALE' : 'LIVE'} DATA${count} · UPDATED ${stamp}`
}

export function DeparturesScreen() {
  const clock = useLocalClock()
  const { stations } = useStations()
  const [selection, setSelection] = useState(storedSelection)
  const [station, setStation] = useState<Station>(selection.station)
  const [line, setLine] = useState<LineCode>(selection.line)
  const [pickerLine, setPickerLine] = useState<LineCode>(selection.line)
  const [selectingStation, setSelectingStation] = useState(false)
  const { data, error, loading, refresh } = useDepartures(station, line)
  const { incidents, unavailable: incidentsUnavailable } = useIncidents(line)
  const stationName = data?.station.name ?? station.name
  const departures = data?.departures ?? []
  const visibleDepartures = departures.slice(0, MAX_VISIBLE_DEPARTURES)
  const status = dataStatus(data?.source, data?.updatedAt, error, loading, departures.length - visibleDepartures.length)

  useEffect(() => {
    window.localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify({ station, line }))
  }, [line, station])

  const chooseLine = (nextLine: LineCode) => { setPickerLine(nextLine); setSelectingStation(true) }
  const chooseStation = (nextStation: Station) => { setStation(nextStation); setLine(pickerLine); setSelectingStation(false) }

  return <main className="metroboard" aria-label={`MetroBoard departures for ${stationName}`}><section className="terminal-panel">
    <header className="terminal-header"><MetroMark /><div className="station-heading"><h1>{selectingStation ? 'Select Station' : stationName}</h1><p>{selectingStation ? 'Choose a stop' : 'Departures'}</p></div><time className="clock" dateTime={new Date().toISOString()}><span>{clock.date}</span><strong>{clock.time}</strong></time></header>
    <div className="terminal-body"><LineSelector activeLine={selectingStation ? pickerLine : line} onSelect={chooseLine} />
      {selectingStation ? <StationPicker line={pickerLine} stations={stations} onChoose={chooseStation} onClose={() => setSelectingStation(false)} /> : <section className="departure-board" aria-label={`${line} Line departures`}><div className="departure-labels" aria-hidden="true"><span>Destination</span><span>Min</span><span>Track</span></div><div className="departure-list">{visibleDepartures.map((departure, index) => <DepartureRow departure={departure} key={`${departure.destination}-${departure.minutes}-${index}`} />)}</div>{departures.length === 0 && !loading && <p className="no-departures">No departures are currently posted for this line.</p>}<button className={`data-status ${error ? 'data-status--error' : ''}`} type="button" onClick={() => refresh()} disabled={loading}>{status}</button>{incidents[0] && <p className="service-alert" title={incidents[0].summary}>Service alert · {incidents[0].summary}</p>}{!incidents[0] && incidentsUnavailable && <p className="service-alert service-alert--unknown">Service alert feed unavailable</p>}</section>}
      <aside className="terminal-art" aria-label="Washington Metro information display"><div className="art-top"><TrainIllustration /><p>Real time<br />departures<br />for the<br />Washington DC<br />area</p></div><div className="skyline-area"><Skyline /><span>Washington Metropolitan Area Transit Authority</span></div></aside>
    </div>
  </section></main>
}
