import { ChevronDown } from 'lucide-react'

export default function FaqItem({ faq }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 font-bold text-bay-950 hover:text-bay-700 [&::-webkit-details-marker]:hidden">
        {faq.question}
        <ChevronDown size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-stone-500 transition-transform group-open:rotate-180" />
      </summary>
      <p className="max-w-3xl pb-5 leading-relaxed text-stone-700">{faq.answer}</p>
    </details>
  )
}
