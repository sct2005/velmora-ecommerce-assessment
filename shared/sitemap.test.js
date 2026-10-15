// The sitemap is a static file; this test stops it drifting from products.json.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

describe('sitemap.xml', () => {
  it('lists the three main pages and every catalogue piece', () => {
    const xml = read('../public/sitemap.xml')
    const products = JSON.parse(read('../products.json'))
    for (const p of products) expect(xml).toContain(`/pieces/${p.id}</loc>`)
    expect((xml.match(/<loc>/g) ?? []).length).toBe(products.length + 3)
  })
  it('is linked from robots.txt', () => {
    expect(read('../public/robots.txt')).toContain('Sitemap: https://velmora-ecommerce-assessment.vercel.app/sitemap.xml')
  })
})
