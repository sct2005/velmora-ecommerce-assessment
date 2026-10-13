// Shared by the browser and the server function (plain ESM JavaScript, no dependencies, so
// Vercel can run it without a build step).
//
// A "reading" is what the stylist understood from a customer's words. Two readers produce it:
// fixed rules in the browser, or Claude via api/read-brief.js. Either way it passes through
// sanitizeReading() before use, so a reading can only ever contain:
//   - values from the fixed lists below (taken from products.json; a unit test checks they match), or
//   - short phrases that appear word-for-word in the customer's own request (echoed back in notes).
// A reading never contains products, prices, stock or dates as facts. Products are chosen later,
// by deterministic rules over products.json.

export const ALLOWED = {
  occasions: ['winter wedding', 'black tie', 'gala', "new year's eve", 'christmas party', 'cocktail', 'dinner', 'engagement party'],
  categories: ['dress', 'jumpsuit', 'top', 'skirt', 'outerwear', 'accessory'],
  colours: ['black', 'champagne', 'dusty rose', 'emerald', 'ivory', 'midnight', 'oxblood', 'pewter', 'sapphire'],
  fabrics: ['chiffon', 'crepe', 'duchess satin', 'jersey', 'sequinned tulle', 'silk satin', 'velvet', 'wool crepe'],
  fits: ['A-line', 'bias-cut', 'column', 'draped', 'fitted', 'relaxed', 'structured', 'wrap'],
  regions: ['UK', 'EU'],
}

const MAX_PHRASE = 40
const MAX_LIST = 8

/** JSON schema the model must fill (forced tool call). Mirrors the reading shape. */
export const READING_TOOL = {
  name: 'record_reading',
  description: "Record what the customer asked for, using only the allowed values. Never name products, prices, stock or delivery promises.",
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      occasion: { type: ['string', 'null'], enum: [...ALLOWED.occasions, null], description: 'Allowed occasion that clearly matches, else null.' },
      occasion_mapped_from: { type: ['string', 'null'], description: "The customer's exact words if they were mapped to a different allowed occasion (e.g. 'wedding' -> 'winter wedding'), else null." },
      occasion_unlisted: { type: ['string', 'null'], description: "The customer's exact words for an occasion that is not in the allowed list (e.g. 'graduation', 'summer wedding'), else null." },
      ambiguous_occasion: {
        type: ['object', 'null'],
        properties: { said: { type: 'string' }, options: { type: 'array', items: { type: 'string', enum: ALLOWED.occasions } } },
        description: "If the customer's words could mean several allowed occasions (e.g. 'party'), their words and the options. Else null.",
      },
      max_budget_gbp: { type: ['integer', 'null'], description: 'Upper budget in pounds if stated, else null.' },
      categories: { type: 'array', items: { type: 'string', enum: ALLOWED.categories } },
      colours: { type: 'array', items: { type: 'string', enum: ALLOWED.colours }, description: 'Allowed colours requested, including closest matches for other colour words.' },
      colour_mappings: {
        type: 'array',
        items: { type: 'object', properties: { said: { type: 'string' }, as: { type: 'array', items: { type: 'string', enum: ALLOWED.colours } } }, required: ['said', 'as'] },
        description: "Colour words the customer used that are not allowed values, and the allowed colours used instead (e.g. 'burgundy' -> ['oxblood']).",
      },
      colours_unlisted: { type: 'array', items: { type: 'string' }, description: "Colour words with no close allowed colour (e.g. 'yellow'). Customer's exact words." },
      fabrics: { type: 'array', items: { type: 'string', enum: ALLOWED.fabrics } },
      fabrics_unlisted: { type: 'array', items: { type: 'string' }, description: "Fabric words not in the allowed list (e.g. 'lace'). Customer's exact words." },
      fits: { type: 'array', items: { type: 'string', enum: ALLOWED.fits }, description: 'Silhouettes requested, mapped to allowed values only when clearly equivalent.' },
      size_uk: { type: ['integer', 'null'], description: 'UK dress size number if stated (e.g. 12), else null.' },
      event_date: { type: ['string', 'null'], description: 'Date of the occasion as YYYY-MM-DD, only if the customer gave a specific day. Resolve relative to today. Else null.' },
      date_unclear: { type: ['string', 'null'], description: "The customer's exact words if they mentioned a time but not a specific day (e.g. 'next Saturday', 'in a few weeks'), else null." },
      delivery_region: { type: ['string', 'null'], enum: ['UK', 'EU', null], description: 'UK or EU if the customer said where they are or where the event is, else null.' },
      region_unsupported: { type: ['string', 'null'], description: "Customer's exact words for a place outside the UK and EU, else null." },
      unsupported: { type: 'array', items: { type: 'string' }, description: "Things the customer asked about that are not recorded in the catalogue, in their exact words: e.g. 'long sleeves', 'midi', 'pockets', 'reviews', 'discount', 'in stock'." },
      named_products: { type: 'array', items: { type: 'string' }, description: 'Any product or collection names the customer mentioned (e.g. a name followed by dress), exact words.' },
    },
    required: ['occasion', 'categories', 'colours', 'fabrics', 'fits'],
  },
}

