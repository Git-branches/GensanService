// Text size and contrast, remembered only in this browser. frontend/index.html applies the saved
// choice before the first paint, so keep the key and class names in step with it.
const STORAGE_KEY = 'andam-gensan-display'
export const SIZES = ['normal', 'large', 'larger']
export const DEFAULT_DISPLAY = { size: 'normal', contrast: false }

export function readDisplay() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return { size: SIZES.includes(value?.size) ? value.size : 'normal', contrast: value?.contrast === true }
  } catch {
    return DEFAULT_DISPLAY
  }
}

export function applyDisplay({ size, contrast }) {
  const classes = document.documentElement.classList
  classes.toggle('text-large', size === 'large')
  classes.toggle('text-larger', size === 'larger')
  classes.toggle('high-contrast', contrast)
}

export function saveDisplay(value) {
  applyDisplay(value)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage can be blocked; the choice still applies for this visit.
  }
}
