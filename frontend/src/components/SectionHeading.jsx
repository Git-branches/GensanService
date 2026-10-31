import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function SectionHeading({ title, description, action, tone = 'light' }) {
  const dark = tone === 'dark'

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h2
          className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${dark ? 'text-white' : 'text-bay-950'}`}
        >
          {title}
        </h2>
        {description && <p className={`mt-2 ${dark ? 'text-bay-100' : 'text-stone-600'}`}>{description}</p>}
      </div>

      {action && (
        <Link
          to={action.to}
          className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-bay-700 hover:text-bay-800 hover:underline"
        >
          {action.label}
          <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}
