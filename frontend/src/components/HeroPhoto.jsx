import heroPeople from '../assets/hero-people.webp'

export default function HeroPhoto() {
  return (
    <img
      src={heroPeople}
      alt="Three smiling Filipino residents — a young man, a woman holding a document folder, and a senior woman"
      width="906"
      height="660"
      fetchPriority="high"
      draggable="false"
      className="mx-auto block w-full max-w-lg select-none lg:-ml-6 lg:w-[calc(100%+1.5rem)] lg:max-w-none xl:ml-0 xl:w-full"
    />
  )
}
