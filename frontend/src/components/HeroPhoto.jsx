import heroPeople from '../assets/hero-people.webp'
import { useI18n } from '../i18n/context'

export default function HeroPhoto() {
  const { t } = useI18n()

  return (
    <img
      src={heroPeople}
      alt={t('home.heroAlt')}
      width="906"
      height="660"
      fetchPriority="high"
      draggable="false"
      className="mx-auto block w-full max-w-lg select-none lg:-ml-6 lg:w-[calc(100%+1.5rem)] lg:max-w-none xl:ml-0 xl:w-full"
    />
  )
}
