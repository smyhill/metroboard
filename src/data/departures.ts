export type Departure = {
  destination: string
  minutes: number
  track: string
}

/** Development fixture only. Replace with normalized backend data in the API milestone. */
export const bethesdaRedLineDepartures: Departure[] = [
  { destination: 'Shady Grove', minutes: 2, track: '1' },
  { destination: 'Glenmont', minutes: 5, track: '1' },
  { destination: 'Shady Grove', minutes: 12, track: '1' },
  { destination: 'Glenmont', minutes: 20, track: '1' },
]

export const railLines = ['Red', 'Orange', 'Blue', 'Silver', 'Green', 'Yellow'] as const
