import { useEffect, useId, useRef, useState } from 'react'
import { ALargeSmall, Check } from 'lucide-react'
import { useI18n } from '../i18n/context'
import { DEFAULT_DISPLAY, SIZES, readDisplay, saveDisplay } from '../utils/display'

const SIZE_LABELS = { normal: 'display.sizeNormal', large: 'display.sizeLarge', larger: 'display.sizeLarger' }
// The sample letter in each size button, drawn at that size.
const SIZE_SAMPLES = { normal: 'text-sm', large: 'text-base', larger: 'text-lg' }

// Larger text and high contrast, for people who find the page hard to read. Opens from the top bar.
export default function DisplaySettings() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  // The panel starts closed, so a pre-built page and the browser draw the same thing either way.
  const [display, setDisplay] = useState(() => (typeof window === 'undefined' ? DEFAULT_DISPLAY : readDisplay()))
  const button = useRef(null)
  const panel = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    function onPointerDown(event) {
      if (!panel.current?.contains(event.target) && !button.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  function update(change) {
    const next = { ...display, ...change }
    setDisplay(next)
    saveDisplay(next)
  }

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 font-semibold text-stone-700 hover:text-bay-700 focus-visible:outline-2 focus-visible:outline-bay-600 sm:min-h-8"
      >
        <ALargeSmall size={18} aria-hidden="true" className="shrink-0 text-bay-600" />
        <span className="sr-only">{t('display.button')}</span>
      </button>

      {open && (
        <div
          ref={panel}
          id={panelId}
          role="group"
          aria-label={t('display.button')}
          // Phones get the full width, so the panel never runs off the screen at the larger text sizes.
          className="fixed inset-x-4 top-16 z-50 animate-fade-in rounded-xl bg-white p-4 text-base text-stone-800 shadow-lg ring-1 ring-stone-200 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-72"
        >
          <fieldset>
            <legend className="text-sm font-bold text-bay-950">{t('display.textSize')}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SIZES.map((size) => (
                <label
                  key={size}
                  className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-center ring-1 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-bay-600 ${
                    display.size === size ? 'bg-bay-50 text-bay-900 ring-2 ring-bay-600' : 'ring-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input type="radio" name={`${panelId}-size`} value={size} checked={display.size === size} onChange={() => update({ size })} className="sr-only" />
                  <span aria-hidden="true" className={`font-extrabold leading-none ${SIZE_SAMPLES[size]}`}>A</span>
                  <span className="text-xs font-semibold">{t(SIZE_LABELS[size])}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 flex cursor-pointer items-start justify-between gap-3">
            <span>
              <span className="block text-sm font-bold text-bay-950">{t('display.contrast')}</span>
              <span className="block text-xs text-stone-600">{t('display.contrastHint')}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={display.contrast}
              onChange={(event) => update({ contrast: event.target.checked })}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-stone-300 transition-colors peer-checked:bg-bay-700 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bay-600"
            >
              <span className={`absolute left-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${display.contrast ? 'translate-x-5' : ''}`}>
                {display.contrast && <Check size={12} className="text-bay-700" />}
              </span>
            </span>
          </label>

          {(display.size !== 'normal' || display.contrast) && (
            <button
              type="button"
              onClick={() => update(DEFAULT_DISPLAY)}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-bay-700 hover:underline"
            >
              {t('display.reset')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
