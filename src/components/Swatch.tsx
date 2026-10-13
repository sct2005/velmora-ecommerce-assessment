// Stand-in for photography (there is none yet): a panel in the piece's listed colour,
// with a surface treatment that suggests the listed fabric.
import { COLOUR_HEX } from '../data/catalogue'

const fabricClass = (f: string) => 'fab-' + f.replace(/\s+/g, '-')

export function Swatch({ colour, fabric, label, size = 'card', className = '' }: {
  colour: string
  fabric: string
  label?: string
  size?: 'card' | 'hero' | 'gallery' | 'thumb'
  className?: string
}) {
  const c = COLOUR_HEX[colour] ?? { bg: '#CFC6BA', ink: 'dark' as const }
  return (
    <div
      className={`swatch swatch-${size} ${fabricClass(fabric)} ink-${c.ink} ${className}`}
      style={{ ['--sw' as string]: c.bg }}
      role="img"
      aria-label={`Colour panel: ${colour} ${fabric}. Product photography is not available yet.`}
    >
      {label && <span className="swatch-label" aria-hidden="true">{label}</span>}
    </div>
  )
}
