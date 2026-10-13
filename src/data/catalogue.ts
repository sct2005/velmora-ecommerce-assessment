// Single source of truth: products.json at the repository root (the supplied file, unmodified).
// Nothing here adds facts; helpers only format or look up what the file says.
import raw from '../../products.json'

export type Category = 'dress' | 'jumpsuit' | 'top' | 'skirt' | 'outerwear' | 'accessory'

export interface Product {
  id: string
  name: string
  category: Category
  price_gbp: number
  colours: string[]
  fabric: string
  fit: string | null
  sizes: string[]
  occasions: string[]
  made_to_order: boolean
  lead_time_days: number
  description: string
  in_stock: boolean
}

export const products: Product[] = raw as Product[]

export const FEATURED_ID = 'VLM-008'

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id.toUpperCase())
}

/** A piece can be ordered if it is made to order, or ships from stock and is in stock. */
export function isOrderable(p: Product): boolean {
  return p.made_to_order || p.in_stock
}

export const OCCASIONS = [
  'winter wedding',
  'black tie',
  'gala',
  "new year's eve",
  'christmas party',
  'cocktail',
  'dinner',
  'engagement party',
] as const
export type Occasion = (typeof OCCASIONS)[number]

export const COLOURS = [
  'black', 'champagne', 'dusty rose', 'emerald', 'ivory', 'midnight', 'oxblood', 'pewter', 'sapphire',
] as const

export const FABRICS = [
  'chiffon', 'crepe', 'duchess satin', 'jersey', 'sequinned tulle', 'silk satin', 'velvet', 'wool crepe',
] as const

export const CATEGORY_LABEL: Record<Category, string> = {
  dress: 'Dresses',
  jumpsuit: 'Jumpsuits',
  top: 'Tops',
  skirt: 'Skirts',
  outerwear: 'Outerwear',
  accessory: 'Accessories',
}

/** Display colours for the colour panels that stand in for photography. */
export const COLOUR_HEX: Record<string, { bg: string; ink: 'light' | 'dark' }> = {
  black: { bg: '#191716', ink: 'light' },
  champagne: { bg: '#D8C29F', ink: 'dark' },
  'dusty rose': { bg: '#C49A98', ink: 'dark' },
  emerald: { bg: '#1E5644', ink: 'light' },
  ivory: { bg: '#EEE6D8', ink: 'dark' },
  midnight: { bg: '#1D2740', ink: 'light' },
  oxblood: { bg: '#6B1F2A', ink: 'light' },
  pewter: { bg: '#87857F', ink: 'light' },
  sapphire: { bg: '#24407F', ink: 'light' },
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function occasionLabel(o: string): string {
  if (o === "new year's eve") return "New Year's Eve"
  return cap(o)
}

/** e.g. "Draped crepe in ivory or oxblood". Names repeat in the catalogue, so this tells pieces apart. */
export function subtitle(p: Product): string {
  const cut = p.fit ? `${cap(p.fit)} ${p.fabric}` : cap(p.fabric)
  return `${cut} in ${joinOr(p.colours)}`
}

export function joinOr(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`
}

export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export const gbp = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

export function productsFor(occasion: string): Product[] {
  return products.filter((p) => p.occasions.includes(occasion))
}
