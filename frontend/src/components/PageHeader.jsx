import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import BayPattern from './BayPattern'
import { useI18n } from '../i18n/context'

export function Breadcrumbs({ items }) {
  const { t } = useI18n()

  return (
    <nav aria-label={t('common.breadcrumb')} className="text-sm text-stone-600">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight size={14} aria-hidden="true" className="text-stone-500" />}
            {item.to ? (
              <Link to={item.to} className="inline-flex min-h-6 items-center hover:text-bay-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-stone-900">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

const SECTION_CLASS =
  'relative overflow-hidden border-b border-bay-100 bg-gradient-to-br from-bay-50 via-white to-sun-50/60'

export default function PageHeader({ meta, title, description, breadcrumbs, image, children }) {
  const intro = (
    <>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <h1 className={`${breadcrumbs ? 'mt-5' : ''} max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-bay-950 sm:text-4xl`}>
        {title}
      </h1>
      {meta && <p className="mt-2 font-semibold text-bay-700">{meta}</p>}
      {description && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-stone-600">{description}</p>}
    </>
  )

  if (!image) {
    return (
      <section className={SECTION_CLASS}>
        <BayPattern className="text-bay-200/60" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          {intro}
          {children}
        </div>
      </section>
    )
  }

  // Same composition as the home hero: text left, people right, standing on the header's bottom edge.
  // Any search/filter form (children) moves just below the header so the photo stays flush.
  return (
    <>
      <section className={SECTION_CLASS}>
        <BayPattern className="text-bay-200/60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6 lg:pb-14">{intro}</div>
          <div className="self-end lg:col-span-6">
            {/* Transparent cutout: the people sit in front of the header pattern. */}
            <img
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              draggable="false"
              style={{ aspectRatio: `${image.width} / ${image.height}` }}
              className="relative mx-auto block h-64 w-auto max-w-full select-none object-contain object-bottom sm:h-80 lg:ml-auto lg:mr-0 lg:h-92"
            />
          </div>
        </div>
      </section>
      {children && <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>}
    </>
  )
}
