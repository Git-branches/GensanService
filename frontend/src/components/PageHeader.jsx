import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import BayPattern from './BayPattern'
import { useI18n } from '../i18n/context'

export function Breadcrumbs({ items }) {
  const { t } = useI18n()
  // Phones show one back link, so a long trail never wraps onto a second line.
  const backIndex = items.findLastIndex((item) => item.to)

  return (
    <nav aria-label={t('common.breadcrumb')} className="text-sm text-stone-600">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.label} className={`items-center gap-1.5 ${index === backIndex ? 'flex' : 'hidden sm:flex'}`}>
            {index === backIndex && <ChevronLeft size={14} aria-hidden="true" className="text-stone-500 sm:hidden" />}
            {index > 0 && <ChevronRight size={14} aria-hidden="true" className="hidden text-stone-500 sm:block" />}
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

// contentLang marks a title and description that stay in one language whatever the page language is.
// compact tightens the header on phones, for pages whose main content should start on the first screen.
export default function PageHeader({ meta, title, description, breadcrumbs, image, contentLang, compact = false, children }) {
  const intro = (
    <>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <h1 lang={contentLang} className={`${breadcrumbs ? (compact ? 'mt-3 sm:mt-5' : 'mt-5') : ''} max-w-3xl font-extrabold leading-tight tracking-tight text-bay-950 sm:text-4xl ${compact ? 'text-2xl' : 'text-3xl'}`}>
        {title}
      </h1>
      {meta && <p className="mt-2 font-semibold text-bay-700">{meta}</p>}
      {description && <p lang={contentLang} className={`max-w-2xl leading-relaxed text-stone-600 sm:mt-3 sm:text-lg ${compact ? 'mt-2 text-base' : 'mt-3 text-lg'}`}>{description}</p>}
    </>
  )

  if (!image) {
    return (
      <section className={SECTION_CLASS}>
        <BayPattern className="text-bay-200/60" />
        <div className={`relative mx-auto max-w-6xl px-4 sm:px-6 sm:py-14 ${compact ? 'py-4' : 'py-10'}`}>
          {intro}
          {children}
        </div>
      </section>
    )
  }

  // A scene fills the right of the header and fades out behind the text. On phones it sits below the text.
  // Drawn scenes stop short of the header top and are width-capped so wide screens never crop them.
  // fullHeight is for edge-to-edge art, such as a map, that would look cut off with a gap above it.
  if (image.scene) {
    return (
      <>
        <section className={SECTION_CLASS}>
          <BayPattern className="text-bay-200/60" />
          <div className="relative z-10 mx-auto flex max-w-6xl items-center px-4 pt-10 pb-6 sm:px-6 sm:pt-12 lg:min-h-88 lg:py-10">
            <div className="lg:w-1/2">{intro}</div>
          </div>
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            draggable="false"
            className={`relative block h-52 w-full select-none object-cover ${image.fullHeight ? 'lg:h-full' : 'lg:h-[86%] lg:max-w-[1000px]'} object-right-bottom sm:h-64 lg:absolute lg:bottom-0 lg:right-0 lg:w-[70%] lg:mask-[linear-gradient(to_right,transparent,black_28%)]`}
          />
        </section>
        {children && <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>}
      </>
    )
  }

  // Same composition as the home hero: text left, illustration right, standing on the header's bottom edge.
  // Any search/filter form (children) moves just below the header so the illustration stays flush.
  return (
    <>
      <section className={SECTION_CLASS}>
        <BayPattern className="text-bay-200/60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pt-10 sm:px-6 sm:pt-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6 lg:pb-14">{intro}</div>
          <div className="self-end lg:col-span-6">
            {/* Transparent background: the illustration sits in front of the header pattern. */}
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
