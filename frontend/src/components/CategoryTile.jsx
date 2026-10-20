import { Link } from 'react-router-dom'
import { renderCategoryIcon } from '../utils/icons'
import { plural } from '../utils/format'

const TINTS = [
  'bg-bay-50 text-bay-700 ring-bay-100',
  'bg-sun-50 text-sun-700 ring-sun-100',
  'bg-rose-50 text-rose-700 ring-rose-100',
  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  'bg-violet-50 text-violet-700 ring-violet-100',
  'bg-sky-50 text-sky-700 ring-sky-100',
  'bg-orange-50 text-orange-700 ring-orange-100',
]

export default function CategoryTile({ category, index = 0, compact = false }) {
  const count = Number(category.service_count ?? 0)

  return (
    <Link
      to={`/services?category=${category.slug}`}
      className={`group flex h-full rounded-xl border border-stone-200 bg-white transition-shadow hover:border-bay-300 hover:shadow-md ${
        compact ? 'flex-col gap-3 p-4' : 'items-center gap-4 p-4 sm:p-5'
      }`}
    >
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${TINTS[index % TINTS.length]}`}
      >
        {renderCategoryIcon(category.icon, { size: 21 })}
      </span>
      <span className="min-w-0">
        <span className="block font-bold leading-snug text-bay-950 group-hover:text-bay-700">{category.name}</span>
        <span className="mt-0.5 block text-xs font-medium text-stone-500">
          {count > 0 ? plural(count, 'guide') : 'Guides coming soon'}
        </span>
      </span>
    </Link>
  )
}
