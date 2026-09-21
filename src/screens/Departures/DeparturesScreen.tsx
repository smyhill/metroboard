import { useEffect, useState } from 'react'
import { railLines } from '../../data/metro'
import type { Departure, LineCode, Station } from '../../data/metro'
import { useDepartures, useStations } from '../../hooks/useMetroData'
import './departures.css'

const STATIONS_PER_PAGE = 8
const MAX_VISIBLE_DEPARTURES = 4

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
  return <svg className="train-illustration" viewBox="0 0 300 175" aria-hidden="true"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10 128 157-105q15-10 34-11h29q17 0 17 17v85q0 15-15 15H78Z" strokeWidth="2.1" />
    <path d="m10 128 166-75 55-8M10 128l222 1M79 128l7-65M101 114l7-61M124 103l7-57M147 92l7-52" opacity=".86" />
    <path d="m30 118 8-9m8 4 9-10m8 4 10-11m9 4 10-12m9 4 11-12m10 4 11-12" opacity=".48" />
    <path d="M180 26h42q13 0 13 13v57h-67V39q0-13 12-13Z" strokeWidth="2" />
    <path d="M176 101h57v24h-57zM181 34h17v43h-17zM211 34h17v43h-17zM195 103h20v19h-20z" />
    <path d="M205 104v17M168 84h67M175 92h57M188 126l-15 16m47-16 14 16" />
    <circle cx="185" cy="112" r="4" fill="currentColor" /><circle cx="224" cy="112" r="4" fill="currentColor" />
    <path d="M8 130 83 152l149 1M8 130l78 29 149 1M30 142 96 166M67 145l59 23M236 132l48 17M227 140l48 17M215 148l44 18" />
    <text x="205" y="118" fill="currentColor" stroke="none" textAnchor="middle" fontSize="13" fontWeight="700">M</text>
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
  const [station, setStation] = useState<Station>({ code: 'A09', name: 'Bethesda', lines: ['RD'] })
  const [line, setLine] = useState<LineCode>('RD')
  const [selectingStation, setSelectingStation] = useState(false)
  const { data, error, loading, refresh } = useDepartures(station, line)
  const stationName = data?.station.name ?? station.name
  const departures = data?.departures ?? []
  const visibleDepartures = departures.slice(0, MAX_VISIBLE_DEPARTURES)
  const status = dataStatus(data?.source, data?.updatedAt, error, loading, departures.length - visibleDepartures.length)

  const chooseLine = (nextLine: LineCode) => { setLine(nextLine); setSelectingStation(true) }
  const chooseStation = (nextStation: Station) => { setStation(nextStation); setSelectingStation(false) }

  return <main className="metroboard" aria-label={`MetroBoard departures for ${stationName}`}><section className="terminal-panel">
    <header className="terminal-header"><MetroMark /><div className="station-heading"><h1>{selectingStation ? 'Select Station' : stationName}</h1><p>{selectingStation ? 'Choose a stop' : 'Departures'}</p></div><time className="clock" dateTime={new Date().toISOString()}><span>{clock.date}</span><strong>{clock.time}</strong></time></header>
    <div className="terminal-body"><LineSelector activeLine={line} onSelect={chooseLine} />
      {selectingStation ? <StationPicker line={line} stations={stations} onChoose={chooseStation} onClose={() => setSelectingStation(false)} /> : <section className="departure-board" aria-label={`${line} Line departures`}><div className="departure-labels" aria-hidden="true"><span>Destination</span><span>Min</span><span>Track</span></div><div className="departure-list">{visibleDepartures.map((departure, index) => <DepartureRow departure={departure} key={`${departure.destination}-${departure.minutes}-${index}`} />)}</div>{departures.length === 0 && !loading && <p className="no-departures">No departures are currently posted for this line.</p>}<button className={`data-status ${error ? 'data-status--error' : ''}`} type="button" onClick={() => refresh()} disabled={loading}>{status}</button></section>}
      <aside className="terminal-art" aria-label="Washington Metro information display"><div className="art-top"><TrainIllustration /><p>Real time<br />departures<br />for the<br />Washington DC<br />area</p></div><div className="skyline-area"><Skyline /><span>Washington Metropolitan Area Transit Authority</span></div></aside>
    </div>
  </section></main>
}
