import { Link } from '../lib/router'

export function NotFound() {
  return (
    <section className="notfound">
      <h1>We couldn't find that page</h1>
      <p>The piece or page may have moved. Browse the collection, or ask the stylist.</p>
      <p><Link to="/pieces" className="btn btn-primary">See all pieces</Link></p>
    </section>
  )
}
