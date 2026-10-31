import { useSyncExternalStore } from 'react'

const FORMATTER = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const TICK = 30_000

function subscribe(onTick) {
  const id = setInterval(onTick, TICK)
  return () => clearInterval(id)
}

const currentTick = () => Math.floor(Date.now() / TICK)
const noTick = () => null

// Pre-built pages have no clock, so the time appears once the page is live.
export default function PhilippineTime() {
  const tick = useSyncExternalStore(subscribe, currentTick, noTick)
  if (tick === null) return null
  const now = new Date(tick * TICK)

  return (
    <time dateTime={now.toISOString()}>
      <span className="font-semibold">PST</span> · {FORMATTER.format(now)}
    </time>
  )
}
