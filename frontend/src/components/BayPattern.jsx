// Decorative contour lines evoking the depth chart of Sarangani Bay.
export default function BayPattern({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      className={`pointer-events-none absolute inset-0 h-full w-full mask-[linear-gradient(to_left,black_15%,transparent_70%)] ${className}`}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const r = 60 + i * 42
        return (
          <path
            key={i}
            strokeWidth="1.2"
            d={`M ${820 - r * 1.5} 400 C ${820 - r * 1.4} ${330 - r * 0.6}, ${820 - r * 0.5} ${180 - r * 0.9}, 820 ${190 - r * 0.85}`}
          />
        )
      })}
    </svg>
  )
}
