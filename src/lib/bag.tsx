// Demo bag. Kept in memory only: there is no checkout, payment or stock system behind this site.
import { createContext, useContext, useState, type ReactNode } from 'react'

export interface BagLine { id: string; colour: string; size: string }
interface BagState {
  lines: BagLine[]
  add: (l: BagLine) => void
  remove: (i: number) => void
  open: boolean
  setOpen: (o: boolean) => void
}
const Ctx = createContext<BagState | null>(null)

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([])
  const [open, setOpen] = useState(false)
  return (
    <Ctx.Provider value={{
      lines,
      add: (l) => { setLines((x) => [...x, l]); setOpen(true) },
      remove: (i) => setLines((x) => x.filter((_, j) => j !== i)),
      open, setOpen,
    }}>{children}</Ctx.Provider>
  )
}

export function useBag(): BagState {
  const b = useContext(Ctx)
  if (!b) throw new Error('useBag outside BagProvider')
  return b
}
