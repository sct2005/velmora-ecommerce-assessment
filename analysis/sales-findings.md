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
| 31,667 | 5.62% | 3.10% | 24.3% | 0.75% | 239 | £80,440 | £336 | £2,700 |

AOV of £336 matches the brand file's "about £335".

## Finding 1: mobile loses customers at checkout, not before

| Device | Sessions | Add-to-cart | Checkout start | **Orders / checkout** | Conversion | Revenue / session |
|---|---|---|---|---|---|---|
| Mobile | 25,097 (79%) | 5.61% | 3.01% | **14.4%** | 0.43% | £1.47 |
| Desktop | 6,570 | 5.63% | 3.46% | **57.3%** | 1.98% | £6.64 |

Mobile and desktop shoppers add to cart and start checkout at almost the same rate. The gap opens inside checkout: 755 mobile checkouts produced 109 orders; 230 desktop checkouts produced 130. The same pattern holds for every channel with enough volume (Instagram 11.7% vs 35.6%, direct 26.5% vs 70.8%) and in every month, so it is not a one-off.

What this suggests: a mobile checkout problem (form length, payment options, or a surprise at the last step such as delivery timing or the made-to-order returns rule). The data shows where customers leave, not why.

Illustration only: if mobile checkout completion rose to half the desktop rate (28.6%), the last six months would have had about 107 more orders.

## Finding 2: the paid social test lost money

| | Spend | Revenue | ROAS | Gross profit at 55% | After ad spend |
|---|---|---|---|---|---|
| Aug + Sep | £2,700 | £3,376 | 1.25 | £1,857 | **−£843** |

Aug ROAS 1.09, Sep 1.38. Break-even ROAS at a 55% margin is 1 / 0.55 = 1.82. Paid social shoppers add to cart at the highest rate of any channel (6.1%) but complete only 7.1% of checkouts, so most of the loss is the same mobile checkout problem. Caveat: last-click revenue in this export may understate paid social's effect on later direct or Instagram visits; there is no evidence either way.

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
- Capacity: about 49 orders a month now (~11 a week). The studio can make 20 made-to-order pieces a week, so roughly +80% is possible before capacity binds. Any Black Friday plan must respect that ceiling.
