"""Reproducible analysis of analytics.csv (repository root, unmodified). Run: python3 analysis/analyse.py"""
import csv, sys
from collections import defaultdict
from pathlib import Path
rows = list(csv.DictReader(open(Path(__file__).parent.parent / "analytics.csv")))
N = ["sessions","product_views","add_to_carts","checkouts_started","orders","revenue_gbp","ad_spend_gbp"]
for r in rows:
    for k in N: r[k] = int(r[k])
print("rows", len(rows), "months", sorted({r['month'] for r in rows}))
keys = [(r['month'], r['channel'], r['device']) for r in rows]
print("duplicate keys:", len(keys) - len(set(keys)))
print("\nData-quality flags:")
for r in rows:
    if r['checkouts_started'] > r['add_to_carts']: print("  checkouts > carts", r['month'], r['channel'], r['device'], r['add_to_carts'], r['checkouts_started'])
    if r['orders'] > r['checkouts_started']: print("  orders > checkouts", r['month'], r['channel'], r['device'])
    if r['orders'] == 0 and r['revenue_gbp']: print("  revenue w/o orders", r)
def agg(f):
    d = defaultdict(lambda: dict.fromkeys(N, 0))
    for r in rows:
        if f is None or True:
            k = f(r)
            if k is None: continue
            for n in N: d[k][n] += r[n]
    return d
def pct(a,b): return f"{100*a/b:.2f}%" if b else "n/a"
def show(title, d):
    print(f"\n== {title}")
    print(f"{'key':32}{'sess':>7}{'ATC%':>8}{'CO/S%':>8}{'ord/CO':>8}{'CVR':>8}{'orders':>7}{'rev':>8}{'AOV':>6}{'RPS':>6}{'spend':>6}")
    for k,v in sorted(d.items(), key=lambda kv: -kv[1]['sessions']):
        s=v['sessions']
        print(f"{str(k):32}{s:>7}{pct(v['add_to_carts'],s):>8}{pct(v['checkouts_started'],s):>8}{pct(v['orders'],v['checkouts_started']):>8}{pct(v['orders'],s):>8}{v['orders']:>7}{v['revenue_gbp']:>8}{(v['revenue_gbp']//v['orders'] if v['orders'] else 0):>6}{(v['revenue_gbp']/s if s else 0):>6.2f}{v['ad_spend_gbp']:>6}")
show("Total", agg(lambda r: "all"))
show("Device", agg(lambda r: r['device']))
show("Channel", agg(lambda r: r['channel']))
show("Channel x device", agg(lambda r: (r['channel'], r['device'])))
show("Month", agg(lambda r: r['month']))
show("Month (excl paid_social)", agg(lambda r: None if r['channel']=='paid_social' else r['month']))
show("Paid social by month/device", agg(lambda r: (r['month'], r['device']) if r['channel']=='paid_social' else None))
show("Instagram by month, mobile", agg(lambda r: r['month'] if (r['channel'],r['device'])==('instagram','mobile') else None))
# ROAS
ps = [r for r in rows if r['channel']=='paid_social']
spend = sum(r['ad_spend_gbp'] for r in ps); rev = sum(r['revenue_gbp'] for r in ps)
print(f"\nPaid social: spend £{spend}, attributed revenue £{rev}, ROAS {rev/spend:.2f}, gross profit at 55% £{rev*0.55:.0f}, net after spend £{rev*0.55-spend:.0f}")
for m in ("2026-08","2026-09"):
    s=sum(r['ad_spend_gbp'] for r in ps if r['month']==m); v=sum(r['revenue_gbp'] for r in ps if r['month']==m)
    print(f"  {m}: spend £{s} rev £{v} ROAS {v/s:.2f}")
# mobile vs desktop gap if mobile matched desktop checkout completion
mob = agg(lambda r: r['device'])['mobile']; desk = agg(lambda r: r['device'])['desktop']
dr = desk['orders']/desk['checkouts_started']
print(f"\nMobile checkouts {mob['checkouts_started']} orders {mob['orders']}; desktop completion {dr:.1%}; mobile completion {mob['orders']/mob['checkouts_started']:.1%}")
print(f"If mobile checkout completion were half desktop's ({dr/2:.1%}): +{mob['checkouts_started']*dr/2 - mob['orders']:.0f} orders over 6 months (illustrative, not a forecast)")

# ---------------------------------------------------------------------------
# Robustness checks (added 15 Oct): significance, mix, trend, halo, capacity, power
# ---------------------------------------------------------------------------
import math
months = sorted({r['month'] for r in rows})
def tot(f, k): return sum(r[k] for r in rows if f(r))
def wilson(x, n, z=1.96):
    p = x / n; d = 1 + z * z / n; c = p + z * z / (2 * n); h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (c - h) / d, (c + h) / d
def ztest(x1, n1, x2, n2):
    p = (x1 + x2) / (n1 + n2); z = (x1 / n1 - x2 / n2) / math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
    return z, math.erfc(abs(z) / math.sqrt(2))
def n_needed(p1, p2, za=1.96, zb=0.8416):
    pb = (p1 + p2) / 2
    return ((za * math.sqrt(2 * pb * (1 - pb)) + zb * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) / (p2 - p1)) ** 2

