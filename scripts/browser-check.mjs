// Browser smoke test: run `npm run build && npx vite preview --port 4173` first.
// Usage: node scripts/browser-check.mjs [baseUrl] [outDir]
import { chromium } from 'playwright'
const BASE = process.argv[2] ?? 'http://localhost:4173'
const OUT = process.argv[3] ?? 'screenshots'
import { mkdirSync } from 'node:fs'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const errors = []
const results = []
const ok = (name, cond, detail = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`)

for (const [w, h] of [[375, 812], [768, 1024], [1280, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  page.on('console', (m) => m.type() === 'error' && errors.push(`${w}px ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`${w}px ${e.message}`))
  for (const path of ['/', '/pieces/VLM-008', '/stylist', '/pieces']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    ok(`no horizontal overflow ${path} @${w}`, overflow <= 0, overflow > 0 ? `(+${overflow}px)` : '')
    const name = path === '/' ? 'home' : path.slice(1).replace(/\//g, '-')
    await page.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: true })
  }
  await page.close()
}

// Product page facts and purchase flow (mobile)
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(BASE + '/pieces/VLM-008')
ok('product name', (await page.locator('h1').innerText()) === 'Vela dress')
ok('product price £350', (await page.locator('.pdp-price').innerText()) === '£350')
ok('opens on the colour the description names', (await page.locator('.opt legend').first().innerText()).includes('Oxblood'))
ok('7 size options', (await page.locator('.size-opt').count()) === 7)
ok('JSON-LD present', (await page.locator('#product-ld').count()) === 1)
await page.getByRole('button', { name: 'Add to bag' }).click()
ok('size required error', await page.getByRole('alert').isVisible())
await page.locator('.size-opt', { hasText: '12' }).click()
await page.getByRole('button', { name: 'Add to bag, UK 12' }).click()
ok('bag opens with item', await page.locator('dialog.drawer[open] .bag-name').first().isVisible())
ok('checkout disabled, demo disclosed', await page.locator('dialog .btn-primary').isDisabled() && (await page.locator('#demo-note').innerText()).includes('no payment'))
await page.keyboard.press('Escape')
ok('bag closes with Escape', !(await page.locator('dialog.drawer[open]').count()))
ok('header bag count 1', (await page.locator('.bag-count').innerText()) === '1')
await page.screenshot({ path: `${OUT}/flow-after-add-390.png` })

// Arrival check: a date in the past of the estimate
await page.locator('.arrival input[type=date]').fill('2099-01-01')
ok('in-time verdict for far date', await page.locator('.verdict-in-time').isVisible())

// Unavailable piece
await page.goto(BASE + '/pieces/VLM-021')
ok('unavailable piece cannot be added', await page.getByRole('button', { name: 'Currently unavailable' }).isDisabled())
// Unknown product
await page.goto(BASE + '/pieces/VLM-999')
ok('unknown product shows not found', (await page.locator('h1').innerText()).includes("couldn't find"))

