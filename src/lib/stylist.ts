// Occasion stylist: deterministic, catalogue-grounded matching.
// It can only return products that exist in products.json, with their real prices.
// Every reason it gives is built from a catalogue field. It says when it can't help.
import {
  products as allProducts, isOrderable, occasionLabel, joinAnd, gbp,
  COLOURS, FABRICS, OCCASIONS, type Category, type Product,
} from '../data/catalogue'
import { checkDate, estimate, fmtDate, startOfDay, fmtRange, type Estimate, type Region, type DateCheck } from './delivery'

export interface Brief {
  occasion?: string
  eventDate?: Date
  region: Region
  maxBudget?: number
  categories?: Category[]
  colours?: string[]
  fabrics?: string[]
  size?: string
}

export interface Pick {
  product: Product
  reasons: string[]
  estimate: Estimate
  dateCheck?: DateCheck
  score: number
}

export interface StylistResult {
  status: 'ok' | 'none' | 'clarify'
  picks: Pick[]
  /** Plain statements about what the stylist could not use or does not know. */
  notes: string[]
  /** Suggestions that would produce matches, each built from the catalogue. */
  relaxations: string[]
  /** How many pieces matched everything except the delivery date. */
  lateCount: number
}

const UK_SIZES = ['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18']

function baseMatch(p: Product, b: Brief, ignore: Set<keyof Brief> = new Set()): boolean {
  if (!isOrderable(p)) return false
  if (b.occasion && !ignore.has('occasion') && !p.occasions.includes(b.occasion)) return false
  if (b.maxBudget != null && !ignore.has('maxBudget') && p.price_gbp > b.maxBudget) return false
  if (b.categories?.length && !ignore.has('categories') && !b.categories.includes(p.category)) return false
  if (b.colours?.length && !ignore.has('colours') && !p.colours.some((c) => b.colours!.includes(c))) return false
  if (b.fabrics?.length && !ignore.has('fabrics') && !b.fabrics.includes(p.fabric)) return false
  if (b.size && !ignore.has('size') && !p.sizes.includes(b.size) && !p.sizes.includes('one size')) return false
  return true
}

const inline = (o: string) => (o === "new year's eve" ? "New Year's Eve" : o)

function reasonsFor(p: Product, b: Brief, est: Estimate, dc?: DateCheck): string[] {
  const r: string[] = []
  if (b.occasion) r.push(`Listed for ${inline(b.occasion)}`)
  const col = b.colours?.filter((c) => p.colours.includes(c)) ?? []
  if (col.length) r.push(`Comes in ${joinAnd(col)}`)
  if (b.fabrics?.includes(p.fabric)) r.push(`Made in ${p.fabric}`)
  if (b.maxBudget != null) r.push(`${gbp(p.price_gbp)}, within your ${gbp(b.maxBudget)} budget`)
  if (b.size && p.sizes.includes(b.size)) r.push(`Offered in ${b.size}`)
  if (dc?.verdict === 'in-time') {
    r.push(`Estimated arrival ${fmtRange(est)}, ${dc.spareDays} days before your date`)
  } else if (dc?.verdict === 'tight') {
    r.push(`Estimated arrival ${fmtRange(est)}: close to your date`)
  }
  return r
}

