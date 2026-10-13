import { useEffect, useRef } from 'react'
import { findProduct, gbp, subtitle } from '../data/catalogue'
import { useBag } from '../lib/bag'
import { Link, useRouter } from '../lib/router'

export function Header() {
  const { lines, setOpen } = useBag()
  const { path } = useRouter()
  const cur = (p: string) => (path === p || (p !== '/' && path.startsWith(p)) ? 'page' : undefined)
  return (
    <header className="site-header">
      <a href="#main" className="skip">Skip to content</a>
      <div className="header-inner">
        <Link to="/" className="wordmark" aria-label="Velmora, home">Velmora</Link>
        <nav aria-label="Main">
          <ul>
            <li><Link to="/pieces" aria-current={cur('/pieces')}>Pieces</Link></li>
            <li><Link to="/#occasions">Occasions</Link></li>
            <li><Link to="/stylist" aria-current={cur('/stylist')}>Stylist</Link></li>
          </ul>
        </nav>
        <button className="bag-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
          Bag<span className="bag-count" aria-label={`${lines.length} items`}>{lines.length}</span>
        </button>
      </div>
    </header>
  )
}

export function BagDrawer() {
  const { lines, remove, open, setOpen } = useBag()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  const total = lines.reduce((s, l) => s + (findProduct(l.id)?.price_gbp ?? 0), 0)
  return (
    <dialog ref={ref} className="drawer" onClose={() => setOpen(false)} aria-labelledby="bag-title">
      <div className="drawer-head">
        <h2 id="bag-title">Your bag</h2>
        <button className="text-btn" onClick={() => setOpen(false)}>Close</button>
      </div>
      {lines.length === 0 ? (
        <p className="muted">Your bag is empty. Choose a size on any piece to add it.</p>
      ) : (
        <ul className="bag-lines">
          {lines.map((l, i) => {
            const p = findProduct(l.id)!
            return (
              <li key={i}>
                <div>
                  <p className="bag-name">{p.name}</p>
                  <p className="muted small">{subtitle(p)}. {l.colour}, {l.size}</p>
                </div>
                <div className="bag-right">
                  <span>{gbp(p.price_gbp)}</span>
                  <button className="text-btn small" onClick={() => remove(i)} aria-label={`Remove ${p.name} ${l.size}`}>Remove</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {lines.length > 0 && (
        <>
          <p className="bag-total"><span>Subtotal</span><span>{gbp(total)}</span></p>
          <button className="btn btn-primary" disabled aria-describedby="demo-note">Checkout</button>
        </>
      )}
      <p id="demo-note" className="demo-note">
        This is a concept site for an assessment. Checkout is not connected: no order is placed and no payment is taken.
      </p>
    </dialog>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <p className="wordmark footer-mark">Velmora</p>
          <p className="muted">Evening wear, made in our London studio.</p>
        </div>
        <div>
          <h2 className="footer-h">Delivery</h2>
          <p>UK: 3 to 5 days after making.<br />EU: 5 to 8 days after making.</p>
        </div>
        <div>
          <h2 className="footer-h">Returns</h2>
          <p>Within 14 days, unworn, with tags. Made-to-order pieces in a non-standard size cannot be returned.</p>
        </div>
        <div>
          <h2 className="footer-h">Sizes</h2>
          <p>UK 6 to 18.</p>
        </div>
      </div>
      <p className="fineprint">
        Velmora is a fictional brand created for the GIS Analytics assessment. There is no product photography yet:
        colour panels show each piece's listed colours and fabric. No real brand's assets are used.
      </p>
    </footer>
  )
}