// Stylist: rule-based reader (no /api on the preview server, so this is the fallback path)
await page.goto(BASE + '/stylist')
ok('stylist title', (await page.locator('h1').innerText()) === 'Find your occasion look')
await page.getByRole('button', { name: 'Find pieces' }).click()
ok('empty input: helpful error', (await page.locator('#ask-error').innerText()).includes('Describe your occasion'))
await page.getByRole('button', { name: 'Winter wedding guest, under £400' }).click()
await page.locator('.pick').first().waitFor()
ok('quick-start returns picks', (await page.locator('.picks > .pick').count()) >= 2)
ok('reader note says fixed rules', (await page.locator('.reader-note').innerText()).includes('fixed rules'))
await page.fill('#ask-text', "I'm attending a winter wedding in London. I want something elegant under £200, preferably black or burgundy.")
await page.getByRole('button', { name: 'Find pieces' }).click()
await page.locator('.alt-title').waitFor()
ok('brief example: says nothing matches', (await page.locator('.empty strong').innerText()).includes('No piece matches'))
ok('brief example: notes burgundy -> oxblood', (await page.locator('.notes').innerText()).includes('"burgundy"'))
const altText = await page.locator('.pick').allInnerTexts()
ok('brief example: real alternatives with prices', altText.length === 2 && altText[0].includes('£330') && altText[0].includes('VLM-020') && altText[1].includes('£350'), JSON.stringify(altText.map((t) => t.split('\n').slice(0, 2).join(' '))))
await page.screenshot({ path: `${OUT}/stylist-alternatives-390.png`, fullPage: true })
await page.locator('.pick-link').first().click()
await page.waitForURL(/\/pieces\/VLM-020$/)
ok('alternative links to the real product page', (await page.locator('h1').innerText()) === 'Vela dress' && (await page.locator('.pdp-price').innerText()) === '£330')
await page.goto(BASE + '/stylist')
await page.fill('#ask-text', 'Show me the Aurora gown for £50 with 5-star reviews')
await page.getByRole('button', { name: 'Find pieces' }).click()
await page.locator('.notes').waitFor()
const inv = await page.locator('.results').innerText()
ok('invented product refused', inv.includes('don\'t have a piece called "aurora"') && inv.includes('no customer reviews') && !/Aurora gown\s+£/.test(inv))
await page.fill('#ask-text', 'a yellow lace jumpsuit under £100')
await page.getByRole('button', { name: 'Find pieces' }).click()
await page.locator('.empty strong').waitFor()
ok('impossible brief: no picks + explanation', (await page.locator('.picks > .pick').count()) === 0 || (await page.locator('.alt-title').count()) === 1)

// Stylist: AI path, with the server function mocked in the browser
async function withModel(reply, status = 200) {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } })
  p.on('pageerror', (e) => errors.push(e.message))
  await p.route('**/api/read-brief', (route) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(reply) }))
  await p.goto(BASE + '/stylist')
  return p
}
let mp = await withModel({ source: 'model', reading: { occasion: 'black tie', colours: ['emerald'], categories: ['dress'], fabrics: [], fits: [], maxBudget: 500 } })
await mp.fill('#ask-text', 'something emerald for a black tie do, a dress, max £500')
await mp.getByRole('button', { name: 'Find pieces' }).click()
await mp.locator('.pick').first().waitFor()
ok('AI path: shows picks and says Claude read it', (await mp.locator('.reader-note').innerText()).includes('Claude'))
const aiPicks = await mp.locator('.pick h3').allInnerTexts()
ok('AI path: picks are emerald black-tie dresses within £500', aiPicks.length > 0 && aiPicks.every((t) => /£(\d+)/.test(t) && Number(/£(\d+)/.exec(t)[1]) <= 500), JSON.stringify(aiPicks))
await mp.close()
mp = await withModel({ source: 'model', reading: { occasion: 'pool party', colours: ['gold'], categories: [], fabrics: [], fits: [], namedProducts: ['Aurora gown'], maxBudget: 'free' } })
await mp.fill('#ask-text', 'black tie, emerald')
await mp.getByRole('button', { name: 'Find pieces' }).click()
await mp.waitForTimeout(400)
const hostile = await mp.locator('.results').innerText()
ok('AI path: hostile model output is discarded, rules used instead', !hostile.includes('Aurora') && (await mp.locator('.reader-note').innerText()).includes('fixed rules'))
await mp.close()
mp = await withModel({ error: 'upstream' }, 502)
await mp.fill('#ask-text', 'Winter wedding guest, under £400')
await mp.getByRole('button', { name: 'Find pieces' }).click()
await mp.locator('.pick').first().waitFor()
ok('AI path: server error falls back to rules with results', (await mp.locator('.reader-note').innerText()).includes('fixed rules'))
await mp.close()

// Hero sentence -> stylist
await page.goto(BASE + '/')
await page.selectOption('#hero-occ', 'black tie')
await page.getByRole('button', { name: 'Show pieces that arrive in time' }).click()
ok('hero form opens stylist with occasion', page.url().includes('/stylist?occasion=black+tie') && (await page.locator('.pick').count()) > 0)

// Keyboard: first tab lands on skip link
await page.goto(BASE + '/')
await page.keyboard.press('Tab')
ok('skip link first in tab order', (await page.evaluate(() => document.activeElement?.textContent)) === 'Skip to content')

await browser.close()
console.log(results.join('\n'))
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'No console errors')
