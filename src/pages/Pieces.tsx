import { useState } from 'react'
import { CATEGORY_LABEL, OCCASIONS, occasionLabel, products, type Category } from '../data/catalogue'
import { ProductCard } from '../components/ProductCard'
import { useRouter } from '../lib/router'

const TYPES = Object.keys(CATEGORY_LABEL) as Category[]

export function Pieces() {
  const { search } = useRouter()
  const [occ, setOcc] = useState(search.get('occasion') ?? '')
  const [type, setType] = useState<Category | ''>('')
  const list = products.filter((p) => (!occ || p.occasions.includes(occ)) && (!type || p.category === type))
  return (
    <section className="pieces">
      <h1>All pieces</h1>
      <div className="filter-row">
        <label className="field">
          <span>Occasion</span>
          <select value={occ} onChange={(e) => setOcc(e.target.value)}>
            <option value="">All occasions</option>
            {OCCASIONS.map((o) => <option key={o} value={o}>{occasionLabel(o)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as Category | '')}>
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{CATEGORY_LABEL[t]}</option>)}
          </select>
        </label>
      </div>
      <p className="muted small" aria-live="polite">{list.length} {list.length === 1 ? 'piece' : 'pieces'}</p>
      <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  )
}
