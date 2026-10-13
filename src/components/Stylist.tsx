import { useRef, useState, type FormEvent } from 'react'
import { CATEGORY_LABEL, COLOURS, OCCASIONS, gbp, occasionLabel, subtitle, type Category } from '../data/catalogue'
import { fmtRange, parseISODate, toISODate, type Region } from '../lib/delivery'
import { Link } from '../lib/router'
import { parseText, recommend, type Brief } from '../lib/stylist'
import { Swatch } from './Swatch'

const BUDGETS = [250, 350, 450, 600]
const TYPES: Category[] = ['dress', 'jumpsuit', 'top', 'skirt', 'outerwear', 'accessory']
const SIZES = ['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18']

export interface StylistInit { occasion?: string; date?: string }

export function Stylist({ init = {}, compact = false }: { init?: StylistInit; compact?: boolean }) {
  const [occasion, setOccasion] = useState(init.occasion && (OCCASIONS as readonly string[]).includes(init.occasion) ? init.occasion : '')
  const [date, setDate] = useState(init.date && parseISODate(init.date) ? init.date : '')
  const [region, setRegion] = useState<Region>('UK')
  const [budget, setBudget] = useState<number | ''>('')
  const [types, setTypes] = useState<Category[]>([])
  const [colours, setColours] = useState<string[]>([])
  const [fabrics, setFabrics] = useState<string[]>([])
  const [size, setSize] = useState('')
  const [text, setText] = useState('')
  const [textNotes, setTextNotes] = useState<string[]>([])
  const [understood, setUnderstood] = useState<string[]>([])
  const [asked, setAsked] = useState(Boolean(init.occasion))
  const resultsRef = useRef<HTMLElement>(null)

  const brief: Brief = {
    occasion: occasion || undefined,
    eventDate: parseISODate(date) ?? undefined,
    region,
    maxBudget: budget === '' ? undefined : budget,
    categories: types.length ? types : undefined,
    colours: colours.length ? colours : undefined,
    fabrics: fabrics.length ? fabrics : undefined,
    size: size || undefined,
  }
  const result = recommend(brief) // 48 items: cheap enough to compute on every render

  const readText = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const p = parseText(text)
    setTextNotes(p.notes)
    setUnderstood(p.understood)
    const b = p.brief
    if (b.occasion) setOccasion(b.occasion)
    if (b.eventDate) setDate(toISODate(b.eventDate))
    if (b.region) setRegion(b.region)
    if (b.maxBudget != null) setBudget(b.maxBudget)
    setTypes(b.categories ?? [])
    setColours(b.colours ?? [])
    setFabrics(b.fabrics ?? [])
    setSize(b.size ?? '')
    setAsked(true)
    // On phones the results sit below the filters: bring them into view.
    if (window.innerWidth < 1000) requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: 'start' }))
  }

  const toggle = <T,>(list: T[], set: (v: T[]) => void, v: T) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]); setAsked(true)
  }
  const reset = () => {
    setOccasion(''); setDate(''); setBudget(''); setTypes([]); setColours([]); setFabrics([]); setSize('')
    setText(''); setTextNotes([]); setUnderstood([]); setAsked(false)
  }

  return (
    <div className={`stylist ${compact ? 'stylist-compact' : ''}`}>
      <form className="ask" onSubmit={readText}>
        <label htmlFor="ask-text">Describe what you need</label>
        <div className="ask-row">
          <input
            id="ask-text" type="text" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="A dress for a winter wedding on 12 December, under £400"
            autoComplete="off"
          />
          <button className="btn btn-primary" type="submit">Find pieces</button>
        </div>
        {understood.length > 0 && <p className="small muted" aria-live="polite">Read as: {understood.join('; ')}. Adjust anything below.</p>}
      </form>

      <div className="filters" role="group" aria-label="Your occasion">
        <fieldset>
          <legend>Occasion</legend>
          <div className="chips">
            {OCCASIONS.map((o) => (
              <button key={o} type="button" className="chip" aria-pressed={occasion === o}
                onClick={() => { setOccasion(occasion === o ? '' : o); setAsked(true) }}>{occasionLabel(o)}</button>
            ))}
          </div>
        </fieldset>
        <div className="filter-row">
          <label className="field">
            <span>Date of your occasion</span>
            <input type="date" value={date} min={toISODate(new Date())} onChange={(e) => { setDate(e.target.value); setAsked(true) }} />
          </label>
          <label className="field">
            <span>Delivery to</span>
            <select value={region} onChange={(e) => setRegion(e.target.value as Region)}>
              <option value="UK">United Kingdom</option>
              <option value="EU">European Union</option>
            </select>
          </label>
          <label className="field">
            <span>Budget</span>
            <select value={budget} onChange={(e) => { setBudget(e.target.value ? Number(e.target.value) : ''); setAsked(true) }}>
              <option value="">Any</option>
              {[...new Set([...BUDGETS, ...(budget !== '' ? [budget] : [])])].sort((a, b) => a - b).map((b) => <option key={b} value={b}>Up to {gbp(b)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Size</span>
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">Any</option>
              {[...new Set([...SIZES, ...(size ? [size] : [])])].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        {!compact && (
          <>
            <fieldset>
              <legend>Type of piece</legend>
              <div className="chips">
                {TYPES.map((t) => <button key={t} type="button" className="chip" aria-pressed={types.includes(t)} onClick={() => toggle(types, setTypes, t)}>{CATEGORY_LABEL[t]}</button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend>Colour</legend>
              <div className="chips">
                {COLOURS.map((c) => (
                  <button key={c} type="button" className="chip chip-colour" aria-pressed={colours.includes(c)} onClick={() => toggle(colours, setColours, c)}>
                    <Swatch colour={c} fabric="crepe" size="thumb" />{c}
                  </button>
                ))}
              </div>
            </fieldset>
            {fabrics.length > 0 && (
              <p className="small">Fabric: {fabrics.join(' or ')}. <button className="text-btn small" type="button" onClick={() => setFabrics([])}>Clear fabric</button></p>
            )}
          </>
        )}
      </div>

      <section ref={resultsRef} className="results" aria-live="polite" aria-label="Suggestions">
        {textNotes.concat(result.notes).length > 0 && asked && (
          <ul className="notes">{[...new Set(textNotes.concat(result.notes))].map((n) => <li key={n}>{n}</li>)}</ul>
        )}
        {!asked || result.status === 'clarify' ? (
          <p className="empty">Choose an occasion, or describe what you need, and I'll suggest up to three pieces from the collection.</p>
        ) : result.status === 'none' ? (
          <div className="empty">
            <p><strong>No piece matches all of that.</strong> I won't suggest something that doesn't fit your brief.</p>
            <ul>{result.relaxations.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
        ) : (
          <ol className="picks">
            {result.picks.map(({ product: p, reasons, estimate: est, dateCheck }) => (
              <li key={p.id} className="pick">
                <Link to={`/pieces/${p.id}`} className="pick-link">
                  <div className="pick-swatches">{p.colours.map((c) => <Swatch key={c} colour={c} fabric={p.fabric} size="thumb" />)}</div>
                  <div className="pick-body">
                    <h3>{p.name} <span className="pick-price">{gbp(p.price_gbp)}</span></h3>
                    <p className="muted small">{subtitle(p)}. {p.id}</p>
                    <ul className="reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                    {!dateCheck && <p className="small">Estimated arrival if ordered today: {fmtRange(est)} ({region}).</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
        <div className="stylist-foot">
          {asked && <button type="button" className="text-btn" onClick={reset}>Start again</button>}
          <details>
            <summary>How the stylist works</summary>
            <p>
              The stylist matches your answers against the 48 pieces in our catalogue using fixed rules. It is not a chat model.
              It only suggests pieces we list, at their listed price, and explains each suggestion from the piece's recorded
              occasion, colour, fabric and making time.
            </p>
            <p>
              Arrival dates are estimates: the published making time plus delivery (UK 3 to 5 days, EU 5 to 8), counted in
              calendar days. They are not guaranteed. The stylist can't see photographs, judge fit on the body, or know the
              studio's current queue. For anything it can't answer, contact the studio.
            </p>
          </details>
        </div>
      </section>
    </div>
  )
}
