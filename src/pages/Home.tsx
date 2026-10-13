import { useState } from 'react'
import { FEATURED_ID, OCCASIONS, findProduct, gbp, occasionLabel, productsFor, subtitle, isOrderable } from '../data/catalogue'
import { ProductCard } from '../components/ProductCard'
import { Swatch } from '../components/Swatch'
import { Stylist } from '../components/Stylist'
import { Link, useRouter } from '../lib/router'
import { toISODate } from '../lib/delivery'

export function Home() {
  const { navigate } = useRouter()
  const [occ, setOcc] = useState<string>('winter wedding')
  const [date, setDate] = useState('')
  const [browse, setBrowse] = useState<string>('winter wedding')
  const featured = findProduct(FEATURED_ID)!
  const inOccasion = productsFor(browse).filter(isOrderable)

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">Evening wear, made for the date in your diary.</h1>
          <p className="lede">
            Most pieces are made to order in our London studio in 14 to 21 days. Tell us when you need it and we'll
            show what can arrive in time.
          </p>
          <form
            className="sentence"
            onSubmit={(e) => {
              e.preventDefault()
              const q = new URLSearchParams({ occasion: occ, ...(date ? { date } : {}) })
              navigate(`/stylist?${q}`)
            }}
          >
            <p>
              <span>I'm dressing for a </span>
              <label className="sr-only" htmlFor="hero-occ">Occasion</label>
              <select id="hero-occ" value={occ} onChange={(e) => setOcc(e.target.value)}>
                {OCCASIONS.map((o) => <option key={o} value={o}>{o === "new year's eve" ? "New Year's Eve" : o}</option>)}
              </select>
              <span> on </span>
              <label className="sr-only" htmlFor="hero-date">Date of the occasion (optional)</label>
              <input id="hero-date" type="date" value={date} min={toISODate(new Date())} onChange={(e) => setDate(e.target.value)} />
            </p>
            <button className="btn btn-light" type="submit">Show pieces that arrive in time</button>
          </form>
        </div>
        <Link to={`/pieces/${featured.id}`} className="hero-visual" aria-label={`${featured.name}, ${subtitle(featured)}, ${gbp(featured.price_gbp)}`}>
          <Swatch colour="oxblood" fabric={featured.fabric} size="hero" />
          <span className="hero-caption">
            <span>{featured.name} in oxblood crepe</span>
            <span>{gbp(featured.price_gbp)}</span>
          </span>
        </Link>
      </section>

      <section className="made" aria-labelledby="made-title">
        <h2 id="made-title">How made to order works</h2>
        <ol className="steps">
          <li>
            <h3>You order</h3>
            <p>Choose your size, UK 6 to 18. We show an estimated arrival date before you order.</p>
          </li>
          <li>
            <h3>We make it</h3>
            <p>Your piece is cut and sewn in our London studio in 14 to 21 days. Each piece lists its own making time.</p>
          </li>
          <li>
            <h3>It travels</h3>
            <p>UK delivery takes 3 to 5 days after making; EU 5 to 8. Accessories and a few pieces ship from stock.</p>
          </li>
        </ol>
      </section>

      <section className="occasions" id="occasions" aria-labelledby="occ-title">
        <div className="section-head">
          <h2 id="occ-title">Shop by occasion</h2>
          <Link to="/pieces" className="text-link">All 48 pieces</Link>
        </div>
        <div className="occ-tabs" role="group" aria-label="Choose an occasion">
          {OCCASIONS.map((o) => {
            const n = productsFor(o).filter(isOrderable).length
            return (
              <button key={o} type="button" className="occ-tab" aria-pressed={browse === o} onClick={() => setBrowse(o)}>
                <span className="occ-name">{occasionLabel(o)}</span>
                <span className="occ-count">{n} pieces</span>
              </button>
            )
          })}
        </div>
        <div className="grid" aria-live="polite">
          {inOccasion.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="stylist-section" id="stylist" aria-labelledby="st-title">
        <div className="section-head">
          <h2 id="st-title">Find your occasion look</h2>
          <Link to="/stylist" className="text-link">Open full stylist</Link>
        </div>
        <p className="lede-small">
          Tell the stylist about your occasion in your own words. It suggests up to three pieces from the collection,
          explains each match, checks the estimated arrival against your date, and tells you when nothing fits.
        </p>
        <Stylist compact />
      </section>
    </>
  )
}
