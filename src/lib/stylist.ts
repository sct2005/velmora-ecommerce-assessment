// Occasion stylist: deterministic, catalogue-grounded matching.
// It can only return products that exist in products.json, with their real prices.
// Every reason it gives is built from a catalogue field. It says when it can't help.
//
// Flow: customer text -> reading (rules here, or Claude via /api/read-brief) -> sanitizeReading()
//       -> interpretReading() -> Brief -> recommend() over products.json.
import {
  products as allProducts, isOrderable, occasionLabel, joinAnd, joinOr, gbp,
  COLOURS, FABRICS, OCCASIONS, type Category, type Product,
} from '../data/catalogue'
import { ALLOWED, emptyReading, sanitizeReading, type Reading } from '../../shared/brief-schema.js'
import { checkDate, estimate, fmtDate, startOfDay, fmtRange, toISODate, parseISODate, type Estimate, type Region, type DateCheck } from './delivery'

export interface Brief {
  occasion?: string
  eventDate?: Date
  region: Region
  maxBudget?: number
  categories?: Category[]
  colours?: string[]
  fabrics?: string[]
  fits?: string[]
  /** Collection names the customer asked for, e.g. "Vela". */
  names?: string[]
  size?: string
}

export interface Pick {
  product: Product
  reasons: string[]
  /** For closest alternatives: how this piece differs from what was asked. */
  differs?: string
  estimate: Estimate
  dateCheck?: DateCheck
  score: number
}

export interface StylistResult {
  status: 'ok' | 'none' | 'clarify'
  picks: Pick[]
  /** When nothing matches: the closest real pieces, with how they differ. */
  alternatives: { label: string; picks: Pick[] } | null
  /** Plain statements about what the stylist could not use or does not know. */
  notes: string[]
  /** Suggestions that would produce matches, each built from the catalogue. */
  relaxations: string[]
  /** How many pieces matched everything except the delivery date. */
  lateCount: number
}

const UK_SIZES = ['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18']
export const LINE_NAMES = [...new Set(allProducts.map((p) => p.name.split(' ')[0].toLowerCase()))]

type Key = 'occasion' | 'maxBudget' | 'categories' | 'colours' | 'fabrics' | 'fits' | 'names' | 'size'

function baseMatch(p: Product, b: Brief, ignore: Set<Key> = new Set()): boolean {
  if (!isOrderable(p)) return false
  if (b.occasion && !ignore.has('occasion') && !p.occasions.includes(b.occasion)) return false
  if (b.maxBudget != null && !ignore.has('maxBudget') && p.price_gbp > b.maxBudget) return false
  if (b.categories?.length && !ignore.has('categories') && !b.categories.includes(p.category)) return false
  if (b.colours?.length && !ignore.has('colours') && !p.colours.some((c) => b.colours!.includes(c))) return false
  if (b.fabrics?.length && !ignore.has('fabrics') && !b.fabrics.includes(p.fabric)) return false
  if (b.fits?.length && !ignore.has('fits') && !(p.fit && b.fits.includes(p.fit))) return false
  if (b.names?.length && !ignore.has('names') && !b.names.includes(p.name.split(' ')[0].toLowerCase())) return false
  if (b.size && !ignore.has('size') && !p.sizes.includes(b.size) && !p.sizes.includes('one size')) return false
  return true
}

const inline = (o: string) => (o === "new year's eve" ? "New Year's Eve" : o)

function reasonsFor(p: Product, b: Brief, est: Estimate, dc?: DateCheck): string[] {
  const r: string[] = []
  if (b.occasion && p.occasions.includes(b.occasion)) r.push(`Listed for ${inline(b.occasion)}`)
  const col = b.colours?.filter((c) => p.colours.includes(c)) ?? []
  if (col.length) r.push(`Comes in ${joinAnd(col)}`)
  if (b.fabrics?.includes(p.fabric)) r.push(`Made in ${p.fabric}`)
  if (p.fit && b.fits?.includes(p.fit)) r.push(`${p.fit.charAt(0).toUpperCase() + p.fit.slice(1)} cut`)
  if (b.maxBudget != null && p.price_gbp <= b.maxBudget) r.push(`${gbp(p.price_gbp)}, within your ${gbp(b.maxBudget)} budget`)
  if (b.size && p.sizes.includes(b.size)) r.push(`Offered in ${b.size}`)
  if (dc?.verdict === 'in-time') {
    r.push(`Estimated arrival ${fmtRange(est)}, ${dc.spareDays} days before your date`)
  } else if (dc?.verdict === 'tight') {
    r.push(`Estimated arrival ${fmtRange(est)}: close to your date`)
  }
  return r
}

