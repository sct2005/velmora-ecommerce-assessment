import { useEffect, useState } from 'react'
import { COLOUR_HEX, cap, findProduct, gbp, isOrderable, joinAnd, occasionLabel, products, subtitle, type Product as P } from '../data/catalogue'
import { ProductCard } from '../components/ProductCard'
import { Swatch } from '../components/Swatch'
import { useBag } from '../lib/bag'
import { checkDate, christmasOrderBy, estimate, fmtDate, fmtRange, makingLine, parseISODate, toISODate, type Region } from '../lib/delivery'
import { Link } from '../lib/router'
import { NotFound } from './NotFound'

function useProductMeta(p: P | undefined) {
  useEffect(() => {
    if (!p) return
    document.title = `${p.name}, ${subtitle(p).toLowerCase()} | Velmora`
    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.id = 'product-ld'
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      sku: p.id,
      name: `${p.name}, ${subtitle(p).toLowerCase()}`,
      description: p.description,
      brand: { '@type': 'Brand', name: 'Velmora' },
      material: p.fabric,
      color: p.colours.join(', '),
      size: p.sizes.join(', '),
      offers: {
        '@type': 'Offer',
        priceCurrency: 'GBP',
        price: p.price_gbp,
        availability: !isOrderable(p) ? 'https://schema.org/OutOfStock'
          : p.made_to_order ? 'https://schema.org/MadeToOrder' : 'https://schema.org/InStock',
      },
    })
    document.head.appendChild(ld)
    return () => { ld.remove(); document.title = 'Velmora | Evening wear made in London' }
  }, [p])
}