export function emptyReading() {
  return {
    occasion: null, occasionMappedFrom: null, occasionUnlisted: null, ambiguous: null,
    maxBudget: null, categories: [], colours: [], colourMappings: [], coloursUnlisted: [],
    fabrics: [], fabricsUnlisted: [], fits: [], sizeUk: null, eventDate: null, dateUnclear: null,
    region: null, regionUnsupported: null, unsupported: [], namedProducts: [],
  }
}

const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim()

/** Keep a phrase only if it is short and appears in the customer's own words. */
function echo(value, text) {
  if (typeof value !== 'string') return null
  const v = norm(value)
  if (!v || v.length > MAX_PHRASE) return null
  return text.includes(v) ? v : null
}
const echoList = (arr, text) => (Array.isArray(arr) ? [...new Set(arr.map((x) => echo(x, text)).filter(Boolean))].slice(0, MAX_LIST) : [])
const pick = (arr, allowed) => (Array.isArray(arr) ? [...new Set(arr.filter((x) => allowed.includes(x)))] : [])
const one = (v, allowed) => (allowed.includes(v) ? v : null)
/** A whole number from a number or numeric string; null for anything else (Number(null) would be 0). */
const int = (v) => (typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v.trim())) ? Number(v) : NaN)

function validDate(v, todayISO) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const [y, m, d] = v.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCMonth() !== m - 1) return null
  const today = new Date(todayISO + 'T00:00:00Z')
  const twoYears = 2 * 366 * 86_400_000
  if (Number.isNaN(today.getTime()) || Math.abs(dt.getTime() - today.getTime()) > twoYears) return null
  return v
}

/**
 * Accepts the model's raw tool input (snake_case) or a rule reading (camelCase) and returns a
 * clean reading. Anything not allowed is dropped.
 */
export function sanitizeReading(raw, customerText, todayISO) {
  const r = emptyReading()
  if (!raw || typeof raw !== 'object') return r
  const text = norm(customerText ?? '')
  const g = (camel, snake) => (raw[camel] !== undefined ? raw[camel] : raw[snake])

  r.occasion = one(g('occasion', 'occasion'), ALLOWED.occasions)
  r.occasionMappedFrom = r.occasion ? echo(g('occasionMappedFrom', 'occasion_mapped_from'), text) : null
  r.occasionUnlisted = r.occasion ? null : echo(g('occasionUnlisted', 'occasion_unlisted'), text)
  const amb = g('ambiguous', 'ambiguous_occasion')
  if (!r.occasion && amb && typeof amb === 'object') {
    const said = echo(amb.said, text)
    const options = pick(amb.options, ALLOWED.occasions)
    if (said && options.length >= 2) r.ambiguous = { said, options }
  }

  const budget = int(g('maxBudget', 'max_budget_gbp'))
  r.maxBudget = Number.isInteger(budget) && budget > 0 && budget <= 100_000 ? budget : null

  r.categories = pick(g('categories', 'categories'), ALLOWED.categories)
  r.colours = pick(g('colours', 'colours'), ALLOWED.colours)
  const maps = g('colourMappings', 'colour_mappings')
  r.colourMappings = Array.isArray(maps)
    ? maps.map((m) => ({ said: echo(m?.said, text), as: pick(m?.as, ALLOWED.colours) })).filter((m) => m.said && m.as.length).slice(0, MAX_LIST)
    : []
  // Every mapped colour must also be a requested colour.
  for (const m of r.colourMappings) for (const c of m.as) if (!r.colours.includes(c)) r.colours.push(c)
  r.coloursUnlisted = echoList(g('coloursUnlisted', 'colours_unlisted'), text)
  r.fabrics = pick(g('fabrics', 'fabrics'), ALLOWED.fabrics)
  r.fabricsUnlisted = echoList(g('fabricsUnlisted', 'fabrics_unlisted'), text)
  r.fits = pick(g('fits', 'fits'), ALLOWED.fits)

  const size = int(g('sizeUk', 'size_uk'))
  r.sizeUk = Number.isInteger(size) && size >= 2 && size <= 40 ? size : null
  r.eventDate = validDate(g('eventDate', 'event_date'), todayISO)
  r.dateUnclear = r.eventDate ? null : echo(g('dateUnclear', 'date_unclear'), text)
  r.region = one(g('region', 'delivery_region'), ALLOWED.regions)
  r.regionUnsupported = r.region ? null : echo(g('regionUnsupported', 'region_unsupported'), text)
  r.unsupported = echoList(g('unsupported', 'unsupported'), text)
  r.namedProducts = echoList(g('namedProducts', 'named_products'), text)
  return r
}
