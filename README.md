# Velmora: e-commerce concept (GIS Analytics assessment)

A home page, product page and occasion stylist for Velmora, a fictional London evening-wear label, plus a one-page commercial plan built from the supplied analytics. Velmora and all its data are invented for the assessment.

- **Live site:** https://velmora-ecommerce-assessment.vercel.app (Vercel, deploys automatically from `main`)
- **Repository:** https://github.com/sct2005/velmora-ecommerce-assessment
- **Commercial plan:** [`commercial-plan.md`](commercial-plan.md)
- **Analytics workings:** [`analysis/sales-findings.md`](analysis/sales-findings.md), reproducible with `python3 analysis/analyse.py`
- **Presentation notes:** [`docs/presentation-notes.md`](docs/presentation-notes.md)

## Pages

| Route | What it is |
|---|---|
| `/` | Home: occasion-and-date hero, how made to order works, shop by occasion, stylist |
| `/pieces/VLM-008` | The featured product page (Vela dress, draped crepe, £350). Every catalogue id works at `/pieces/<id>` |
| `/pieces` | All 48 pieces, filterable by occasion and type |
| `/stylist` | The occasion stylist |

**Why VLM-008:** it answers the founder's target query ("an evening dress for a winter wedding"), its £350 price is close to the £336 average order, its 14-day making time is the shortest for a made-to-order dress, and it comes in the brand's oxblood.

## Stack

React 19 + TypeScript + Vite. No router, UI kit or state library: four routes and one bag didn't need them. Fonts (Cormorant Garamond, Inter) are self-hosted via `@fontsource`. Vitest for logic tests, Playwright for a browser smoke test.

## Run locally

