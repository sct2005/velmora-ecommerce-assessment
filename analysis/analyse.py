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
