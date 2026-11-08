import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { adminApi } from '../api'
import { useAdminQuery } from '../useAdminList'
import { PageTitle, SURFACE, inputClass } from '../components/ui'

const PERIODS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
]
const PAGE_LABELS = {
  home: 'Home',
  services: 'Service guides list',
  guide: 'A guide',
  life_event: 'A life event',
  agencies: 'Agencies list',
  agency: 'An agency',
  offices: 'Offices',
  faq: 'FAQ',
  privacy: 'Privacy',
  not_found: 'Page not found',
}
const LOCALE_LABELS = { en: 'English', ceb: 'Bisaya', fil: 'Filipino', hil: 'Hiligaynon', blaan: 'Blaan', mdh: 'Maguindanaon', mrw: 'Maranao' }
const DEVICE_LABELS = { phone: 'Phone', tablet: 'Tablet', desktop: 'Computer' }

const REASON_LABELS = { outdated: 'Outdated', missing: 'Something missing', unclear: 'Hard to understand', other: 'Something else' }

const number = (value) => value.toLocaleString('en-PH')
const day = (iso, options) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', options)

// One series, one hue: bars from a shared baseline, a gap between bars, and a tooltip on each.
function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((point) => point.views))
  const ticks = [max, Math.round(max / 2), 0]
  const every = Math.ceil(daily.length / 6)

  return (
    <figure className="mt-4">
      <div className="flex gap-3">
        <div aria-hidden="true" className="flex h-48 w-8 shrink-0 flex-col justify-between text-right text-xs text-stone-500 tabular-nums">
          {ticks.map((tick, index) => <span key={index}>{number(tick)}</span>)}
        </div>
        <div className="relative min-w-0 flex-1">
          <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
            {ticks.map((tick, index) => <div key={index} className={`border-t ${index === ticks.length - 1 ? 'border-stone-300' : 'border-stone-100'}`} />)}
          </div>
          <ol className="relative flex h-48 items-end gap-0.5">
            {daily.map((point, index) => (
              <li key={point.date} className="group relative flex h-full flex-1 items-end">
                <span
                  className="block w-full rounded-t-sm bg-bay-600 transition-colors group-hover:bg-bay-800"
                  style={{ height: `${(point.views / max) * 100}%`, minHeight: point.views ? 2 : 0 }}
                />
                <span className="sr-only">{day(point.date, { month: 'short', day: 'numeric' })}: {number(point.views)} views</span>
                <span
                  aria-hidden="true"
                  // Tooltips near the edges open inward, so they stay inside the card.
                  className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-md bg-bay-950 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block ${
                    index > daily.length * 0.75 ? 'right-0' : index < daily.length * 0.25 ? 'left-0' : 'left-1/2 -translate-x-1/2'
                  }`}
                >
                  <span className="font-semibold">{number(point.views)}</span> · {day(point.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div aria-hidden="true" className="mt-2 flex pl-11 text-xs text-stone-500">
        {daily.map((point, index) => (
          <span key={point.date} className="flex-1 text-center">{index % every === 0 ? day(point.date, { month: 'short', day: 'numeric' }) : ''}</span>
        ))}
      </div>
    </figure>
  )
}

// A ranked list with a bar per row; the number is always shown, so the bar is never the only cue.
function Breakdown({ title, rows, labels, total }) {
  const max = Math.max(1, ...rows.map((row) => row.views))
  return (
    <section className={`p-5 ${SURFACE}`}>
      <h2 className="text-base font-bold text-bay-950">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-600">No visits counted yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((row) => (
            <li key={row.name} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-stone-800">{labels[row.name] ?? row.name}</span>
                <span className="tabular-nums text-stone-600">
                  {number(row.views)} <span className="text-stone-500">({Math.round((row.views / Math.max(1, total)) * 100)}%)</span>
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-stone-100">
                <div className="h-2 rounded-full bg-bay-600" style={{ width: `${(row.views / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function AdminAnalyticsPage() {
  usePageTitle('Analytics · Admin')
  const [days, setDays] = useState(30)
  const { data, error, loading } = useAdminQuery(() => adminApi.analytics(days), [days])

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Analytics"
        description="Anonymous visit counts: the kind of page, language, and screen size only. No cookies, IP addresses, or visitor IDs. Browsers that ask not to be tracked are not counted."
      />

      <div className={`mt-6 flex flex-wrap items-center gap-3 p-3 ${SURFACE}`}>
        <label htmlFor="analytics-period" className="sr-only">Period</label>
        <select id="analytics-period" value={days} onChange={(event) => setDays(Number(event.target.value))} className={`${inputClass} w-auto min-w-44`}>
          {PERIODS.map((period) => <option key={period.days} value={period.days}>{period.label}</option>)}
        </select>
        {data && (
          <p className="text-sm text-stone-600">
            {day(data.from, { month: 'short', day: 'numeric' })} to {day(data.to, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-red-700">{error.message}</p>}
      {loading && !data && <p className="mt-6 text-sm text-stone-600">Loading...</p>}

      {data && (
        <>
          <section className={`mt-6 p-5 ${SURFACE}`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-bay-950">Page visits per day</h2>
                <p className="mt-1 text-sm text-stone-600">
                  {data.counting_since ? `Counting since ${day(data.counting_since, { month: 'long', day: 'numeric', year: 'numeric' })}.` : 'No visits counted yet.'}
                </p>
              </div>
              <p className="text-right">
                <span className="block text-3xl font-extrabold tabular-nums text-bay-950">{number(data.total)}</span>
                <span className="text-sm text-stone-600">visits in this period</span>
              </p>
            </div>
            <DailyChart daily={data.daily} />
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Breakdown title="Pages" rows={data.pages} labels={PAGE_LABELS} total={data.total} />
            <Breakdown title="Languages" rows={data.locales} labels={LOCALE_LABELS} total={data.total} />
            <Breakdown title="Screen size" rows={data.devices} labels={DEVICE_LABELS} total={data.total} />
          </div>

          <section className={`mt-6 p-5 ${SURFACE}`}>
            <h2 className="text-base font-bold text-bay-950">Most opened guides</h2>
            {data.top_guides.length === 0 ? (
              <p className="mt-3 text-sm text-stone-600">No guide has been opened in this period.</p>
            ) : (
              <ol className="mt-3 divide-y divide-stone-100">
                {data.top_guides.map((guide, index) => (
                  <li key={guide.slug} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="mr-2 tabular-nums text-stone-500">{index + 1}.</span>
                      <Link to={`/services/${guide.slug}`} className="font-semibold text-bay-700 hover:underline">{guide.title}</Link>
                    </span>
                    <span className="shrink-0 tabular-nums text-stone-600">{number(guide.views)} {guide.views === 1 ? 'view' : 'views'}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={`mt-6 p-5 ${SURFACE}`}>
            <h2 className="text-base font-bold text-bay-950">Did this guide help?</h2>
            <p className="mt-1 text-sm text-stone-600">Answers from residents, with the guides that got the most No answers first. Each browser answers a guide once.</p>
            {data.feedback.length === 0 ? (
              <p className="mt-3 text-sm text-stone-600">No answers in this period.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-xl text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                      <th scope="col" className="py-2 pr-4 font-semibold">Guide</th>
                      <th scope="col" className="py-2 pr-4 text-right font-semibold">Yes</th>
                      <th scope="col" className="py-2 pr-4 text-right font-semibold">No</th>
                      <th scope="col" className="py-2 font-semibold">Reasons for No</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {data.feedback.map((guide) => {
                      const reasons = Object.entries(guide.reasons).sort((a, b) => b[1] - a[1])
                      return (
                        <tr key={guide.slug}>
                          <td className="py-2.5 pr-4">
                            <Link to={`/services/${guide.slug}`} className="font-semibold text-bay-700 hover:underline">{guide.title}</Link>
                          </td>
                          <td className="py-2.5 pr-4 text-right tabular-nums text-stone-700">{number(guide.yes)}</td>
                          <td className="py-2.5 pr-4 text-right tabular-nums font-semibold text-stone-900">{number(guide.no)}</td>
                          <td className="py-2.5 text-stone-600">
                            {reasons.length ? reasons.map(([reason, count]) => `${REASON_LABELS[reason] ?? reason} (${count})`).join(', ') : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
