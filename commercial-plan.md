# Velmora: three changes before Black Friday

Black Friday is 27 November 2026, six weeks away. Source: `analytics.csv`, April to September 2026 (31,667 sessions, 239 orders, £80,440, average order £337). Every figure is reproduced by `python3 analysis/analyse.py`; tests and caveats are in `analysis/sales-findings.md`. Ranked by expected effect on sales.

## 1. Fix the mobile checkout

**Evidence.** Phone and desktop visitors add to cart at the same rate (5.61% vs 5.63% of sessions, no significant difference). The gap opens inside checkout: **14.4% of mobile checkouts become orders (109 of 755), against 57.3% on desktop (130 of 227)**, p < 0.001. It holds within Instagram (12% vs 36%) and direct (27% vs 71%), so it is not a channel-mix effect. Phones bring 79% of sessions.

**Change.** Watch 10 mobile checkout recordings to find the step where people leave. Turn on express wallets (Apple Pay, Google Pay, Shop Pay) and guest checkout. Show the arrival date and the returns rule before payment, as the concept site does.

**Measure.** KPI: mobile orders ÷ mobile checkouts started, weekly. Compare the 4 weeks after launch with the 4 weeks before, using desktop completion as the control. About 190 mobile checkouts per 4 weeks can reliably detect a rise to about 26% or more, not a small gain. Guardrail: total orders on all devices, so orders moving from desktop to phone are not counted as a win.

**Size (illustrative, not a forecast).** At September's 209 mobile checkouts, 25% completion would add about 22 orders a month (about £7,400).

**Caveat.** The data shows where people leave, not why. Some may finish later on desktop: email on desktop completes 39 of 39 checkouts, with more checkouts than add-to-carts in three months, a sign of saved or emailed baskets. The real gain would then be smaller; the guardrail shows it.

## 2. Turn Instagram visitors into email subscribers, and remind people who left checkout

**Evidence.** Email earns **£9.80 per session** (2.98% conversion, 95% CI 2.3% to 3.9%) against £1.58 for Instagram (0.47%), which brings 59% of sessions. In September, 206 of 255 checkout starts did not become orders.

**Change.** Add an email sign-up for Black Friday early access on the site and the Instagram bio link. Check that Shopify's abandoned-checkout email is switched on. Send occasion emails with real order-by dates from the lead times: a 21-day piece ordered on Black Friday arrives by 23 December in the UK but 26 December in the EU. Offer early access, not deep discounts.

**Measure.** KPIs, weekly: new subscribers per 100 Instagram sessions; orders from abandoned-checkout emails ÷ emails sent; email revenue per month against the April to September baseline of £2,850.

**Caveat.** Today's email readers are probably past buyers, so new subscribers will convert below 2.98%.

## 3. Don't scale paid social yet: retarget warm visitors and test whether it adds sales

**Evidence.** The August–September test spent £2,700 for £3,376 of attributed revenue: a return of £1.25 per £1 against a break-even of £1.82 at a 55% margin, about −£843. But other channels earned £3,386 above their April–July trend in those months. If the ads caused that, the return was £2.50 (+£1,019). This data cannot separate an ad effect from the start of party season. Paid visitors also complete only 6.2% of mobile checkouts (8 of 128), so change 1 helps this channel most.

**Change.** After the checkout fix, move spend from cold audiences to people who have visited or added to cart, at no more than September's £1,500. Hold out a random 20% of that audience from the ads.

**Measure.** Incremental return = extra revenue in the group shown ads over the held-out group, scaled to the full audience, ÷ spend. Keep only if it clears £1.82 per £1; stop before Black Friday week if not. Guardrail: profit after ad spend.

**Caveat.** At this scale, three weeks of holdout gives a rough answer, not a precise one.

**Capacity.** September had 49 orders (about 11 a week). The studio makes at most 20 made-to-order pieces a week, so headroom is about 38 orders a month. If demand passes that, publish the longer lead time rather than promise dates the studio cannot meet.

**Data limits.** Monthly totals by channel and device; event counts, not people; last-click attribution; no earlier Black Friday in the data. Several channel-and-device cells have fewer than 10 orders.
