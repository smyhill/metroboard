import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePredictions, normalizeStations } from './wmata.mjs'

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

test('normalizes canonical station records and removes duplicate line codes', () => {
  const stations = normalizeStations([
    { Code: 'A09', Name: 'Bethesda', LineCode1: 'RD', LineCode2: null },
    { Code: 'C01', Name: 'Metro Center', LineCode1: 'OR', LineCode2: 'BL', LineCode3: 'SV', LineCode4: 'RD' },
  ])

  assert.deepEqual(stations, [
    { code: 'A09', name: 'Bethesda', lines: ['RD'] },
    { code: 'C01', name: 'Metro Center', lines: ['OR', 'BL', 'SV', 'RD'] },
  ])
})