Requires Node 20 or later.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # stylist, delivery and catalogue tests
npm run build        # type-check + production build into dist/
npm run preview      # serve dist/ at http://localhost:4173
npm run check:browser  # with preview running (first time: npx playwright install chromium)
```

No environment variables are needed to run the site. The optional AI reader uses a server-side key; see the stylist section. There are no keys in the repository or the browser bundle.

## Data and accuracy

- The supplied files stay at the repository root, unmodified: `brand.md`, `products.json`, `analytics.csv`, `CLAUDE.md` and `docs/GIS-Analytics-assessment.pdf`. The original materials README is now [`MATERIALS.md`](MATERIALS.md), unchanged. The site imports `products.json` directly; there is no second copy of product facts in the code.
- Nothing is invented: no reviews, ratings, stock counts or scarcity. Thin descriptions in the catalogue are shown as supplied, with the structured fields (fabric, fit, colours, occasions, sizes, making time) alongside.
- **Delivery estimates** = `lead_time_days` + shipping from `brand.md` (UK 3–5 days, EU 5–8), counted as calendar days and always labelled as estimates, never guaranteed dates.
- **No photography exists.** Each piece is shown as colour panels in its listed colours, with a surface that suggests its fabric, and the site says so.
- **Checkout is a demo.** The bag works; checkout is disabled and says no order is placed and no payment is taken.

Catalogue quirks handled rather than hidden:

- Product names repeat (seven "Livia dress" records). Cards show the cut, fabric and colours, and the product code on the page.
- VLM-021 ships from stock but is out of stock: shown as "Currently unavailable" and never recommended.
- `brand.md` gives prices "from £60 to £690"; the catalogue runs £90 to £680. The site uses catalogue prices.
- Some descriptions name a colour that isn't the first listed; the product page opens on the colour the description names.

## The occasion stylist ("Find your occasion look")

Customers describe their occasion in their own words, or tap a suggestion. The stylist suggests up to three real pieces, each with its listed price, the reasons it matches and an estimated arrival date. The customer can then refine the request or the filters.

**How it decides (and why it can't invent anything):**

1. **Reading the request.** If `ANTHROPIC_API_KEY` is set on the server, `api/read-brief.js` asks Claude to fill a fixed schema: occasion, budget, colours, fabric, cut, type, size, date, region, plus things the catalogue can't answer. Every value must come from a list taken from `products.json`. Any phrase it echoes back must appear word for word in the customer's request. If no key is set, or the call fails, times out or returns anything malformed, fixed rules in the browser do the same job. The page always says which reader was used.
2. **Validation.** `shared/brief-schema.js` checks every reading on the server and again in the browser. Unknown values, invented product names and implausible dates are dropped.
3. **Choosing pieces.** Deterministic rules in `src/lib/stylist.ts` filter `products.json`. The model never sees prices or stock and cannot choose or describe products. Every reason shown is built from a catalogue field.

**What it tells customers plainly:**
- **Colours:** words we don't list, and the closest colour used instead (for example "burgundy" becomes oxblood).
- **Things we don't cover:** occasions we don't list (graduation, summer wedding), sizes outside UK 6–18, attributes the catalogue doesn't record (sleeves, length, neckline), and that there are no reviews, discount data or stock counts.
- **Unknown pieces:** product names that don't exist.
- **Vague requests:** vague dates and requests that need clarifying ("party").
- **When nothing matches:** which single change would produce matches, with real counts and prices, and the two closest real pieces with how each one differs.

**Turning the AI reader on (optional).** In Vercel, open Project → Settings → Environment Variables. Add `ANTHROPIC_API_KEY` for Production, then redeploy. Optionally set `STYLIST_MODEL`; the default is `claude-haiku-5-5`. The key is only read by the server function; it is never in the browser bundle or the repository. Each request costs a small amount of Anthropic API usage, so set a monthly spend limit in the Anthropic console. The endpoint only accepts calls from the site's own pages and caps input at 400 characters, but it has no per-visitor rate limit.

| Environment variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Turns on the Claude reader. Without it, the rule reader is used. |
| `STYLIST_MODEL` | No | Model ID override. |

## Testing

- `npm test`: 35 tests. They cover catalogue integrity, delivery dates, the stylist brief's ten scenarios on the real catalogue, untrusted model output, allowed-value drift against `products.json`, and the server function with a mocked Claude API (no key, rate limit, server error, malformed reply, timeout, foreign origin).
- `npm run check:browser`: Playwright run at 375, 768 and 1280 px: no horizontal overflow on any page; product facts; size-required error; add to bag; disabled checkout; Escape closes the bag; unavailable and unknown products; stylist results and empty state; hero form; skip link.
- Real phone: home page, product page, bag and stylist checked by hand on a phone (13 Oct).
- Live stylist: 12 scripted requests run against the live site with the Claude reader on, all 12 passed (15 Oct). They covered unlisted occasions, vague requests, a made-up product, unsupported sizes and details, EU delivery, an instruction-override attempt, and stock and discount questions.

### Lighthouse scores (15 Oct)

Lighthouse 12, run on the production build served locally (`vite preview`), simulated mobile and desktop. Accessibility, best practices and SEO do not depend on the host; performance on Vercel's network may differ slightly.

| Page | Device | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| Home `/` | Mobile | 99–100 | 100 | 100 | 100 |
| Home `/` | Desktop | 100 | 100 | 100 | 100 |
| Product `/pieces/VLM-008` | Mobile | 96–100 | 100 | 100 | 100 |
| Product `/pieces/VLM-008` | Desktop | 100 | 100 | 100 | 100 |

**Live site check:** PageSpeed Insights on https://velmora-ecommerce-assessment.vercel.app, home page, mobile (Lighthouse 13.5, emulated Moto G Power, slow 4G), 15 Oct 11:14: Performance 97, Accessibility 100, Best practices 100, SEO 100. First and largest contentful paint 2.0 s, total blocking time 0 ms, layout shift 0.

Performance varied between runs (ranges shown). The first run scored SEO 91 because the site had no `robots.txt`; adding one fixed it. Mobile largest contentful paint was 1.5 s (home) and 2.3 s (product) under simulated slow 4G; layout shift was 0.03 or lower.

## Deploy

Deployed on **Vercel** (Hobby, free) through the GitHub integration: every push to `main` redeploys. `api/read-brief.js` deploys automatically as a Vercel Function. The SPA rewrite in `vercel.json` excludes `/api/`.

The site is static; any of these hosts work:

- **Vercel:** import the repository; `vercel.json` sets the build and SPA rewrites.
- **Netlify / Cloudflare Pages:** build command `npm run build`, output `dist`. `public/_redirects` handles deep links.

Product structured data (JSON-LD) is added by JavaScript, so crawlers that don't run scripts won't see it; pre-rendering the product pages would fix that.