function score(p: Product, b: Brief, dc?: DateCheck): number {
  let s = 0
  if (b.colours?.length) s += p.colours.filter((c) => b.colours!.includes(c)).length * 2
  if (b.fabrics?.includes(p.fabric)) s += 2
  if (p.fit && b.fits?.includes(p.fit)) s += 2
  if (dc?.verdict === 'in-time') s += 3 + Math.min(dc.spareDays, 14) / 14
  if (dc?.verdict === 'tight') s += 0.5
  if (b.categories?.length || p.category === 'dress' || p.category === 'jumpsuit') s += 0.5 // whole outfits first
  if (b.maxBudget != null) s += 1 - (Math.abs(b.maxBudget - p.price_gbp) / b.maxBudget) * 0.5
  return s
}

function picksFor(b: Brief, today: Date, ignore: Set<Key> = new Set()) {
  let lateCount = 0
  const picks: Pick[] = []
  for (const p of allProducts.filter((x) => baseMatch(x, b, ignore))) {
    const est = estimate(p, b.region, today)!
    const dc = b.eventDate ? checkDate(est, b.eventDate, today) : undefined
    if (dc?.verdict === 'too-late') { lateCount++; continue }
    picks.push({ product: p, reasons: reasonsFor(p, b, est, dc), estimate: est, dateCheck: dc, score: score(p, b, dc) })
  }
  picks.sort((a, z) => z.score - a.score || a.product.price_gbp - z.product.price_gbp)
  return { picks, lateCount }
}

function differsText(key: Key, p: Product, b: Brief): string {
  switch (key) {
    case 'maxBudget': return `${gbp(p.price_gbp)}: ${gbp(p.price_gbp - b.maxBudget!)} over your ${gbp(b.maxBudget!)} budget`
    case 'colours': return `Not in ${joinOr(b.colours!)}: comes in ${joinOr(p.colours)}`
    case 'fabrics': return `Not in ${joinOr(b.fabrics!)}: made in ${p.fabric}`
    case 'fits': return `Not ${joinOr(b.fits!)}: ${p.fit ?? 'cut not recorded'}`
    case 'categories': return `A ${p.category}, not a ${joinOr(b.categories!)}`
    case 'names': return `From the ${p.name.split(' ')[0]} line, not ${joinOr(b.names!.map((n) => n[0].toUpperCase() + n.slice(1)))}`
    case 'occasion': return `Listed for ${joinAnd(p.occasions.map(inline))}, not ${inline(b.occasion!)}`
    default: return ''
  }
}

const ALT_LABEL: Record<Key, (b: Brief) => string> = {
  maxBudget: (b) => `Closest options, above your ${gbp(b.maxBudget!)} budget`,
  colours: () => 'Closest options, in other colours',
  fabrics: () => 'Closest options, in other fabrics',
  fits: () => 'Closest options, in other cuts',
  categories: () => 'Closest options, in other types of piece',
  names: () => 'Closest options, from other lines',
  occasion: (b) => `Closest options, not listed for ${inline(b.occasion!)}`,
  size: () => '',
}