print("\n== R1. Checkout completion by device, 95% Wilson CI, two-proportion z-test")
dev = {}
for d in ("mobile", "desktop"):
    o = tot(lambda r: r['device'] == d, 'orders'); c = tot(lambda r: r['device'] == d, 'checkouts_started'); dev[d] = (o, c)
    lo, hi = wilson(o, c); print(f"  {d:8} {o}/{c} = {o/c:.1%} (95% CI {lo:.1%} to {hi:.1%})")
z, p = ztest(*dev['mobile'], *dev['desktop']); print(f"  z = {z:.1f}, p = {p:.1e}")
a = (tot(lambda r: r['device'] == 'mobile', 'add_to_carts'), tot(lambda r: r['device'] == 'mobile', 'sessions'))
b = (tot(lambda r: r['device'] == 'desktop', 'add_to_carts'), tot(lambda r: r['device'] == 'desktop', 'sessions'))
z, p = ztest(*a, *b); print(f"  add-to-cart per session: mobile {a[0]/a[1]:.2%} vs desktop {b[0]/b[1]:.2%}, p = {p:.2f} (no difference)")

print("\n== R2. Mobile completion by month, excluding paid social (the earlier 'decline' was a mix effect)")
for m in months:
    o = tot(lambda r: r['month'] == m and r['device'] == 'mobile' and r['channel'] != 'paid_social', 'orders')
    c = tot(lambda r: r['month'] == m and r['device'] == 'mobile' and r['channel'] != 'paid_social', 'checkouts_started')
    oa = tot(lambda r: r['month'] == m and r['device'] == 'mobile', 'orders'); ca = tot(lambda r: r['month'] == m and r['device'] == 'mobile', 'checkouts_started')
    print(f"  {m}: excl. paid {o}/{c} = {o/c:.1%}   incl. paid {oa}/{ca} = {oa/ca:.1%}")
e = lambda lo_m, hi_m, k: tot(lambda r: lo_m <= r['month'] <= hi_m and r['device'] == 'mobile' and r['channel'] != 'paid_social', k)
z, p = ztest(e('2026-04', '2026-05', 'orders'), e('2026-04', '2026-05', 'checkouts_started'), e('2026-08', '2026-09', 'orders'), e('2026-08', '2026-09', 'checkouts_started'))
print(f"  Apr-May vs Aug-Sep (excl. paid): p = {p:.2f} -> flat")

print("\n== R3. Cross-device sign: email desktop")
print(f"  email desktop: {tot(lambda r: r['channel']=='email' and r['device']=='desktop','orders')} orders from "
      f"{tot(lambda r: r['channel']=='email' and r['device']=='desktop','checkouts_started')} checkouts; checkouts exceed add-to-carts in Jun, Jul, Aug")

print("\n== R4. Paid social: last-click vs trend-adjusted halo")
spend = tot(lambda r: r['channel'] == 'paid_social', 'ad_spend_gbp'); rev = tot(lambda r: r['channel'] == 'paid_social', 'revenue_gbp')
base = [tot(lambda r, m=m: r['month'] == m and r['channel'] != 'paid_social', 'revenue_gbp') for m in months[:4]]
mx = 1.5; my = sum(base) / 4; slope = sum((i - mx) * (y - my) for i, y in enumerate(base)) / sum((i - mx) ** 2 for i in range(4))
proj = [my + slope * (4 - mx), my + slope * (5 - mx)]
actual = [tot(lambda r, m=m: r['month'] == m and r['channel'] != 'paid_social', 'revenue_gbp') for m in months[4:]]
excess = sum(actual) - sum(proj)
print(f"  non-paid revenue Apr-Jul {base}; Aug-Sep trend {proj[0]:.0f}, {proj[1]:.0f}; actual {actual}; excess £{excess:,.0f}")
for label, halo in (("no halo (last click)", 0), ("all excess caused by ads", excess)):
    print(f"  {label:26} ROAS {(rev + halo) / spend:.2f}  contribution at 55% £{(rev + halo) * 0.55 - spend:,.0f}  (break-even ROAS {1/0.55:.2f})")
po = tot(lambda r: r['channel'] == 'paid_social' and r['device'] == 'mobile', 'orders'); pc = tot(lambda r: r['channel'] == 'paid_social' and r['device'] == 'mobile', 'checkouts_started')
print(f"  paid social mobile checkout completion {po}/{pc} = {po/pc:.1%}")

print("\n== R5. Checkout starts not completed (recovery pool), capacity")
for m in months[-2:]:
    c = tot(lambda r, m=m: r['month'] == m, 'checkouts_started'); o = tot(lambda r, m=m: r['month'] == m, 'orders'); print(f"  {m}: {c - o} of {c} checkout starts not completed")
sep = tot(lambda r: r['month'] == '2026-09', 'orders'); print(f"  Sep orders {sep} (~{sep/4.35:.0f}/week); capacity 20 made-to-order/week (~87/month) -> headroom ~{87 - sep}/month")

print("\n== R6. Can a 4-week before/after test detect a change? (80% power, 5% significance)")
for target in (0.20, 0.25, 0.30):
    print(f"  mobile completion 14.4% -> {target:.0%}: needs ~{n_needed(0.144, target):.0f} mobile checkouts per period")
sm = tot(lambda r: r['month'] == '2026-09' and r['device'] == 'mobile', 'checkouts_started'); print(f"  Sep pace: {sm} mobile checkouts/month (~{sm/4.35*4:.0f} per 4 weeks)")
