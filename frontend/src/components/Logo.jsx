import logoMark from '../assets/andam-logo-mark.png'

// Transparent cutout of the Andam GenSan pin (source: assets/gensan-logo.jpg), 154 × 192.
export function LogoMark({ className = 'h-10 w-10' }) {
  return <img src={logoMark} alt="" width="154" height="192" draggable="false" className={`shrink-0 object-contain ${className}`} />
}

// tone="dark" is for the navy header: white "Andam", light blue "GenSan", soft tagline.
export default function Logo({ subtitle, size = 'md', tone = 'light' }) {
  const dark = tone === 'dark'
  const markSize = size === 'lg' ? 'h-12 w-10' : 'h-11 w-9'
  const wordSize = size === 'lg' ? 'text-xl' : 'text-base sm:text-lg'

  return (
    <span className="flex items-center gap-3">
      <LogoMark className={markSize} />
      <span className="leading-tight">
        <span className={`block font-extrabold tracking-tight ${wordSize}`}>
          <span className={dark ? 'text-white' : 'text-bay-950'}>Andam</span>{' '}
          <span className={dark ? 'text-navy-accent' : 'text-bay-600'}>GenSan</span>
        </span>
        {subtitle && (
          <span className={`hidden text-xs font-medium sm:block ${dark ? 'text-navy-muted' : 'text-stone-500'}`}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  )
}
