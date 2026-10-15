// Delivery estimates built only from published facts:
//   - lead_time_days from products.json (making time, or time to send for stock pieces)
//   - shipping from brand.md: UK 3–5 days after making, EU 5–8 days
// Days are counted as calendar days. These are estimates, never promises.
import type { Product } from '../data/catalogue'
import { isOrderable } from '../data/catalogue'

export type Region = 'UK' | 'EU'

export const SHIPPING_DAYS: Record<Region, [number, number]> = {
  UK: [3, 5],
  EU: [5, 8],
}

export interface Estimate {
  earliest: Date
  latest: Date
  makingDays: number
  shipping: [number, number]
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + n)
  return x
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function estimate(p: Product, region: Region, orderDate: Date = new Date()): Estimate | null {
  if (!isOrderable(p)) return null
  const [lo, hi] = SHIPPING_DAYS[region]
  return {
    earliest: addDays(orderDate, p.lead_time_days + lo),
    latest: addDays(orderDate, p.lead_time_days + hi),
    makingDays: p.lead_time_days,
    shipping: [lo, hi],
  }
}

export type Fit = 'in-time' | 'tight' | 'too-late' | 'past'

export interface DateCheck {
  verdict: Fit
  spareDays: number // days between the latest estimate and the occasion (negative = after)
}

/** Compare an estimate with the customer's occasion date. Two days' margin before calling it "in time". */
export function checkDate(est: Estimate, occasion: Date, today: Date = new Date()): DateCheck {
  const occ = startOfDay(occasion)
  const day = 86_400_000
  if (occ < startOfDay(today)) return { verdict: 'past', spareDays: 0 }
  const spare = Math.round((occ.getTime() - est.latest.getTime()) / day)
  if (spare >= 2) return { verdict: 'in-time', spareDays: spare }
  const earlySpare = Math.round((occ.getTime() - est.earliest.getTime()) / day)
  if (earlySpare >= 0) return { verdict: 'tight', spareDays: spare }
  return { verdict: 'too-late', spareDays: spare }
}

export const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(d)

export const fmtRange = (e: Estimate) => `${fmtDate(e.earliest)} – ${fmtDate(e.latest)}`

export function makingLine(p: Product): string {
  return p.made_to_order
    ? `Made to order in our London studio in ${p.lead_time_days} days`
    : `Ships from stock, sent within ${p.lead_time_days} days`
}

/** Parse a yyyy-mm-dd value from <input type="date"> as a local date. */
export function parseISODate(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.getMonth() === Number(m[2]) - 1 ? d : null
}

export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export interface OrderBy {
  /** Latest order date whose latest estimated arrival is on or before the target. */
  date: Date
  target: Date
  /** True when that order date has already passed. */
  passed: boolean
}

/**
 * Christmas cut-off: the last day to order so the latest estimate (making time + the slow end
 * of published shipping) lands by Christmas Eve. Uses only catalogue and brand.md facts.
 */
export function christmasOrderBy(p: Product, region: Region, today: Date = new Date()): OrderBy | null {
  if (!isOrderable(p)) return null
  const t = startOfDay(today)
  let year = t.getFullYear()
  if (t > new Date(year, 11, 24)) year += 1
  const target = new Date(year, 11, 24)
  const date = addDays(target, -(p.lead_time_days + SHIPPING_DAYS[region][1]))
  return { date, target, passed: date < t }
}
