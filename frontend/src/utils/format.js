// Browsers have no Cebuano or Hiligaynon month names, so those two use Filipino, which residents
// read easily. English keeps the Philippine date order.
const DATE_LOCALES = { en: 'en-PH', ceb: 'fil-PH', fil: 'fil-PH', hil: 'fil-PH' }

export function formatDate(value, options = { year: 'numeric', month: 'short', day: 'numeric' }, locale = 'en') {
  if (!value) return ''
  // Date-only strings parse as UTC midnight; append a time so they stay on the same local day.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(DATE_LOCALES[locale] ?? 'en-PH', options)
}

function placeQuery(office) {
  return [office.name, office.address, office.barangay, office.city || 'General Santos City']
    .filter(Boolean)
    .join(', ')
}

export function mapsUrl(office) {
  const query = office.latitude && office.longitude ? `${office.latitude},${office.longitude}` : placeQuery(office)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function wazeUrl(office) {
  return office.latitude && office.longitude
    ? `https://waze.com/ul?ll=${office.latitude},${office.longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(placeQuery(office))}&navigate=yes`
}
