// A small path router: four routes don't justify a routing dependency.
import { createContext, useContext, useEffect, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

function currentPath(): string {
  const p = window.location.pathname
  const rel = p.startsWith(BASE) ? p.slice(BASE.length) : p
  return rel || '/'
}

interface RouterState { path: string; search: URLSearchParams; navigate: (to: string) => void }
const Ctx = createContext<RouterState | null>(null)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState(() => ({ path: currentPath(), search: window.location.search }))
  useEffect(() => {
    const on = () => setLoc({ path: currentPath(), search: window.location.search })
    window.addEventListener('popstate', on)
    return () => window.removeEventListener('popstate', on)
  }, [])
  const navigate = (to: string) => {
    const [path, hash] = to.split('#')
    window.history.pushState({}, '', BASE + to)
    setLoc({ path: path.split('?')[0] || '/', search: path.includes('?') ? '?' + path.split('?')[1] : '' })
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView())
    else window.scrollTo(0, 0)
  }
  return <Ctx.Provider value={{ path: loc.path, search: new URLSearchParams(loc.search), navigate }}>{children}</Ctx.Provider>
}

export function useRouter(): RouterState {
  const r = useContext(Ctx)
  if (!r) throw new Error('useRouter outside RouterProvider')
  return r
}

export function Link({ to, children, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useRouter()
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    rest.onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(to)
  }
  return <a href={BASE + to} {...rest} onClick={onClick}>{children}</a>
}
