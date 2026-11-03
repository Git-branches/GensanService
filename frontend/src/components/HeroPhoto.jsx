import heroPeople from '../assets/page-services.webp'
import { useI18n } from '../i18n/context'

// The site's only image of people. It is AI-generated, so the caption must stay visible.
export default function HeroPhoto() {
  const { t } = useI18n()

  return (
    <figure className="relative mx-auto block w-full max-w-lg lg:-ml-6 lg:w-[calc(100%+1.5rem)] lg:max-w-none xl:ml-0 xl:w-full">
      <img
        src={heroPeople}
        alt={t('home.heroAlt')}
        width="759"
        height="550"
        fetchPriority="high"
        draggable="false"
        className="block h-auto w-full select-none"
      />
      <figcaption className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-xs text-stone-700">
        {t('home.heroCaption')}
      </figcaption>
    </figure>
  )
}
