import { describe, expect, it } from 'vitest'
import { products, findProduct } from '../data/catalogue'
import { estimate, checkDate } from './delivery'
import { parseText, recommend } from './stylist'

const TODAY = new Date(2026, 9, 13) // 13 Oct 2026
const ids = new Set(products.map((p) => p.id))

describe('catalogue', () => {
  it('has the 48 supplied pieces with unique ids', () => {
    expect(products).toHaveLength(48)
    expect(ids.size).toBe(48)
  })
  it('matches spot checks from products.json', () => {
    expect(findProduct('VLM-008')).toMatchObject({ name: 'Vela dress', price_gbp: 350, fabric: 'crepe', lead_time_days: 14 })
    expect(findProduct('VLM-048')).toMatchObject({ name: 'Celeste clutch', price_gbp: 90, sizes: ['one size'] })
    expect(findProduct('VLM-045')?.price_gbp).toBe(680)
  })
})

describe('delivery estimate', () => {
  it('adds making time and UK shipping', () => {
    const e = estimate(findProduct('VLM-008')!, 'UK', TODAY)!
    expect(e.earliest).toEqual(new Date(2026, 9, 30)) // 13 + 14 + 3
    expect(e.latest).toEqual(new Date(2026, 10, 1)) // 13 + 14 + 5
  })
  it('uses EU shipping times', () => {
    const e = estimate(findProduct('VLM-008')!, 'EU', TODAY)!
    expect(e.latest).toEqual(new Date(2026, 10, 4)) // 13 + 14 + 8
  })
  it('returns nothing for a stock piece that is out of stock', () => {
    expect(estimate(findProduct('VLM-021')!, 'UK', TODAY)).toBeNull()
  })
  it('flags tight and late dates', () => {
    const e = estimate(findProduct('VLM-008')!, 'UK', TODAY)!
    expect(checkDate(e, new Date(2026, 10, 20), TODAY).verdict).toBe('in-time')
    expect(checkDate(e, new Date(2026, 9, 31), TODAY).verdict).toBe('tight')
    expect(checkDate(e, new Date(2026, 9, 25), TODAY).verdict).toBe('too-late')
  })
})

describe('recommend', () => {
  it('only returns real, orderable catalogue pieces with real prices', () => {
    for (const occ of ['winter wedding', 'black tie', 'gala', "new year's eve", 'dinner']) {
      const r = recommend({ occasion: occ, region: 'UK' }, TODAY)
      expect(r.status).toBe('ok')
      for (const pick of r.picks) {
        expect(ids.has(pick.product.id)).toBe(true)
        expect(pick.product).toBe(findProduct(pick.product.id))
        expect(pick.product.occasions).toContain(occ)
        expect(pick.product.id).not.toBe('VLM-021')
      }
    }
  })
  it('respects budget and type', () => {
    const r = recommend({ occasion: 'winter wedding', maxBudget: 400, categories: ['dress'], region: 'UK' }, TODAY)
    expect(r.picks.map((p) => p.product.id).sort()).toEqual(['VLM-003', 'VLM-008', 'VLM-020'])
  })
  it('drops pieces that cannot arrive in time and says so', () => {
    // 1 Nov: only 14-day pieces (latest 1 Nov, tight) and stock pieces fit
    const r = recommend({ occasion: 'winter wedding', eventDate: new Date(2026, 10, 1), region: 'UK' }, TODAY)
    expect(r.lateCount).toBeGreaterThan(0)
    for (const p of r.picks) expect(p.dateCheck?.verdict).not.toBe('too-late')
  })
  it('explains an impossible brief instead of inventing a match', () => {
    const r = recommend({ occasion: 'winter wedding', maxBudget: 100, region: 'UK' }, TODAY)
    expect(r.status).toBe('none')
    expect(r.picks).toHaveLength(0)
    expect(r.relaxations.join(' ')).toMatch(/£230/) // cheapest winter-wedding piece is the £230 Livia top
  })
  it('asks for more when the brief is empty', () => {
    expect(recommend({ region: 'UK' }, TODAY).status).toBe('clarify')
  })
  it('ignores sizes outside the published range and says so', () => {
    const r = recommend({ occasion: 'gala', size: 'UK 22', region: 'UK' }, TODAY)
    expect(r.notes.join(' ')).toMatch(/UK 6 to 18/)
  })
  it('says when a date has already passed', () => {
    const r = recommend({ occasion: 'gala', eventDate: new Date(2026, 8, 1), region: 'UK' }, TODAY)
    expect(r.notes.join(' ')).toMatch(/already passed/)
  })
})

describe('parseText', () => {
  it('reads occasion, budget, colour and date', () => {
    const p = parseText('A dress for a winter wedding on 12 December, under £400, something green', TODAY)
    expect(p.brief.occasion).toBe('winter wedding')
    expect(p.brief.maxBudget).toBe(400)
    expect(p.brief.categories).toEqual(['dress'])
    expect(p.brief.colours).toEqual(['emerald'])
    expect(p.brief.eventDate).toEqual(new Date(2026, 11, 12))
    expect(p.notes.join(' ')).toMatch(/closest listed colour/)
  })
  it('is honest about colours and fabrics we do not list', () => {
    const p = parseText('yellow lace dress', TODAY)
    expect(p.notes.join(' ')).toMatch(/No pieces are listed in "yellow"/)
    expect(p.notes.join(' ')).toMatch(/lace/)
  })
  it('does not guess vague dates', () => {
    const p = parseText('black tie next saturday', TODAY)
    expect(p.brief.eventDate).toBeUndefined()
    expect(p.notes.join(' ')).toMatch(/exact date/)
  })
  it('does not mistake "us" for the United States', () => {
    expect(parseText('help us find a gala dress', TODAY).notes.join(' ')).not.toMatch(/UK and the EU only/)
  })
  it('handles nonsense', () => {
    expect(parseText('asdf qwerty', TODAY).understood).toHaveLength(0)
  })
  it('reads EU delivery', () => {
    expect(parseText('NYE party in Paris', TODAY).brief.region).toBe('EU')
  })
})
