const SIZES = {
  sm: 'h-9 w-9 rounded-md',
  md: 'h-14 w-14 rounded-lg',
}

// Short text for the placeholder badge: the acronym when it is short ("SSS"), else its first
// part ("LGU-GenSan" → "LGU"), else its capital letters ("PhilHealth" → "PH").
function monogram(agency) {
  const acronym = agency.acronym?.trim()
  if (acronym && acronym.length <= 4) return acronym
  const firstPart = acronym?.split(/[-\s]/)[0]
  if (firstPart && firstPart.length <= 4) return firstPart
  const capitals = (acronym || agency.name).replace(/[^A-Z]/g, '')
  return capitals.slice(0, 3) || agency.name.slice(0, 2)
}

// The agency's uploaded logo, or a lettered badge until one is added. Decorative: the agency
// name is always shown next to it.
export default function AgencyLogo({ agency, size = 'md' }) {
  if (agency.logo_url) {
    return (
      <span className={`flex shrink-0 items-center justify-center bg-white p-1.5 ring-1 ring-stone-200 ${SIZES[size]}`}>
        <img src={agency.logo_url} alt="" className="max-h-full max-w-full object-contain" />
      </span>
    )
  }

  const text = monogram(agency)
  const local = Boolean(agency.is_local_government)
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center font-extrabold uppercase tracking-tight ring-1 ${SIZES[size]} ${
        local ? 'bg-sun-50 text-sun-800 ring-sun-200' : 'bg-bay-50 text-bay-800 ring-bay-100'
      } ${size === 'sm' ? 'text-[11px]' : text.length > 3 ? 'text-sm' : 'text-base'}`}
    >
      {text}
    </span>
  )
}
