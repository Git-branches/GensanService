// Weekly office hours stored as {"1": ["08:00", "17:00"], ...}, 1 = Monday to 7 = Sunday.
// Times are Philippine time; holidays and suspensions are not included.

const WEEKDAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export function parseWeeklyHours(value) {
  if (!value) return null
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    const hours = {}
    for (const [day, times] of Object.entries(parsed ?? {})) {
      const number = Number(day)
      if (number >= 1 && number <= 7 && Array.isArray(times) && TIME.test(times[0]) && TIME.test(times[1]) && times[0] < times[1]) {
        hours[number] = [times[0], times[1]]
      }
    }
    return Object.keys(hours).length ? hours : null
  } catch {
    return null
  }
}

// "08:00" -> "8:00 AM"
export function formatTime(value) {
  const [hour, minute] = value.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
}

// Day and time in Manila, whatever time zone the phone is set to.
function manilaNow(now) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  )
  return { day: WEEKDAYS[parts.weekday], time: `${parts.hour}:${parts.minute}` }
}

/**
 * { open: true, closes } while open; otherwise { open: false, opens, daysAhead, weekday }.
 * daysAhead is 0 for later today, 1 for tomorrow, or 2-7 further out; weekday is 1 (Monday) to 7
 * (Sunday). Keeping the two apart matters: a Saturday visitor's next opening is Monday, which is two
 * days away, not "tomorrow".
 */
export function openStatus(hours, now = new Date()) {
  const { day, time } = manilaNow(now)
  const today = hours[day]
  if (today && time >= today[0] && time < today[1]) return { open: true, closes: today[1] }
  if (today && time < today[0]) return { open: false, opens: today[0], daysAhead: 0, weekday: day }
  for (let ahead = 1; ahead <= 7; ahead += 1) {
    const next = ((day - 1 + ahead) % 7) + 1
    if (hours[next]) return { open: false, opens: hours[next][0], daysAhead: ahead, weekday: next }
  }
  return null
}

// Groups days with the same hours: [{ from: 1, to: 5, open: '08:00', close: '17:00' }, ...]
export function groupHours(hours) {
  const groups = []
  for (let day = 1; day <= 7; day += 1) {
    const times = hours[day]
    const last = groups[groups.length - 1]
    if (times && last && last.to === day - 1 && last.open === times[0] && last.close === times[1]) {
      last.to = day
    } else if (times) {
      groups.push({ from: day, to: day, open: times[0], close: times[1] })
    }
  }
  return groups
}
