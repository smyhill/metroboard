import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { normalizeIncidents, normalizePredictions, normalizeStations, WmataClient } from './wmata.mjs'

test('normalizes, filters, and sorts WMATA train predictions', () => {
  const predictions = normalizePredictions([
    { Destination: 'Glenmont', Group: '1', Line: 'RD', Min: '12' },
    { Destination: 'Shady Grove', Group: '2', Line: 'RD', Min: 'BRD' },
    { Destination: 'No Passenger', Group: '1', Line: 'RD', Min: '1' },
    { Destination: 'New Carrollton', Group: '1', Line: 'OR', Min: '2' },
  ], 'RD')

  assert.deepEqual(predictions, [
    { destination: 'Shady Grove', minutes: 'BRD', minutesSort: -1, track: '2', line: 'RD' },
    { destination: 'Glenmont', minutes: '12', minutesSort: 12, track: '1', line: 'RD' },
  ])
})

test('normalizes canonical station records and their served lines', () => {
  const stations = normalizeStations([
    { Code: 'A09', Name: 'Bethesda', LineCode1: 'RD', LineCode2: null },
    { Code: 'C01', Name: 'Metro Center', LineCode1: 'OR', LineCode2: 'BL', LineCode3: 'SV', LineCode4: 'RD' },
  ])

  assert.deepEqual(stations, [
    { code: 'A09', name: 'Bethesda', lines: ['RD'] },
    { code: 'C01', name: 'Metro Center', lines: ['OR', 'BL', 'SV', 'RD'] },
  ])
})

test('normalizes WMATA service incidents and their affected lines', () => {
  const incidents = normalizeIncidents([{
    IncidentID: 'incident-1',
    DelaySeverity: 'Minor',
    LinesAffected: 'RD;OR',
    Description: '  Expect   delays\nnear Metro Center. ',
    DateUpdated: '2026-09-21T00:00:00',
  }])

  assert.deepEqual(incidents, [{
    id: 'incident-1',
    severity: 'Minor',
    lines: ['RD', 'OR'],
    summary: 'Expect delays near Metro Center.',
    updatedAt: '2026-09-21T00:00:00',
  }])
})

test('retains the last successful departure result when WMATA becomes unavailable', async () => {
  const originalFetch = global.fetch
  const cacheDirectory = await mkdtemp(join(tmpdir(), 'metroboard-wmata-test-'))
  const client = new WmataClient({ apiKey: 'test-key', apiBaseUrl: 'https://wmata.test', cachePath: join(cacheDirectory, 'cache.json') })

  global.fetch = async (url) => ({
    ok: true,
    json: async () => String(url).includes('jStations')
      ? { Stations: [{ Code: 'A09', Name: 'Bethesda', LineCode1: 'RD' }] }
      : { Trains: [{ Destination: 'Shady Grove', Group: '1', Line: 'RD', Min: '3' }] },
  })

  const live = await client.getDepartures('A09', 'RD')
  assert.equal(live.source, 'live')
  assert.equal(live.departures[0].minutes, '3')

  global.fetch = async () => { throw new Error('network down') }
  const stale = await client.getDepartures('A09', 'RD')
  assert.equal(stale.source, 'cache')
  assert.equal(stale.stale, true)
  assert.equal(stale.departures[0].destination, 'Shady Grove')

  global.fetch = originalFetch
})
