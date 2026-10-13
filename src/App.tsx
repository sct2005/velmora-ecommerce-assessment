import { useEffect } from 'react'
import { BagDrawer, Footer, Header } from './components/Chrome'
import { Stylist } from './components/Stylist'
import { BagProvider } from './lib/bag'
import { RouterProvider, useRouter } from './lib/router'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Pieces } from './pages/Pieces'
import { Product } from './pages/Product'

function StylistPage() {
  const { search } = useRouter()
  useEffect(() => { document.title = 'Find your occasion look | Velmora' }, [])
  return (
    <section className="stylist-page">
      <h1>Find your occasion look</h1>
      <p className="lede-small">
        Tell us about your occasion in your own words: what it is, when, your budget and colours you like. We'll suggest
        up to three pieces from the collection and check whether they can arrive in time.
      </p>
      <Stylist init={{ occasion: search.get('occasion') ?? undefined, date: search.get('date') ?? undefined }} />
    </section>
  )
}

function Routes() {
  const { path } = useRouter()
  useEffect(() => { if (path === '/' || path === '/pieces') document.title = 'Velmora | Evening wear made in London' }, [path])
  const m = /^\/pieces\/([A-Za-z0-9-]+)\/?$/.exec(path)
  if (path === '/') return <Home />
  if (path === '/pieces' || path === '/pieces/') return <Pieces />
  if (m) return <Product key={m[1]} id={m[1]} />
  if (path === '/stylist' || path === '/stylist/') return <StylistPage key={path} />
  return <NotFound />
}

export default function App() {
  return (
    <RouterProvider>
      <BagProvider>
        <Header />
        <main id="main"><Routes /></main>
        <Footer />
        <BagDrawer />
      </BagProvider>
    </RouterProvider>
  )
}
