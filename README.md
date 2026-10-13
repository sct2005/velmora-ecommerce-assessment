# Velmora: e-commerce concept (GIS Analytics assessment)

A home page, product page and occasion stylist for Velmora, a fictional London evening-wear label, plus a one-page commercial plan built from the supplied analytics. Velmora and all its data are invented for the assessment.

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

No environment variables are needed. There are no API keys anywhere in the project.

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

## The occasion stylist

**It is rule-based, not a language model, and says so on the page.** It asks for occasion, date, delivery region, budget, size, type and colour, or reads a typed request ("a dress for a winter wedding on 12 December under £400, something red") with deterministic keyword parsing.

It then:

- filters the catalogue on those facts and drops pieces whose estimated arrival is after the occasion date;
- suggests up to three pieces, each with its real price and reasons built from catalogue fields;
- says what it couldn't use: unlisted colours ("We don't list red, so I looked for oxblood"), unlisted fabrics, sizes outside UK 6–18, past or vague dates, delivery outside the UK and EU;
- when nothing matches, says so and shows which single change would produce matches, with real counts and prices;
- asks for more when the request is empty.

**Why not a model?** The brief's hard rule is never inventing a product, price or date. A model would mainly help read free text. The safe design, and the next step, is a server-side function (Vercel/Netlify) that asks a model only to turn text into the same `Brief` object, validated against the allowed values, with selection staying in the tested rules and the current parser as the fallback. The key would live in the host's environment variables, never in the browser bundle.

## Testing

- `npm test`: 19 tests covering catalogue integrity, delivery-date arithmetic, recommendation grounding, impossible and ambiguous requests, and text parsing.
- `npm run check:browser`: Playwright run at 375, 768 and 1280 px: no horizontal overflow on any page; product facts; size-required error; add to bag; disabled checkout; Escape closes the bag; unavailable and unknown products; stylist results and empty state; hero form; skip link.
- Not yet measured: Lighthouse performance and accessibility scores, and testing on a real phone.

## Deploy

Static site; any of these work:

- **Vercel:** import the repository; `vercel.json` sets the build and SPA rewrites.
- **Netlify / Cloudflare Pages:** build command `npm run build`, output `dist`. `public/_redirects` handles deep links.

Product structured data (JSON-LD) is added by JavaScript, so crawlers that don't run scripts won't see it; pre-rendering the product pages would fix that.