export function Product({ id }: { id: string }) {
  const p = findProduct(id)
  useProductMeta(p)
  const { add } = useBag()
  // Start on the colour the description names, so the panel and text agree.
  const [colour, setColour] = useState(p ? (p.colours.find((c) => p.description.includes(c)) ?? p.colours[0]) : '')
  const [size, setSize] = useState(p?.sizes.length === 1 ? p.sizes[0] : '')
  const [sizeError, setSizeError] = useState(false)
  const [region, setRegion] = useState<Region>('UK')
  const [date, setDate] = useState('')

  if (!p) return <NotFound />
  const orderable = isOrderable(p)
  const est = estimate(p, region)
  const occasionDate = parseISODate(date)
  const dc = est && occasionDate ? checkDate(est, occasionDate) : undefined
  const xmas = christmasOrderBy(p, region)
  const related = products.filter((x) => x.id !== p.id && isOrderable(x) && x.occasions.some((o) => p.occasions.includes(o))).slice(0, 4)

  const onAdd = () => {
    if (!size) { setSizeError(true); document.getElementById('size-legend')?.focus(); return }
    add({ id: p.id, colour, size })
  }

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/pieces">Pieces</Link></li>
          <li aria-current="page">{p.name}</li>
        </ol>
      </nav>
      <article className="pdp">
        <div className="pdp-gallery">
          <Swatch colour={colour} fabric={p.fabric} size="gallery" label={`${colour} ${p.fabric}`} />
          <p className="small muted">No photography yet. The panel shows the selected colour and fabric.</p>
        </div>

        <div className="pdp-info">
          <h1 className="pdp-name">{p.name}</h1>
          <p className="pdp-sub">{subtitle(p)}</p>
          <p className="pdp-price">{gbp(p.price_gbp)}</p>
          <p className="pdp-desc">{p.description}</p>

          <fieldset className="opt">
            <legend>Colour: <strong>{cap(colour)}</strong></legend>
            <div className="colour-opts">
              {p.colours.map((c) => (
                <label key={c} className="colour-opt">
                  <input type="radio" name="colour" value={c} checked={colour === c} onChange={() => setColour(c)} />
                  <span className="dot" style={{ background: COLOUR_HEX[c]?.bg }} aria-hidden="true" />
                  <span>{cap(c)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="opt" aria-describedby={sizeError ? 'size-err' : undefined}>
            <legend id="size-legend" tabIndex={-1}>Size{size && <>: <strong>{size}</strong></>}</legend>
            <div className="size-opts">
              {p.sizes.map((s) => (
                <label key={s} className="size-opt">
                  <input type="radio" name="size" value={s} checked={size === s} onChange={() => { setSize(s); setSizeError(false) }} disabled={!orderable} />
                  <span>{s.replace('UK ', '')}</span>
                </label>
              ))}
            </div>
            {p.made_to_order && <p className="small muted">UK sizes. Each piece is made to your order in the size you choose.</p>}
            {sizeError && <p id="size-err" className="error" role="alert">Choose a size to add this piece to your bag.</p>}
          </fieldset>

          <div className="cta">
            {orderable ? (
              <button className="btn btn-primary btn-block" onClick={onAdd}>
                {size ? `Add to bag, ${size}` : 'Add to bag'}
              </button>
            ) : (
              <button className="btn btn-block" disabled>Currently unavailable</button>
            )}
            <p className="small muted">{orderable ? makingLine(p) + '.' : 'This piece ships from stock and is not in stock at the moment.'}</p>
          </div>

          {est && (
            <section className="arrival" aria-labelledby="arr-title">
              <h2 id="arr-title">When would it arrive?</h2>
              <div className="filter-row">
                <label className="field">
                  <span>Delivery to</span>
                  <select value={region} onChange={(e) => setRegion(e.target.value as Region)}>
                    <option value="UK">United Kingdom</option>
                    <option value="EU">European Union</option>
                  </select>
                </label>
                <label className="field">
                  <span>Your occasion (optional)</span>
                  <input type="date" value={date} min={toISODate(new Date())} onChange={(e) => setDate(e.target.value)} />
                </label>
              </div>
              <p className="arrival-est" aria-live="polite">
                Ordered today: estimated arrival <strong>{fmtRange(est)}</strong>.
              </p>
              {dc && (
                <p className={`verdict verdict-${dc.verdict}`} aria-live="polite">
                  {dc.verdict === 'in-time' && `Should arrive ${dc.spareDays} days or more before ${fmtDate(occasionDate!)}.`}
                  {dc.verdict === 'tight' && `Close: the estimate runs up to ${fmtDate(occasionDate!)}. A piece with a shorter making time is safer.`}
                  {dc.verdict === 'too-late' && `Unlikely to arrive before ${fmtDate(occasionDate!)}. Try the stylist for pieces that can.`}
                  {dc.verdict === 'past' && 'That date has passed.'}
                </p>
              )}
              {xmas && (
                <p className={`xmas ${xmas.passed ? 'xmas-passed' : ''}`} data-testid="xmas-order-by">
                  {xmas.passed
                    ? `Christmas: too late for ${region} delivery by Christmas Eve, based on the published making and delivery times.`
                    : <>Christmas: order by <strong>{fmtDate(xmas.date)}</strong> for {region} delivery by Christmas Eve.</>}
                </p>
              )}
              <p className="small muted">
                {p.made_to_order ? `${p.lead_time_days} days making` : `Sent within ${p.lead_time_days} days`} plus {est.shipping[0]} to {est.shipping[1]} days
                delivery ({region}), in calendar days. An estimate, not a guaranteed date.
              </p>
            </section>
          )}

          <dl className="specs">
            <div><dt>Fabric</dt><dd>{cap(p.fabric)}</dd></div>
            {p.fit && <div><dt>Fit</dt><dd>{cap(p.fit)}</dd></div>}
            <div><dt>Colours</dt><dd>{cap(joinAnd(p.colours))}</dd></div>
            <div><dt>Made for</dt><dd>{cap(joinAnd(p.occasions.map((o) => (o === "new year's eve" ? "New Year's Eve" : o))))}</dd></div>
            <div><dt>Sizes</dt><dd>{p.sizes.length > 1 ? `${p.sizes[0]} to ${p.sizes[p.sizes.length - 1].replace('UK ', '')}` : cap(p.sizes[0])}</dd></div>
            <div><dt>Returns</dt><dd>Within 14 days, unworn, with tags. Made-to-order pieces in a non-standard size cannot be returned.</dd></div>
            <div><dt>Product code</dt><dd>{p.id}</dd></div>
          </dl>
        </div>
      </article>

      {related.length > 0 && (
        <section className="related" aria-labelledby="rel-title">
          <h2 id="rel-title">Also for {joinAnd(p.occasions.map((o) => occasionLabel(o).toLowerCase().replace("new year's eve", "New Year's Eve")))}</h2>
          <div className="grid">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
    </>
  )
}
