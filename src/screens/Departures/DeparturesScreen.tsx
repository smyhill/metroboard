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
    <path d="M18 119 156 28q13-10 29-10h40q16 0 16 16v78q0 15-16 15H74Z" strokeWidth="2.1" />
    <path d="M18 119 166 53M74 127l5-54m18 42 5-52m18 41 5-51m18 39 5-49" opacity=".7" />
    <path d="M38 106 52 97l-2 17M61 95l15-9-2 25M85 83l15-9-2 31M109 71l15-9-2 38M133 59l15-8-2 43" opacity=".75" />
    <path d="M173 29h48q12 0 12 12v54h-67V41q0-12 7-12Z" strokeWidth="2" />
    <path d="M175 100h57v24h-57zM179 37h18v39h-18zM210 37h18v39h-18zM194 102h20v19h-20z" />
    <path d="M166 84h67M174 92h58M204 103v17M181 124h44" />
    <circle cx="185" cy="112" r="4" fill="currentColor" /><circle cx="223" cy="112" r="4" fill="currentColor" />
    <text x="204" y="118" fill="currentColor" stroke="none" textAnchor="middle" fontSize="13" fontWeight="700">M</text>
    <path d="M9 134 239 158M36 132l201 37" strokeWidth="1.5" opacity=".8" />
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
