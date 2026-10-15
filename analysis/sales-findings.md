# Velmora: analytics findings

Source: `analytics.csv` at the repository root (the supplied file, unmodified). Reproduce every number with `python3 analysis/analyse.py`.

## The data

- 72 rows = 6 months (2026-04 to 2026-09) × 6 channels × 2 devices. One row per month/channel/device; no duplicate keys, no blanks, no total rows.
- Columns: sessions, product_views, add_to_carts, checkouts_started, orders, revenue_gbp, ad_spend_gbp. All whole numbers in GBP.
- These are event counts, not unique users; the funnel is not strictly nested.
- Quality flags:
  - Email/desktop has more checkouts than add-to-carts in Jun, Jul and Aug (6 vs 5, 7 vs 6, 8 vs 7). This is probably checkouts started from an email link or a saved basket, so I treat steps as rates per session and not as strict sub-sets.
  - Paid social spend is booked only on the mobile row. ROAS is therefore calculated at channel level.
  - Paid social rows for Apr–Jul are all zero (the test ran Aug–Sep only).
  - Small cells: several channel × device cells have 0–6 orders in total. Read them as direction, not precision.

## Totals (6 months)

| Sessions | Add-to-cart / session | Checkout / session | Orders / checkout | Conversion | Orders | Revenue | AOV | Ad spend |
|---|---|---|---|---|---|---|---|---|
| 31,667 | 5.62% | 3.10% | 24.3% | 0.75% | 239 | £80,440 | £337 | £2,700 |

AOV of £337 (£80,440 ÷ 239) matches the brand file's "about £335".

## Finding 1: mobile loses customers at checkout, not before

| Device | Sessions | Add-to-cart | Checkout start | **Orders / checkout** | Conversion | Revenue / session |
|---|---|---|---|---|---|---|
| Mobile | 25,097 (79%) | 5.61% | 3.01% | **14.4%** | 0.43% | £1.47 |
| Desktop | 6,570 | 5.63% | 3.46% | **57.3%** | 1.98% | £6.64 |

Mobile and desktop shoppers add to cart and start checkout at almost the same rate. The gap opens inside checkout: 755 mobile checkouts produced 109 orders; 227 desktop checkouts produced 130. The difference is far beyond chance (95% CIs 12.1–17.1% vs 50.8–63.5%; two-proportion z = −13.2). Add-to-cart per session is identical (5.61% vs 5.63%, p = 0.96). The same pattern holds within every channel with enough volume (Instagram 11.7% vs 35.6%, direct 26.5% vs 70.8%) and in every month, so it is not a channel-mix effect or a one-off. Organic search is the exception (6/16 vs 6/17), but its cells are too small to read.

What this suggests: a mobile checkout problem (form length, payment options, or a surprise at the last step such as delivery timing or the made-to-order returns rule). The data shows where customers leave, not why.

Illustration only: at September's 209 mobile checkouts, raising completion from 14.4% to 25% adds about 22 orders a month (about £7,400), inside the studio's capacity headroom.

**Not a decline.** Mobile completion including paid social falls from 18.3% (Apr) to 11.5% (Sep), but that is a mix effect: the paid social traffic added in Aug–Sep completes only 6.2% of mobile checkouts. Excluding paid social, mobile completion is flat at 14.5–18.3% every month (Apr–May 16.8% vs Aug–Sep 15.7%, p = 0.76). An earlier version of the plan called this a decline; that was wrong and is corrected.

**Cross-device caveat.** Email on desktop completes 39 of 39 checkouts and has more checkouts than add-to-carts in Jun, Jul and Aug. That suggests some baskets started on a phone are finished on desktop from an emailed or saved link. If so, part of the mobile "loss" is already recovered on desktop, and fixing mobile checkout gains less than the gap implies. Measure total orders across devices as a guardrail.

**Measurability.** At about 190 mobile checkouts per 4 weeks, a before/after comparison (80% power, 5% significance) can detect a rise to about 26% or more (needs about 187 per period), not a rise to 20% (needs about 712). A 50/50 A/B test would halve the sample per arm, so before/after with desktop as the control is the practical design.

## Finding 2: the paid social result is uncertain, not clearly a loss

| | Spend | Revenue | ROAS | Gross profit at 55% | After ad spend |
|---|---|---|---|---|---|
| Aug + Sep | £2,700 | £3,376 | 1.25 | £1,857 | **−£843** |

Aug ROAS 1.09, Sep 1.38. Break-even ROAS at a 55% margin is 1 / 0.55 = 1.82. Paid social shoppers add to cart at the highest rate of any channel (6.1%) but complete only 7.1% of checkouts (6.2% on mobile, 8 of 128), so much of the shortfall is the same mobile checkout problem.

**Possible halo.** Revenue from all other channels was flat in Apr–Jul (£11,450, £12,742, £12,173, £12,146). Projected on that trend, Aug–Sep would have been about £25,167; it was £28,553, which is £3,386 more. Direct sessions rose in August and Instagram sessions in September. If the ads caused all of that excess, paid social returned 2.50 (+£1,019 after spend), above break-even. The data cannot separate an ad effect from seasonality (September is the start of party season) or from organic growth, and there is no earlier year to compare. The true return lies somewhere between 1.25 and about 2.50.

**Implication.** Neither "pause" nor "scale" is supported. Pausing would also remove £1,700 a month of attributed sales, which works against a plan to grow sales. The defensible move is a holdout test on warm audiences after the checkout fix, kept only if the incremental return clears 1.82.

## Finding 3: email converts best but is tiny

| Channel | Sessions | Conversion | Revenue / session |
|---|---|---|---|
| Email | 1,744 (5.5%) | 2.98% | £9.80 |
| Direct | 4,997 | 1.44% | £4.88 |
| Organic search | 1,266 | 0.95% | £3.28 |
| Instagram | 18,634 (59%) | 0.47% | £1.58 |
| Paid social | 4,198 | 0.24% | £0.80 |

Email earns about six times more per visit than Instagram. Instagram brings most traffic but converts at 0.47%. Turning Instagram visitors into email subscribers moves people to the best-converting channel. Caveat: email readers are already warm (likely past buyers), so new subscribers will not all convert at 2.98%.

## Other observations

- Organic search is small (1,266 sessions, 4%), consistent with a young brand and no reviews. Relevant to the "show up in AI assistants" goal but slow to move before Black Friday.
- Excluding paid social, sessions grew from 4,081 (Apr) to 5,174 (Sep) while conversion stayed at 0.81–0.87%.
- Capacity: 49 orders in September (~11 a week). The studio can make 20 made-to-order pieces a week (~87 a month), so headroom is about 38 orders a month. That is an upper bound: accessories and stock pieces don't use studio time, but orders with several made-to-order pieces use more. Any Black Friday plan must respect that ceiling.
- Recovery pool: 206 of 255 checkout starts in September (153 of 198 in August) did not become orders. These are event counts, so some are the same person more than once.
- No earlier Black Friday is in the data (the brand launched in October 2025; the data covers April to September 2026), so any Black Friday uplift estimate would be a guess.

## Corrections log

- 15 Oct: desktop checkouts are 227, not 230 (the 57.3% rate was already correct).
- 15 Oct: the "mobile completion has fallen every month" claim was a paid-social mix effect; underlying mobile completion is flat.
- 15 Oct: the paid social recommendation changed from "pause" to "retarget with a holdout", because the halo check puts the return anywhere from 1.25 to about 2.50.
- 15 Oct: AOV rounds to £337, not £336.