export function recommend(b: Brief, today: Date = new Date(), limit = 3): StylistResult {
  const notes: string[] = []
  const hasAnything = b.occasion || b.maxBudget != null || b.categories?.length || b.colours?.length || b.fabrics?.length || b.fits?.length || b.names?.length
  if (!hasAnything) {
    return { status: 'clarify', picks: [], alternatives: null, notes: ['Tell me the occasion, or a budget, colour or type of piece, and I can narrow the 48 pieces down.'], relaxations: [], lateCount: 0 }
  }
  if (b.size && !UK_SIZES.includes(b.size)) {
    notes.push(`Our pieces are listed in UK 6 to 18 (even sizes). The catalogue doesn't list ${b.size}, so I haven't filtered by size and can't say how a piece would fit.`)
    b = { ...b, size: undefined }
  }
  if (b.eventDate && startOfDay(b.eventDate) < startOfDay(today)) {
    notes.push(`${fmtDate(b.eventDate)} has already passed, so I've ignored the date.`)
    b = { ...b, eventDate: undefined }
  }

  const { picks, lateCount } = picksFor(b, today)
  if (picks.length) {
    if (lateCount) notes.push(`${lateCount} more ${lateCount === 1 ? 'piece matches' : 'pieces match'} but would probably not arrive before ${fmtDate(b.eventDate!)}.`)
    return { status: 'ok', picks: picks.slice(0, limit), alternatives: null, notes, relaxations: [], lateCount }
  }

  // Nothing matched. Explain which single change would produce matches, with real counts and prices,
  // and show the closest real pieces for the first such change.
  const relaxations: string[] = []
  if (lateCount) {
    relaxations.push(`${lateCount} ${lateCount === 1 ? 'piece matches' : 'pieces match'} everything except the date: the published making and delivery times run past ${fmtDate(b.eventDate!)}.`)
  }
  let alternatives: StylistResult['alternatives'] = null
  const order: [Key, string][] = [['maxBudget', 'budget'], ['colours', 'colour'], ['fits', 'cut'], ['fabrics', 'fabric'], ['categories', 'type of piece'], ['names', 'line'], ['occasion', 'occasion']]
  for (const [key, label] of order) {
    const v = b[key as keyof Brief]
    if (v == null || (Array.isArray(v) && !v.length)) continue
    const alt = picksFor(b, today, new Set([key]))
    if (!alt.picks.length) continue
    if (key === 'maxBudget') {
      const cheapest = Math.min(...alt.picks.map((p) => p.product.price_gbp))
      relaxations.push(`With a budget of ${gbp(cheapest)} or more, ${alt.picks.length} ${alt.picks.length === 1 ? 'piece fits' : 'pieces fit'} the rest of your request.`)
      alt.picks.sort((a, z) => a.product.price_gbp - z.product.price_gbp)
    } else {
      relaxations.push(`Without the ${label} preference, ${alt.picks.length} ${alt.picks.length === 1 ? 'piece matches' : 'pieces match'}.`)
    }
    if (!alternatives) {
      alternatives = {
        label: ALT_LABEL[key](b),
        picks: alt.picks.slice(0, 2).map((p) => ({ ...p, differs: differsText(key, p.product, b) })),
      }
    }
  }
  if (!relaxations.length) relaxations.push("Try fewer preferences at once. If you need something we don't list, the studio can tell you what is possible.")
  return { status: 'none', picks: [], alternatives, notes, relaxations, lateCount }
}

// ---------- Turning a validated reading into a brief and plain-English notes ----------

export interface Interpreted {
  brief: Partial<Brief>
  understood: string[]
  notes: string[]
}

const q = (s: string) => `"${s}"`