export function recommend(b: Brief, today: Date = new Date(), limit = 3): StylistResult {
  const notes: string[] = []
  const hasAnything = b.occasion || b.maxBudget != null || b.categories?.length || b.colours?.length || b.fabrics?.length
  if (!hasAnything) {
    return { status: 'clarify', picks: [], notes: ['Tell me the occasion, or a budget or type of piece, and I can narrow the 48 pieces down.'], relaxations: [], lateCount: 0 }
  }
  if (b.size && !UK_SIZES.includes(b.size)) {
    notes.push(`Our pieces are listed in UK 6 to 18. I don't know how ${b.size} would fit, so I haven't filtered by size.`)
    b = { ...b, size: undefined }
  }
  if (b.eventDate && startOfDay(b.eventDate) < startOfDay(today)) {
    notes.push(`${fmtDate(b.eventDate)} has already passed, so I've ignored the date.`)
    b = { ...b, eventDate: undefined }
  }

  const matches = allProducts.filter((p) => baseMatch(p, b))
  let lateCount = 0
  const picks: Pick[] = []
  for (const p of matches) {
    const est = estimate(p, b.region, today)!
    const dc = b.eventDate ? checkDate(est, b.eventDate, today) : undefined
    if (dc?.verdict === 'too-late') { lateCount++; continue }
    let score = 0
    if (b.colours?.length) score += p.colours.filter((c) => b.colours!.includes(c)).length * 2
    if (b.fabrics?.includes(p.fabric)) score += 2
    if (dc?.verdict === 'in-time') score += 3 + Math.min(dc.spareDays, 14) / 14
    if (dc?.verdict === 'tight') score += 0.5
    if (b.categories?.length || p.category === 'dress' || p.category === 'jumpsuit') score += 0.5 // whole outfits first
    if (b.maxBudget != null) score += 1 - Math.abs(b.maxBudget - p.price_gbp) / b.maxBudget * 0.5
    picks.push({ product: p, reasons: reasonsFor(p, b, est, dc), estimate: est, dateCheck: dc, score })
  }
  picks.sort((a, z) => z.score - a.score || a.product.price_gbp - z.product.price_gbp)

  if (picks.length) {
    if (lateCount) notes.push(`${lateCount} more ${lateCount === 1 ? 'piece matches' : 'pieces match'} but would probably not arrive before ${fmtDate(b.eventDate!)}.`)
    return { status: 'ok', picks: picks.slice(0, limit), notes, relaxations: [], lateCount }
  }

  // Nothing matched: explain which single change would produce matches, using real counts and prices.
  const relaxations: string[] = []
  if (lateCount) {
    relaxations.push(`${lateCount} ${lateCount === 1 ? 'piece matches' : 'pieces match'} everything except the date: the published making and delivery times run past ${fmtDate(b.eventDate!)}.`)
  }
  if (b.maxBudget != null) {
    const over = allProducts.filter((p) => baseMatch(p, b, new Set(['maxBudget'])))
    if (over.length) {
      const cheapest = Math.min(...over.map((p) => p.price_gbp))
      relaxations.push(`With a budget of ${gbp(cheapest)} or more, ${over.length} ${over.length === 1 ? 'piece fits' : 'pieces fit'} the rest of your brief.`)
    }
  }
  for (const [key, label] of [['colours', 'colour'], ['fabrics', 'fabric'], ['categories', 'type of piece'], ['occasion', 'occasion']] as const) {
    if (!b[key] || (Array.isArray(b[key]) && !(b[key] as unknown[]).length)) continue
    const n = allProducts.filter((p) => baseMatch(p, b, new Set([key]))).length
    if (n) relaxations.push(`Without the ${label} filter, ${n} ${n === 1 ? 'piece matches' : 'pieces match'}.`)
  }
  if (!relaxations.length) relaxations.push('Try fewer preferences at once. If you need something we don\'t list, the studio can tell you what is possible.')
  return { status: 'none', picks: [], notes, relaxations, lateCount }
}

// ---------- Free-text reading (deterministic keyword parsing, no language model) ----------

export interface ParsedText {
  brief: Partial<Brief>
  understood: string[]
  notes: string[]
}

