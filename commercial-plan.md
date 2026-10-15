# Velmora: three changes before Black Friday

Black Friday is 27 November 2026. Source: `analytics.csv`, April to September 2026 (31,667 sessions, 239 orders, £80,440, average order £337); every figure is reproduced by `analysis/analyse.py`. Ranked by expected effect on sales.

## 1. Fix the mobile checkout

**Evidence.** Phone and desktop visitors add to cart at the same rate (5.61% vs 5.63%). The gap opens inside checkout: **14.4% of mobile checkouts become orders (109 of 755), against 57.3% on desktop (130 of 227)**, p < 0.001. It holds within Instagram (12% vs 36%) and direct (27% vs 71%), so it is not a channel-mix effect. Phones bring 79% of sessions.

**Change.** Watch 10 mobile checkout recordings to find the step where people leave. Turn on express wallets (Apple Pay, Google Pay, Shop Pay) and guest checkout. Show the arrival date and the returns rule before payment, as the concept site does.

**Measure.** KPI: mobile orders ÷ mobile checkouts started, weekly. Compare 4 weeks after launch with the 4 weeks before, with desktop as the control; about 190 checkouts can detect a rise to about 26%, not a small gain. Guardrail: total orders on all devices, so orders moving from desktop to phone don't count as a win.

**Size (illustrative, not a forecast).** At September's 209 mobile checkouts, 25% completion would add about 22 orders a month (about £7,400).

**Caveat.** The data shows where people leave, not why. Some may finish on desktop: email on desktop completes 39 of 39 checkouts, a sign of saved or emailed baskets, so the real gain may be smaller.

## 2. Turn Instagram visitors into email subscribers, and remind people who left checkout

**Evidence.** Email earns **£9.80 per session** (2.98% conversion, 95% CI 2.3% to 3.9%) against £1.58 for Instagram (0.47%), which brings 59% of sessions. In September, 206 of 255 checkout starts did not become orders.

**Change.** Add an email sign-up for Black Friday early access on the site and the Instagram bio link. Check that Shopify's abandoned-checkout email is switched on. Send occasion emails with real order-by dates from the lead times. Offer early access, not deep discounts.

**Measure.** KPIs, weekly: new subscribers per 100 Instagram sessions; orders from abandoned-checkout emails ÷ emails sent; email revenue per month against the April to September baseline of £2,850.

**Size (illustrative).** Winning back 1 in 20 of September's 206 unfinished checkout starts would add about 10 orders a month (about £3,400); the 1-in-20 rate is an assumption, not a benchmark. **Caveat:** today's email readers are probably past buyers, so new subscribers will convert below 2.98%.

## 3. Don't scale paid social yet: retarget warm visitors and test whether it adds sales

**Evidence.** The August–September test spent £2,700 for £3,376 of attributed revenue: £1.25 per £1 against a £1.82 break-even at a 55% margin, about −£843. But other channels earned £3,386 above their April–July trend in those months; if the ads caused that, the return was £2.50 (+£1,019). The data cannot separate an ad effect from the start of party season. Paid visitors complete only 6.2% of mobile checkouts, so change 1 helps this channel most.

**Change.** After the checkout fix, move spend from cold audiences to people who have visited or added to cart, at no more than September's £1,500. Hold out a random 20% of that audience from the ads.

**Measure.** Incremental return = extra revenue in the group shown ads over the held-out group, scaled to the full audience, ÷ spend. Keep only above £1.82 per £1: at £1,500 a month the ads must add at least £2,730 of revenue. Stop before Black Friday week if not. **Caveat:** three weeks of holdout at this scale gives a rough answer.

**Black Friday week.** Black Friday falls two days after the EU Christmas cut-off for 21-day pieces (25 November) and one day before the UK one (28 November). Open subscriber early access before 25 November; on the day, lead with each piece's order-by date (now on every product page) and point EU shoppers to pieces made in 18 days or fewer.

**Capacity.** September had 49 orders (about 11 a week); the studio makes at most 20 made-to-order pieces a week, so headroom is about 38 orders a month. Beyond that, publish longer lead times rather than promise dates the studio cannot meet.

**Data limits.** Monthly totals by channel and device; event counts, not people; last-click attribution; no earlier Black Friday; several cells have fewer than 10 orders. Tests and caveats: `analysis/sales-findings.md`.