export function interpretReading(r: Reading): Interpreted {
  const brief: Partial<Brief> = {}
  const understood: string[] = []
  const notes: string[] = []

  if (r.occasion) {
    brief.occasion = r.occasion
    understood.push(`occasion: ${occasionLabel(r.occasion)}`)
    if (r.occasionMappedFrom) notes.push(`I read ${q(r.occasionMappedFrom)} as a winter wedding, the wedding occasion our pieces are listed for.`)
  } else if (r.occasionUnlisted) {
    notes.push(`We don't list pieces for ${q(r.occasionUnlisted)}. Our pieces are listed for ${joinAnd(OCCASIONS.map(inline))}. Choose the closest below.`)
  } else if (r.ambiguous) {
    notes.push(`${q(r.ambiguous.said)} could mean ${joinOr(r.ambiguous.options.map(inline))}. Choose one below to narrow it down.`)
  }

  if (r.maxBudget != null) { brief.maxBudget = r.maxBudget; understood.push(`budget: up to ${gbp(r.maxBudget)}`) }
  if (r.categories.length) { brief.categories = r.categories as Category[]; understood.push(`type: ${r.categories.join(', ')}`) }
  if (r.colours.length) { brief.colours = r.colours; understood.push(`colour: ${r.colours.join(', ')}`) }
  for (const m of r.colourMappings) notes.push(`We don't list ${q(m.said)}, so I looked for ${joinOr(m.as)}, the closest listed colour.`)
  if (r.coloursUnlisted.length) notes.push(`No pieces are listed in ${joinOr(r.coloursUnlisted.map(q))}. Our colours are ${joinAnd([...COLOURS])}.`)
  if (r.fabrics.length) { brief.fabrics = r.fabrics; understood.push(`fabric: ${r.fabrics.join(', ')}`) }
  if (r.fabricsUnlisted.length) notes.push(`We don't list any pieces in ${joinOr(r.fabricsUnlisted.map(q))}. Our fabrics are ${joinAnd([...FABRICS])}.`)
  if (r.fits.length) { brief.fits = r.fits; understood.push(`cut: ${r.fits.join(', ')}`) }
  if (r.sizeUk != null) { brief.size = `UK ${r.sizeUk}`; understood.push(`size: UK ${r.sizeUk}`) }
  if (r.region) { brief.region = r.region; understood.push(`delivery: ${r.region}`) }
  else if (r.regionUnsupported) notes.push(`We deliver to the UK and the EU only, so I can't estimate delivery to ${q(r.regionUnsupported)}.`)
  if (r.eventDate) {
    const d = parseISODate(r.eventDate)
    if (d) { brief.eventDate = d; understood.push(`date: ${fmtDate(d)}`) }
  } else if (r.dateUnclear) {
    notes.push(`I couldn't read an exact date from ${q(r.dateUnclear)}. Pick the date in the calendar and I'll check delivery.`)
  }

  for (const u of r.unsupported) {
    if (/review|rating|testimonial/.test(u)) notes.push('Velmora has no customer reviews yet, so I can only describe what the catalogue records.')
    else if (/discount|sale|offer|promo|code|deal/.test(u)) notes.push('The catalogue lists no discounts. Every price shown is the listed price.')
    else if (/stock|available|availability|sold out/.test(u)) notes.push("The catalogue doesn't give stock counts. Made-to-order pieces are made for you; pieces that ship from stock say so on their page.")
    else if (/popular|best ?sell|trending/.test(u)) notes.push("I don't have sales or popularity data for individual pieces.")
    else notes.push(`The catalogue doesn't record ${q(u)}, so I can't filter by it. Each piece's page lists its fabric, cut, colours and sizes.`)
  }

  const known = r.namedProducts.filter((n) => LINE_NAMES.includes(n.split(' ')[0]))
  const unknown = r.namedProducts.filter((n) => !LINE_NAMES.includes(n.split(' ')[0]))
  if (known.length) { brief.names = [...new Set(known.map((n) => n.split(' ')[0]))]; understood.push(`line: ${brief.names.join(', ')}`) }
  for (const n of unknown) notes.push(`We don't have a piece called ${q(n)}. I only suggest pieces from the 48 Velmora makes, at their listed prices.`)

  return { brief, understood, notes: [...new Set(notes)] }
}

// ---------- Rule-based reader (deterministic keyword matching, no language model) ----------

