import { gbp, isOrderable, subtitle, type Product } from '../data/catalogue'
import { Link } from '../lib/router'
import { Swatch } from './Swatch'

export function ProductCard({ p, note }: { p: Product; note?: string }) {
  const made = !isOrderable(p) ? 'Currently unavailable' : p.made_to_order ? `Made to order, ${p.lead_time_days} days` : 'Ships from stock'
  return (
    <article className="card">
      <Link to={`/pieces/${p.id}`} className="card-link" aria-label={`${p.name}, ${subtitle(p)}, ${gbp(p.price_gbp)}`}>
        <div className="card-swatches">
          {p.colours.map((c) => <Swatch key={c} colour={c} fabric={p.fabric} />)}
        </div>
        <div className="card-body">
          <h3 className="card-name">{p.name}</h3>
          <p className="card-sub">{subtitle(p)}</p>
          <p className="card-meta"><span className="price">{gbp(p.price_gbp)}</span><span>{made}</span></p>
          {note && <p className="card-note">{note}</p>}
        </div>
      </Link>
    </article>
  )
}
