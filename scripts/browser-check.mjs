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

// Stylist
await page.goto(BASE + '/stylist')
await page.fill('#ask-text', 'A dress for a winter wedding on 12 December under £400, something red')
await page.getByRole('button', { name: 'Find pieces' }).click()
const picks = await page.locator('.pick h3').allInnerTexts()
ok('stylist returns picks', picks.length > 0, JSON.stringify(picks))
ok('stylist notes colour mapping', (await page.locator('.notes').innerText()).includes('oxblood'))
await page.screenshot({ path: `${OUT}/stylist-result-390.png`, fullPage: true })
await page.locator('#ask-text').fill('a yellow lace jumpsuit under £100')
await page.getByRole('button', { name: 'Find pieces' }).click()
ok('impossible brief: no picks + explanation', (await page.locator('.pick').count()) === 0 && (await page.locator('.empty').innerText()).includes('No piece matches'))
await page.screenshot({ path: `${OUT}/stylist-none-390.png`, fullPage: true })

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
