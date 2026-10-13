// Reads a customer's request: Claude via the server function when it is configured, otherwise
// fixed rules. Whatever comes back from the server is treated as untrusted and validated again.
import { sanitizeReading } from '../../shared/brief-schema.js'
import { toISODate } from './delivery'
import { interpretReading, parseText, type Interpreted } from './stylist'

export type ReaderSource = 'model' | 'rules'
export interface ReadResult extends Interpreted { source: ReaderSource }

const ENDPOINT = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/read-brief`
const TIMEOUT_MS = 9000
let modelUnavailable = false // set once the server says no model is configured, to skip the wait

export async function readRequest(text: string, today: Date = new Date()): Promise<ReadResult> {
  const fallback = (): ReadResult => ({ ...parseText(text, today), source: 'rules' })
  if (modelUnavailable) return fallback()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, today: toISODate(today) }),
      signal: controller.signal,
    })
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
      if (res.status === 503 || res.status === 404 || res.status === 405) {
        const body = await res.json().catch(() => null)
        if (res.status !== 503 || body?.error === 'not_configured') modelUnavailable = true
      }
      return fallback()
    }
    const body = await res.json()
    if (body?.source !== 'model' || !body.reading) return fallback()
    const reading = sanitizeReading(body.reading, text, toISODate(today))
    const out = interpretReading(reading)
    // If the model understood nothing usable, the rules may still catch something.
    if (!out.understood.length && !out.notes.length) return fallback()
    return { ...out, source: 'model' }
  } catch {
    return fallback()
  } finally {
    clearTimeout(timer)
  }
}

/** Test hook. */
export function resetReader() { modelUnavailable = false }
