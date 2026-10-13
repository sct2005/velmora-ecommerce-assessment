import { useRef, useState, type FormEvent } from 'react'
import { CATEGORY_LABEL, COLOURS, OCCASIONS, gbp, occasionLabel, subtitle, type Category } from '../data/catalogue'
import { fmtRange, parseISODate, toISODate, type Region } from '../lib/delivery'
import { readRequest, type ReaderSource } from '../lib/reader'
import { Link } from '../lib/router'
import { recommend, type Brief, type Pick } from '../lib/stylist'
import { Swatch } from './Swatch'

const BUDGETS = [250, 350, 450, 600]
const TYPES: Category[] = ['dress', 'jumpsuit', 'top', 'skirt', 'outerwear', 'accessory']
const SIZES = ['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18']
const QUICK_STARTS = [
  'Winter wedding guest, under £400',
  'Black tie, in emerald or midnight',
  "New Year's Eve, something that sparkles",
  'A jumpsuit for a dinner, size 12',
]

export interface StylistInit { occasion?: string; date?: string }

function PickCard({ pick, region }: { pick: Pick; region: Region }) {
  const { product: p, reasons, estimate: est, dateCheck, differs } = pick
  return (
    <li className="pick">
      <Link to={`/pieces/${p.id}`} className="pick-link">
        <div className="pick-swatches">{p.colours.map((c) => <Swatch key={c} colour={c} fabric={p.fabric} size="thumb" />)}</div>
        <div className="pick-body">
          <h3>{p.name} <span className="pick-price">{gbp(p.price_gbp)}</span></h3>
          <p className="muted small">{subtitle(p)}. {p.id}</p>
          {differs && <p className="pick-differs small">{differs}</p>}
          {reasons.length > 0 && <ul className="reasons">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
          {!dateCheck && <p className="small">Estimated arrival if ordered today: {fmtRange(est)} ({region}). An estimate, not a guarantee.</p>}
          <span className="pick-cta">View piece</span>
        </div>
      </Link>
    </li>
  )
}

export function Stylist({ init = {}, compact = false }: { init?: StylistInit; compact?: boolean }) {
  const [occasion, setOccasion] = useState(init.occasion && (OCCASIONS as readonly string[]).includes(init.occasion) ? init.occasion : '')
  const [date, setDate] = useState(init.date && parseISODate(init.date) ? init.date : '')
  const [region, setRegion] = useState<Region>('UK')
  const [budget, setBudget] = useState<number | ''>('')
  const [types, setTypes] = useState<Category[]>([])
  const [colours, setColours] = useState<string[]>([])
  const [fabrics, setFabrics] = useState<string[]>([])
  const [fits, setFits] = useState<string[]>([])
  const [names, setNames] = useState<string[]>([])
  const [size, setSize] = useState('')
  const [text, setText] = useState('')
  const [textNotes, setTextNotes] = useState<string[]>([])
  const [understood, setUnderstood] = useState<string[]>([])
  const [source, setSource] = useState<ReaderSource | null>(null)
  const [busy, setBusy] = useState(false)
  const [inputError, setInputError] = useState('')
  const [asked, setAsked] = useState(Boolean(init.occasion))
  const resultsRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)

  const brief: Brief = {
    occasion: occasion || undefined,
    eventDate: parseISODate(date) ?? undefined,
    region,
    maxBudget: budget === '' ? undefined : budget,
    categories: types.length ? types : undefined,
    colours: colours.length ? colours : undefined,
    fabrics: fabrics.length ? fabrics : undefined,
    fits: fits.length ? fits : undefined,
    names: names.length ? names : undefined,
    size: size || undefined,
  }
  const result = recommend(brief) // 48 items: cheap enough to compute on every render

  const submit = async (value: string) => {
    if (!value.trim()) {
      setInputError('Describe your occasion, or tap one of the suggestions.')
      inputRef.current?.focus()
      return
    }
    setInputError('')
    setBusy(true)
    const id = ++requestId.current
    const r = await readRequest(value.trim())
    if (id !== requestId.current) return // a newer request superseded this one
    setBusy(false)
    setSource(r.source)
    setTextNotes(r.notes)
    setUnderstood(r.understood)
    // The request replaces the filters, so what you see always matches what you asked.
    const b = r.brief
    setOccasion(b.occasion ?? '')
    setDate(b.eventDate ? toISODate(b.eventDate) : '')
    setRegion(b.region ?? 'UK')
    setBudget(b.maxBudget ?? '')
    setTypes(b.categories ?? [])
    setColours(b.colours ?? [])
    setFabrics(b.fabrics ?? [])
    setFits(b.fits ?? [])
    setNames(b.names ?? [])
    setSize(b.size ?? '')
    setAsked(true)
    // On phones the results sit below the filters: bring them into view.
    if (window.innerWidth < 1000) requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: 'start' }))
  }

  const onSubmit = (e: FormEvent) => { e.preventDefault(); void submit(text) }
  const toggle = <T,>(list: T[], set: (v: T[]) => void, v: T) => {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]); setAsked(true)
  }
  const reset = () => {
    setOccasion(''); setDate(''); setBudget(''); setTypes([]); setColours([]); setFabrics([]); setFits([]); setNames([]); setSize('')
    setText(''); setTextNotes([]); setUnderstood([]); setSource(null); setAsked(false); setInputError('')
  }
  const extra = [
    ...fabrics.map((f) => ({ label: `fabric: ${f}`, clear: () => setFabrics(fabrics.filter((x) => x !== f)) })),
    ...fits.map((f) => ({ label: `cut: ${f}`, clear: () => setFits(fits.filter((x) => x !== f)) })),
    ...names.map((n) => ({ label: `line: ${n[0].toUpperCase() + n.slice(1)}`, clear: () => setNames(names.filter((x) => x !== n)) })),
  ]
  const notes = asked ? [...new Set(textNotes.concat(result.notes))] : []

  return (
    <div className={`stylist ${compact ? 'stylist-compact' : ''}`}>
      <form className="ask" onSubmit={onSubmit} aria-busy={busy}>
        <label htmlFor="ask-text">Describe your occasion</label>
        <div className="ask-row">
          <input
            ref={inputRef} id="ask-text" type="text" value={text} maxLength={400}
            onChange={(e) => { setText(e.target.value); if (inputError) setInputError('') }}
            placeholder="A winter wedding in London, under £400, black or burgundy"
            autoComplete="off" aria-invalid={Boolean(inputError)} aria-describedby={inputError ? 'ask-error' : undefined}
          />
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Reading…' : 'Find pieces'}</button>
        </div>
        {inputError && <p id="ask-error" className="error small" role="alert">{inputError}</p>}
        <div className="quick" role="group" aria-label="Suggestions">
          {QUICK_STARTS.map((s) => (
            <button key={s} type="button" className="chip chip-quick" disabled={busy} onClick={() => { setText(s); void submit(s) }}>{s}</button>
          ))}
        </div>
        {understood.length > 0 && !busy && (
          <p className="small muted read-as" aria-live="polite">
            Read as: {understood.join('; ')}. Adjust anything below, or add to your request and search again.
          </p>
        )}
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
          </>
        )}
        {extra.length > 0 && (
          <p className="small extra-filters">
            Also filtering by{' '}
            {extra.map((x) => (
              <button key={x.label} type="button" className="chip chip-small" onClick={x.clear} aria-label={`Remove ${x.label}`}>{x.label} <span aria-hidden="true">×</span></button>
            ))}
          </p>
        )}
      </div>

      <section ref={resultsRef} className="results" aria-live="polite" aria-busy={busy} aria-label="Suggestions">
        {busy ? (
          <p className="empty loading">Reading your request…</p>
        ) : (
          <>
            {notes.length > 0 && <ul className="notes">{notes.map((n) => <li key={n}>{n}</li>)}</ul>}
            {!asked || result.status === 'clarify' ? (
              <p className="empty">
                {asked ? 'Choose an occasion, a budget, a colour or a type of piece, and' : 'Describe your occasion or tap a suggestion, and'} I'll suggest up to three pieces from the collection.
              </p>
            ) : result.status === 'none' ? (
              <div className="empty">
                <p><strong>No piece matches all of that.</strong> I won't suggest something that doesn't fit your request.</p>
                <ul>{result.relaxations.map((r) => <li key={r}>{r}</li>)}</ul>
                {result.alternatives && (
                  <>
                    <h3 className="alt-title">{result.alternatives.label}</h3>
                    <ol className="picks">{result.alternatives.picks.map((p) => <PickCard key={p.product.id} pick={p} region={region} />)}</ol>
                  </>
                )}
              </div>
            ) : (
              <ol className="picks">{result.picks.map((p) => <PickCard key={p.product.id} pick={p} region={region} />)}</ol>
            )}
            {source && asked && (
              <p className="reader-note small muted">
                {source === 'model'
                  ? 'Your words were read by Claude, an AI model. The pieces, prices and dates come only from our catalogue.'
                  : 'Your words were read with fixed rules. The pieces, prices and dates come only from our catalogue.'}
              </p>
            )}
          </>
        )}
        <div className="stylist-foot">
          {asked && !busy && <button type="button" className="text-btn" onClick={reset}>Start again</button>}
          <details>
            <summary>How the stylist works</summary>
            <p>
              When it is switched on, an AI model (Claude) reads your request and turns it into preferences: occasion,
              budget, colours, fabric, cut, size and date. Otherwise fixed rules do this. Either way, the model never
              chooses pieces. The stylist then matches those preferences against the 48 pieces in our catalogue with
              fixed rules, shows each piece at its listed price, and explains the match from the piece's recorded details.
            </p>
            <p>
              Arrival dates are estimates: the published making time plus delivery (UK 3 to 5 days, EU 5 to 8), counted in
              calendar days. They are not guaranteed. The stylist can't see photographs, judge fit on the body, or know the
              studio's current queue. The catalogue doesn't record sleeve or hem length, neckline or stock counts, and there
              are no customer reviews yet.
            </p>
          </details>
        </div>
      </section>
    </div>
  )
}