const OCCASION_WORDS: [RegExp, string][] = [
  [/\bwinter wedding\b/, 'winter wedding'],
  [/\bblack[ -]?tie\b/, 'black tie'],
  [/\b(gala|ball)\b/, 'gala'],
  [/\b(new year'?s?( eve)?|nye|hogmanay)\b/, "new year's eve"],
  [/\b(christmas|xmas|office party|festive party)\b/, 'christmas party'],
  [/\bcocktails?\b/, 'cocktail'],
  [/\bengagement\b/, 'engagement party'],
  [/\b(dinner|supper)\b/, 'dinner'],
]
const UNLISTED_OCCASIONS = /\b((summer|spring|autumn|beach|garden) wedding|graduation|prom|funeral|christening|races|race day|interview|garden party|beach)\b/
const PLAIN_WEDDING = /\bwedding( guest)?\b/
const PARTY = /\bparty\b/

const COLOUR_WORDS: [RegExp, string[], boolean][] = [
  [/\bblack\b/, ['black'], false],
  [/\bchampagne\b/, ['champagne'], false],
  [/\bdusty rose\b/, ['dusty rose'], false],
  [/\bemerald\b/, ['emerald'], false],
  [/\bivory\b/, ['ivory'], false],
  [/\bmidnight\b/, ['midnight'], false],
  [/\boxblood\b/, ['oxblood'], false],
  [/\bpewter\b/, ['pewter'], false],
  [/\bsapphire\b/, ['sapphire'], false],
  [/\b(red|burgundy|wine|maroon|claret)\b/, ['oxblood'], true],
  [/\bgreen\b/, ['emerald'], true],
  [/\b(navy|dark blue)\b/, ['midnight'], true],
  [/\bblue\b/, ['sapphire', 'midnight'], true],
  [/\b(pink|blush|rose)\b/, ['dusty rose'], true],
  [/\bgold(en)?\b/, ['champagne'], true],
  [/\b(silver|grey|gray)\b/, ['pewter'], true],
  [/\b(white|cream)\b/, ['ivory'], true],
]
const UNLISTED_COLOURS = /\b(yellow|orange|purple|lilac|lavender|brown|beige|teal|turquoise|coral|mint|printed|print|floral)\b/g

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
const UNLISTED_FABRICS = /\b(lace|linen|cotton|leather|denim|cashmere|organza|taffeta|tweed)\b/g

const FIT_WORDS: [RegExp, string][] = [
  [/\ba[ -]line\b/, 'A-line'],
  [/\bbias[ -]?cut\b/, 'bias-cut'],
  [/\bcolumn\b/, 'column'],
  [/\bdraped?\b/, 'draped'],
  [/\b(fitted|bodycon|figure[ -]hugging|body[ -]skimming)\b/, 'fitted'],
  [/\b(relaxed|loose)\b/, 'relaxed'],
  [/\b(structured|tailored)\b/, 'structured'],
  [/\bwrap\b/, 'wrap'],
]

const CATEGORY_WORDS: [RegExp, Category][] = [
  [/\b(dress|dresses|gown|gowns)\b/, 'dress'],
  [/\bjumpsuits?\b/, 'jumpsuit'],
  [/\b(top|tops|blouse)\b/, 'top'],
  [/\bskirts?\b/, 'skirt'],
  [/\b(coat|coats|jacket|jackets|outerwear|cape)\b/, 'outerwear'],
  [/\b(clutch|bag|scarf|accessor(y|ies))\b/, 'accessory'],
]

const UNSUPPORTED = /\b(long sleeves?|short sleeves?|sleeveless|sleeves?|strapless|backless|halter( neck)?|v[ -]neck|neckline|off[ -]the[ -]shoulder|midi|maxi|mini|floor[ -]length|knee[ -]length|pockets?|petite|plus[ -]size|maternity|sustainable|machine washable|washable|reviews?|ratings?|testimonials?|best[ -]?sellers?|best[ -]?selling|most popular|popular|trending|discounts?|on sale|sale|promo code|offers?|in stock|stock|sold out)\b/g

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function ruleDate(t: string, today: Date): { date?: Date; unclear?: string } {
  const rollForward = (d: Date) => (d < startOfDay(today) ? new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()) : d)
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
    if (d.getMonth() !== Number(m[2]) - 1) return { unclear: m[0] }
    return { date: m[3] ? d : rollForward(d) }
  }
  if (/\b(new year'?s? eve|nye)\b/.test(t) && !/\b\d/.test(t)) return { date: new Date(today.getFullYear(), 11, 31) }
  const vague = /\b(next|this)\s+(week|weekend|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\btomorrow\b|\bin \d+ (days|weeks)\b|\bthe \d{1,2}(st|nd|rd|th)\b/.exec(t)
  return vague ? { unclear: vague[0] } : {}
}

/** Read free text with fixed rules. Returns a raw reading (to be sanitised like any other). */
export function ruleReading(input: string, today: Date = new Date()): Reading {
  const t = input.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ')
  const r = emptyReading()

  const unlistedOcc = UNLISTED_OCCASIONS.exec(t)
  for (const [re, occ] of OCCASION_WORDS) if (re.test(t)) { r.occasion = occ; break }
  if (!r.occasion && unlistedOcc) r.occasionUnlisted = unlistedOcc[0]
  if (!r.occasion && !r.occasionUnlisted) {
    const w = PLAIN_WEDDING.exec(t)
    if (w) { r.occasion = 'winter wedding'; r.occasionMappedFrom = w[0] }
    else if (PARTY.test(t)) r.ambiguous = { said: 'party', options: ['christmas party', 'cocktail', "new year's eve", 'engagement party'] }
  }

  const budget = /£\s?(\d{2,5})|(\d{2,5})\s*(?:pounds|gbp|quid)\b|\b(?:under|below|less than|up to|max(?:imum)?|no more than|budget(?: of| is)?)\s+(\d{2,5})\b/.exec(t)
  if (budget) r.maxBudget = Number(budget[1] ?? budget[2] ?? budget[3])

  r.categories = [...new Set(CATEGORY_WORDS.filter(([re]) => re.test(t)).map(([, c]) => c))]

  const ct = t.replace(/\bblack[ -]?tie\b/g, ' ') // "black tie" is an occasion, not a colour
  for (const [re, cs, mapped] of COLOUR_WORDS) {
    const m = re.exec(ct)
    if (!m || (m[0] === 'rose' && /dusty rose/.test(ct)) || (m[0] === 'blue' && /dark blue/.test(ct))) continue
    cs.forEach((c) => { if (!r.colours.includes(c)) r.colours.push(c) })
    if (mapped) r.colourMappings.push({ said: m[0], as: cs })
  }
  r.coloursUnlisted = [...new Set([...t.matchAll(UNLISTED_COLOURS)].map((m) => m[0]))]

  const fabrics = new Set<string>()
  const ft = t.replace(/wool crepe|duchess satin|silk satin/g, (s) => { fabrics.add(s); return ' ' })
  for (const [re, fs] of FABRIC_WORDS) if (re.test(ft)) fs.forEach((f) => fabrics.add(f))
  r.fabrics = [...fabrics]
  r.fabricsUnlisted = [...new Set([...t.matchAll(UNLISTED_FABRICS)].map((m) => m[0]))]

  r.fits = [...new Set(FIT_WORDS.filter(([re]) => re.test(t)).map(([, f]) => f))]

  const size = /\b(?:uk\s*|size\s*)(\d{1,2})\b/.exec(t)
  if (size) r.sizeUk = Number(size[1])

  const region = /\b(france|germany|spain|italy|netherlands|ireland|belgium|portugal|austria|denmark|sweden|eu|europe|paris|berlin|madrid|rome|milan|amsterdam|dublin|lisbon|vienna|copenhagen)\b/.exec(t)
  if (region) r.region = 'EU'
  else if (/\b(uk|london|england|scotland|wales|edinburgh|manchester|bristol|exeter)\b/.test(t)) r.region = 'UK'
  else {
    const away = /\b(usa|america|canada|australia|new york|dubai|tokyo)\b/.exec(t)
    if (away) r.regionUnsupported = away[0]
  }

  const date = ruleDate(t, today)
  if (date.date) r.eventDate = toISODate(date.date)
  else if (date.unclear) r.dateUnclear = date.unclear

  r.unsupported = [...new Set([...t.matchAll(UNSUPPORTED)].map((m) => m[0]))]
  // Drop "sleeves" if a more specific sleeve phrase was found.
  if (r.unsupported.some((u) => /\w+ sleeves?/.test(u))) r.unsupported = r.unsupported.filter((u) => !/^sleeves?$/.test(u))

  // Named pieces: a capitalised word followed by a type word, or "called X".
  const raw = input.replace(/[’‘]/g, "'")
  const typeWords = 'dress|gown|jumpsuit|top|skirt|coat|jacket|clutch|scarf|outerwear'
  const stop = new Set(['a', 'an', 'the', 'my', 'any', 'some', 'one', 'that', 'this', 'black', 'tie', 'evening', 'party', 'wedding', 'cocktail', 'gala', 'dinner',
    ...ALLOWED.colours.flatMap((c) => c.split(' ')), ...ALLOWED.fabrics.flatMap((f) => f.split(' ')), ...ALLOWED.fits.map((f) => f.toLowerCase())])
  const names = new Set<string>()
  for (const m of raw.matchAll(new RegExp(`\\b([A-Z][a-z]{2,})\\s+(?:${typeWords})\\b`, 'g'))) if (!stop.has(m[1].toLowerCase())) names.add(m[1].toLowerCase())
  for (const m of raw.matchAll(/\bcalled\s+(?:the\s+)?["']?([A-Za-z]{3,})/gi)) if (!stop.has(m[1].toLowerCase())) names.add(m[1].toLowerCase())
  for (const n of LINE_NAMES) if (new RegExp(`\\b${n}\\b`).test(t)) names.add(n)
  r.namedProducts = [...names]
  return r
}

/** Rules-only reading, validated and interpreted. Used directly when the AI reader is unavailable. */
export function parseText(input: string, today: Date = new Date()): Interpreted {
  const clean = sanitizeReading(ruleReading(input, today), input, toISODate(today))
  const out = interpretReading(clean)
  if (!out.understood.length && !out.notes.length) out.notes.push("I couldn't match that to an occasion, budget, colour, fabric or type of piece. Try the suggestions above, or choose an occasion below.")
  return out
}

export const OCCASION_OPTIONS = OCCASIONS
