import { useEffect, useState } from 'react'

const FORMATTER = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export default function PhilippineTime() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <time dateTime={now.toISOString()}>
      <span className="font-semibold">PST</span> · {FORMATTER.format(now)}
    </time>
  )
}
