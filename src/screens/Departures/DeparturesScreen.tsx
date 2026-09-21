import { useEffect, useState } from 'react'
import { bethesdaRedLineDepartures, railLines } from '../../data/departures'
import type { Departure } from '../../data/departures'
import './departures.css'

function MetroMark() {
  return (
    <div className="metro-mark" aria-label="Metro">
      <strong>M</strong>
      <span>metro</span>
    </div>
  )
}

function LineSelector() {
  return (
    <nav className="line-selector" aria-label="Rail lines">
      {railLines.map((line) => {
        const active = line === 'Red'
        return (
          <button
            className={`line-option ${active ? 'line-option--active' : ''}`}
            type="button"
            key={line}
            aria-current={active ? 'page' : undefined}
            aria-label={`${line} Line${active ? ', currently selected' : ''}`}
          >
            <span className="line-marker" aria-hidden="true" />
            <span>{line} Line</span>
          </button>
        )
      })}
    </nav>
  )
}

function DepartureRow({ departure }: { departure: Departure }) {
  return (
    <div className="departure-row">
      <span className="departure-destination">{departure.destination}</span>
      <span className="departure-minutes">{departure.minutes}</span>
      <span className="departure-track">{departure.track}</span>
    </div>
  )
}

function TrainIllustration() {
  return (
    <svg className="train-illustration" viewBox="0 0 300 175" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 121 115 27c14-12 35-18 54-18h52c14 0 24 9 24 22v78c0 12-9 21-21 21H70Z" strokeWidth="2" />
        <path d="M112 30 107 115M132 19l-3 100M154 11v108M177 10v108" opacity=".8" />
        <path d="M195 10v110M215 14v106M235 24v90" opacity=".8" />
        <path d="M11 121h240l-18 16H72Z" strokeWidth="2" />
        <path d="M179 24h42c7 0 12 5 12 12v49h-66V36c0-7 5-12 12-12Z" strokeWidth="2" />
        <path d="M176 90h56v28h-56zM184 35h15v36h-15zM208 35h15v36h-15z" />
        <path d="M193 96h22v19h-22zM204 97v17" />
        <circle cx="186" cy="105" r="4" fill="currentColor" />
        <circle cx="222" cy="105" r="4" fill="currentColor" />
        <path d="M69 137 34 144M80 144l-31 9M97 151l-29 10M208 137l39 7M198 144l32 9M185 151l25 10" />
        <path d="M177 124 155 139M233 124l-15 14M190 124l-10 17M220 124l-5 17" />
        <text x="198" y="111" fill="currentColor" stroke="none" textAnchor="middle" fontSize="13" fontWeight="700">M</text>
      </g>
    </svg>
  )
}

function Skyline() {
  return (
    <svg className="skyline" viewBox="0 0 350 62" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 54h348" strokeWidth="1.5" />
        <path d="M21 54V34h69v20M27 40h4m7 0h4m7 0h4m7 0h4m7 0h4m7 0h4M98 54V30h15v-8h72v8h14v24" />
        <path d="M108 30h81M115 54V33m7 0v21m7 0V33m7 0v21m7 0V33m7 0v21m7 0V33m7 0v21m7 0V33m7 0v21m7 0V33m7 0v21" />
        <path d="M216 54V48h7v-4h8v4h7v6M244 54V14l4-9 4 9v40M248 5V1M265 54V50h11v-4h8v4h12v4" />
        <path d="M300 54V27h7v-7h6v-5h8v5h6v7h7v27M307 27h20M311 20h12M316 15V8M316 8l4-6 4 6" />
        <path d="M332 54V39h12v15M3 54V48h12v6" />
      </g>
    </svg>
  )
}

function useLocalClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(interval)
  }, [])

  return {
    date: new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
    }).format(now).replace(',', '').toUpperCase(),
    time: new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(now),
  }
}

export function DeparturesScreen() {
  const clock = useLocalClock()

  return (
    <main className="metroboard" aria-label="MetroBoard departures for Bethesda">
      <section className="terminal-panel">
        <header className="terminal-header">
          <MetroMark />
          <div className="station-heading">
            <h1>Bethesda</h1>
            <p>Departures</p>
          </div>
          <time className="clock" dateTime={new Date().toISOString()}>
            <span>{clock.date}</span>
            <strong>{clock.time}</strong>
          </time>
        </header>

        <div className="terminal-body">
          <LineSelector />
          <section className="departure-board" aria-label="Red Line departures">
            <div className="departure-labels" aria-hidden="true">
              <span>Destination</span>
              <span>Min</span>
              <span>Track</span>
            </div>
            <div className="departure-list">
              {bethesdaRedLineDepartures.map((departure, index) => (
                <DepartureRow departure={departure} key={`${departure.destination}-${index}`} />
              ))}
            </div>
            <p className="fixture-note">Development fixture · Bethesda A09 · Red Line</p>
          </section>
          <aside className="terminal-art" aria-label="Washington Metro information display">
            <div className="art-top">
              <TrainIllustration />
              <p>Real time<br />departures<br />for the<br />Washington DC<br />area</p>
            </div>
            <div className="skyline-area">
              <Skyline />
              <span>Washington Metropolitan Area Transit Authority</span>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
