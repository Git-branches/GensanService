export function LogoMark({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="48" height="48" rx="11" fill="#15576F" />
      <path d="M11 38 20.5 10h7L37 38h-5.8L24 15.8 16.8 38Z" fill="#fff" />
      {/* Teal underlay cuts a gap where the check crosses the A. */}
      <path d="M20.4 28 23.2 31.6 36 17.4" fill="none" stroke="#15576F" strokeWidth="7.6" />
      <path d="M20.4 28 23.2 31.6 36 17.4" fill="none" stroke="#F7BD16" strokeWidth="4.2" />
    </svg>
  )
}

export default function Logo({ subtitle, size = 'md' }) {
  const markSize = size === 'lg' ? 'h-11 w-11' : 'h-10 w-10'
  const wordSize = size === 'lg' ? 'text-xl' : 'text-base sm:text-lg'

  return (
    <span className="flex items-center gap-3">
      <LogoMark className={markSize} />
      <span className="leading-tight">
        <span className={`block font-extrabold tracking-tight ${wordSize}`}>
          <span className="text-bay-950">Andam</span> <span className="text-bay-600">GenSan</span>
        </span>
        {subtitle && <span className="hidden text-xs font-medium text-stone-500 sm:block">{subtitle}</span>}
      </span>
    </span>
  )
}
