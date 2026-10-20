function TunaArt({ className }) {
  return (
    <svg viewBox="0 -4 120 88" fill="none" aria-hidden="true" className={className}>
      <path d="M6 70c14-9 26-9 38-3s24 6 36-1 24-8 34-3" stroke="#78C3D8" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 79c12-6 22-6 32-1s22 5 32 0 20-6 30-2" stroke="#2385A4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="12" cy="60" r="2.2" fill="#78C3D8" />
      <circle cx="20" cy="54" r="1.6" fill="#78C3D8" />
      <circle cx="108" cy="58" r="1.8" fill="#78C3D8" />
      <g transform="translate(2 -8) rotate(-22 60 44)">
        <path d="M23 41 11 28.5q5 12.5 0 25Z" fill="#15576F" />
        <path d="M58 29.2 50.5 18.5 46.5 30Z" fill="#15576F" />
        <path d="M39.5 32.2 35 27l-3 6.2Z" fill="#F7BD16" />
        <path d="M39.5 49.8 35 55l-3-6.2Z" fill="#F7BD16" />
        <path d="M28.5 35l-2-2.4-1 3ZM27.5 47l-2 2.4-1-3Z" fill="#F7BD16" />
        <path d="M102 41c-8-10-28-14-48-12-12 1-24 6-32 12 8 6 20 11 32 12 20 2 40-2 48-12Z" fill="#15576F" />
        <path d="M102 41c-8 6-28 11-48 10-12-.6-24-4.6-32-10 8 6 20 11 32 12 20 2 40-2 48-12Z" fill="#D4EEF5" />
        <path d="M90 37.6C72 35.8 46 36.6 24 40.4" stroke="#F7BD16" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M84 33q-4 8 0 15" stroke="#3FA2BF" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M80 42q-14 2-25 10 14-4 26-7Z" fill="#2385A4" />
        <circle cx="92.5" cy="37.5" r="2.8" fill="#fff" />
        <circle cx="93" cy="37.5" r="1.5" fill="#0A2633" />
      </g>
    </svg>
  )
}

export default function TunaBadge() {
  return (
    <div className="inline-flex items-center gap-4 rounded-2xl border border-stone-200 bg-white py-3 pl-3 pr-5">
      <TunaArt className="h-auto w-24 shrink-0" />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sun-700">Made for GenSan</p>
        <p className="mt-0.5 text-sm font-extrabold text-bay-950">The Tuna Capital of the Philippines</p>
        <p className="mt-1 text-xs text-stone-600">Prepare · Know · Go</p>
      </div>
    </div>
  )
}
