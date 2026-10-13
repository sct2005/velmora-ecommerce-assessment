# Velmora: three changes before Black Friday

Black Friday is Friday 27 November 2026. Source: `analytics.csv`, April to September 2026 (31,667 sessions, 239 orders, £80,440, AOV £336). Workings: `analysis/sales-findings.md`, reproducible with `python3 analysis/analyse.py`. Ranked by expected effect.

## 1. Fix the mobile checkout

**Evidence.** Mobile and desktop visitors add to cart at the same rate (5.61% vs 5.63% of sessions) and start checkout at similar rates (3.0% vs 3.5%). Then mobile collapses: **14.4% of mobile checkouts become orders, against 57.3% on desktop** (109 / 755 vs 130 / 230). Mobile is 79% of sessions, and its completion rate has fallen every month, from 18.3% in April to 11.5% in September.

**Change.** Find and remove the mobile drop-off: turn on express wallets (Apple Pay, Google Pay, Shop Pay) and guest checkout; show the estimated arrival date and the returns rule on the product page and in the bag, so there is no surprise at the last step (built into this concept site); then watch ten mobile checkout recordings to find the step where people leave.

**KPI.** Mobile orders ÷ mobile checkouts started. **Measure** weekly from launch against the 14.4% baseline, with desktop completion as the control: if mobile rises and desktop does not, the change, not the season, is the likely cause. Traffic is too small for a fair A/B test (about 200 mobile checkouts a month).

**Size, illustrative only.** At September's 209 mobile checkouts, each 5-point rise is about 10 more orders a month (≈ £3,400 revenue). **Caveat:** the data shows where customers leave, not why.

## 2. Pause paid social prospecting until checkout is fixed

**Evidence.** The August–September test spent £2,700 and returned £3,376: **ROAS 1.25**. At a 55% gross margin, break-even ROAS is 1 ÷ 0.55 = 1.82, so the test **lost about £843** after ad spend. Paid visitors add to cart more than any other channel (6.1%) but only 7.1% of their checkouts complete: they hit the problem in recommendation 1.

**Change.** Pause cold prospecting now. After the checkout fix, restart with a capped budget aimed only at people who added to cart, then reassess.

**KPI.** Contribution after ad spend (revenue × 0.55 − spend), and ROAS against the 1.82 break-even. **Measure** weekly by campaign in Shopify and Meta reports; keep a no-ads holdout week to see what organic sales do without it. **Caveat:** last-click data may undercount later direct or Instagram purchases from ad viewers. There is no evidence either way, so judge the restart on the holdout.

## 3. Turn Instagram visitors into email subscribers, with honest order-by dates

**Evidence.** Email earns **£9.80 per session** (2.98% conversion) but brings only 5.5% of sessions (about 290 a month). Instagram brings 59% of sessions but earns £1.58 each (0.47%). The audience buys for a dated occasion, and made-to-order timing is the deciding fact.

**Change.** Add an email sign-up for Black Friday early access and "order-by" reminders, on the site and the Instagram bio link. Send occasion emails with real cut-off dates from the catalogue's lead times. For example, a 21-day piece ordered on Black Friday has a latest UK estimate of 23 December, but EU 26 December: too late for Christmas. Use early access, not deep discounts, and cap made-to-order sales at the studio's 20 pieces a week (now about 11 a week from ~49 orders a month).

**KPI.** New subscribers per 100 Instagram sessions, and email-attributed revenue. **Measure** weekly from launch against the April–September email baseline (£2,850 a month). **Caveat:** today's email readers are probably past buyers; new subscribers will convert below 2.98%.

**Not prioritised:** organic and AI-assistant visibility. Product structured data and occasion filtering are in the concept site, but search is 4% of sessions and will not move much in six weeks.