const OCCASION_WORDS: [RegExp, string][] = [
  [/\bwinter wedding\b/, 'winter wedding'],
  [/\bwedding\b/, 'winter wedding'],
  [/\bblack[ -]?tie\b/, 'black tie'],
  [/\b(gala|ball)\b/, 'gala'],
  [/\b(new year'?s?( eve)?|nye|hogmanay)\b/, "new year's eve"],
  [/\b(christmas|xmas|office party|festive party)\b/, 'christmas party'],
  [/\bcocktails?\b/, 'cocktail'],
  [/\bengagement\b/, 'engagement party'],
  [/\b(dinner|supper)\b/, 'dinner'],
]

const COLOUR_WORDS: [RegExp, string[], string?][] = [
  [/\bblack\b/, ['black']],
  [/\bchampagne\b/, ['champagne']],
  [/\bdusty rose\b/, ['dusty rose']],
  [/\bemerald\b/, ['emerald']],
  [/\bivory\b/, ['ivory']],
  [/\bmidnight\b/, ['midnight']],
  [/\boxblood\b/, ['oxblood']],
  [/\bpewter\b/, ['pewter']],
  [/\bsapphire\b/, ['sapphire']],
  [/\b(red|burgundy|wine|maroon)\b/, ['oxblood'], 'oxblood'],
  [/\bgreen\b/, ['emerald'], 'emerald'],
  [/\b(navy|dark blue)\b/, ['midnight'], 'midnight'],
  [/\bblue\b/, ['sapphire', 'midnight'], 'sapphire or midnight'],
  [/\b(pink|blush|rose)\b/, ['dusty rose'], 'dusty rose'],
  [/\bgold(en)?\b/, ['champagne'], 'champagne'],
  [/\b(silver|grey|gray)\b/, ['pewter'], 'pewter'],
  [/\b(white|cream)\b/, ['ivory'], 'ivory'],
]
const UNLISTED_COLOURS = /\b(yellow|orange|purple|lilac|lavender|brown|beige|teal|turquoise|coral|mint|print(ed)?|floral)\b/

const FABRIC_WORDS: [RegExp, string[]][] = [
  [/\bwool crepe\b/, ['wool crepe']],
  [/\bcrepe\b/, ['crepe', 'wool crepe']],
  [/\bduchess satin\b/, ['duchess satin']],
  [/\bsilk satin\b/, ['silk satin']],
  [/\bsilk\b/, ['silk satin']],
  [/\bsatin\b/, ['duchess satin', 'silk satin']],
  [/\bvelvet\b/, ['velvet']],
  [/\bchiffon\b/, ['chiffon']],
  [/\bjersey\b/, ['jersey']],
  [/\b(sequin(s|ned)?|sparkl\w*|tulle)\b/, ['sequinned tulle']],
]
const UNLISTED_FABRICS = /\b(lace|linen|cotton|leather|denim|cashmere|organza|taffeta)\b/

const CATEGORY_WORDS: [RegExp, Category][] = [
  [/\b(dress|dresses|gown|gowns)\b/, 'dress'],
  [/\bjumpsuits?\b/, 'jumpsuit'],
  [/\b(top|tops|blouse)\b/, 'top'],
  [/\bskirts?\b/, 'skirt'],
  [/\b(coat|coats|jacket|jackets|outerwear|cape)\b/, 'outerwear'],
  [/\b(clutch|bag|scarf|accessor(y|ies))\b/, 'accessory'],
]

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function parseDate(t: string, today: Date): { date?: Date; failed?: boolean } {
  const rollForward = (d: Date) => (d < new Date(today.getFullYear(), today.getMonth(), today.getDate()) ? new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()) : d)
  let m = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b(?:\s+(\d{4}))?/.exec(t)
  if (m) {
    const d = new Date(m[3] ? Number(m[3]) : today.getFullYear(), MONTHS.indexOf(m[2]), Number(m[1]))
    return { date: m[3] ? d : rollForward(d) }
  }
  m = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b(?:,?\s+(\d{4}))?/.exec(t)
  if (m) {
    const d = new Date(m[3] ? Number(m[3]) : today.getFullYear(), MONTHS.indexOf(m[1]), Number(m[2]))
    return { date: m[3] ? d : rollForward(d) }
  }
  m = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(t)
  if (m) {
    const y = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : today.getFullYear()
    const d = new Date(y, Number(m[2]) - 1, Number(m[1])) // UK order: day/month
    if (d.getMonth() !== Number(m[2]) - 1) return { failed: true }
    return { date: m[3] ? d : rollForward(d) }
  }
  if (/\b(new year'?s? eve|nye)\b/.test(t) && !/\b\d/.test(t)) {
    return { date: new Date(today.getFullYear(), 11, 31) }
  }
  if (/\b(next|this)\s+(week|weekend|month|mon|tue|wed|thu|fri|sat|sun)\w*|\btomorrow\b|\bin \d+ (days|weeks)\b/.test(t)) return { failed: true }
  return {}
}

export function parseText(input: string, today: Date = new Date()): ParsedText {
  const t = input.toLowerCase().replace(/[’]/g, "'")
  const brief: Partial<Brief> = {}
  const understood: string[] = []
  const notes: string[] = []

  for (const [re, occ] of OCCASION_WORDS) {
    if (re.test(t)) {
      brief.occasion = occ
      understood.push(`occasion: ${occasionLabel(occ)}`)
      if (occ === 'winter wedding' && !/winter wedding/.test(t)) notes.push('I read "wedding" as a winter wedding, the wedding occasion our pieces are listed for.')
      break
    }
  }

  const budget = /£\s?(\d{2,4})|(\d{2,4})\s*(?:pounds|gbp|quid)\b|\b(?:under|below|less than|up to|max(?:imum)?|no more than|budget(?: of| is)?)\s+(\d{2,4})\b/.exec(t)
  if (budget) {
    brief.maxBudget = Number(budget[1] ?? budget[2] ?? budget[3])
    understood.push(`budget: up to ${gbp(brief.maxBudget)}`)
  } else if (/\b(cheap|affordable|budget|inexpensive)\b/.test(t)) {
    notes.push('Give me a figure (for example "under £350") and I can filter by price.')
  }

  const cats = CATEGORY_WORDS.filter(([re]) => re.test(t)).map(([, c]) => c)
  if (cats.length) { brief.categories = [...new Set(cats)]; understood.push(`type: ${brief.categories.join(', ')}`) }

  const colours = new Set<string>()
  for (const [re, cs, mappedTo] of COLOUR_WORDS) {
    const m = re.exec(t)
    if (m && !(m[0] === 'rose' && /dusty rose/.test(t))) {
      cs.forEach((c) => colours.add(c))
      if (mappedTo) notes.push(`We don't list "${m[0]}", so I looked for ${mappedTo}, the closest listed colour.`)
    }
  }
  if (colours.size) { brief.colours = [...colours]; understood.push(`colour: ${brief.colours.join(', ')}`) }
  const unlisted = UNLISTED_COLOURS.exec(t)
  if (unlisted) notes.push(`No pieces are listed in ${unlisted[0]}. Our colours are ${joinAnd([...COLOURS])}.`)

  const fabrics = new Set<string>()
  const ft = t.replace(/wool crepe|duchess satin|silk satin/g, (s) => { FABRIC_WORDS.forEach(([re, fs]) => { if (re.test(s) && fs.length === 1) fs.forEach((f) => fabrics.add(f)) }); return ' ' })
  for (const [re, fs] of FABRIC_WORDS) if (re.test(ft)) fs.forEach((f) => fabrics.add(f))
  if (fabrics.size) { brief.fabrics = [...fabrics]; understood.push(`fabric: ${brief.fabrics.join(', ')}`) }
  const unlistedFabric = UNLISTED_FABRICS.exec(t)
  if (unlistedFabric) notes.push(`We don't list any pieces in ${unlistedFabric[0]}. Our fabrics are ${joinAnd([...FABRICS])}.`)

  const size = /\b(?:uk\s*|size\s*)(\d{1,2})\b/.exec(t)
  if (size) {
    brief.size = `UK ${size[1]}`
    understood.push(`size: ${brief.size}`)
  }

  const region = /\b(france|germany|spain|italy|netherlands|ireland|belgium|portugal|austria|eu|europe|paris|berlin|madrid|rome|amsterdam|dublin|lisbon)\b/.exec(t)
  if (region) { brief.region = 'EU'; understood.push('delivery: EU') }
  else if (/\b(usa|america|canada|australia|new york|dubai)\b/.test(t)) notes.push('We deliver to the UK and the EU only, so I can\'t estimate delivery elsewhere.')

  const date = parseDate(t, today)
  if (date.date) { brief.eventDate = date.date; understood.push(`date: ${fmtDate(date.date)}`) }
  else if (date.failed) notes.push('I couldn\'t read an exact date from that. Pick the date in the calendar and I\'ll check delivery.')

  if (!understood.length) notes.push('I couldn\'t match that to an occasion, budget, colour, fabric or type of piece.')
  return { brief, understood, notes }
}

export const OCCASION_OPTIONS = OCCASIONS
