export interface Reading {
  occasion: string | null
  occasionMappedFrom: string | null
  occasionUnlisted: string | null
  ambiguous: { said: string; options: string[] } | null
  maxBudget: number | null
  categories: string[]
  colours: string[]
  colourMappings: { said: string; as: string[] }[]
  coloursUnlisted: string[]
  fabrics: string[]
  fabricsUnlisted: string[]
  fits: string[]
  sizeUk: number | null
  eventDate: string | null
  dateUnclear: string | null
  region: 'UK' | 'EU' | null
  regionUnsupported: string | null
  unsupported: string[]
  namedProducts: string[]
}

export const ALLOWED: {
  occasions: string[]
  categories: string[]
  colours: string[]
  fabrics: string[]
  fits: string[]
  regions: string[]
}
export const READING_TOOL: { name: string; description: string; input_schema: Record<string, unknown> }
export function emptyReading(): Reading
export function sanitizeReading(raw: unknown, customerText: string, todayISO: string): Reading
