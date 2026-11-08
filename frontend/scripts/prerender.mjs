// Writes each public page's frame and fixed text into plain HTML, so people on slow connections
// see the page before the JavaScript arrives. Guides and lists still load their data in the browser.
import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const serverBuild = join(root, 'dist-ssr')

const { render, title } = await import(pathToFileURL(join(serverBuild, 'entry-prerender.js')).href)

const ROUTES = [
  { path: '/' },
  { path: '/services', titleKey: 'services.pageTitle' },
  { path: '/agencies', titleKey: 'agencies.pageTitle' },
  { path: '/offices', titleKey: 'offices.pageTitle' },
  { path: '/faq', titleKey: 'faq.pageTitle' },
  { path: '/privacy', titleKey: 'privacy.pageTitle' },
]

// The API is read while building so every published guide and life event gets its own page, title,
// and description. A build without the API still works: it writes the fixed pages and the shell.
const API_URL = (process.env.PRERENDER_API_URL ?? 'http://127.0.0.1:8000/api').replace(/\/+$/, '')

async function api(path) {
  const response = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error(`API ${path} returned ${response.status}`)
  const body = await response.json()
  if (!body?.success) throw new Error(`API ${path} did not return data`)
  return body.data
}

async function dynamicRoutes() {
  try {
    const [guides, events] = await Promise.all([api('/services'), api('/life-events')])
    const routes = []

    for (const guide of guides) {
      if (!/^[a-z0-9-]+$/.test(guide.slug ?? '')) continue
      const agency = guide.agency_acronym || guide.agency_name
      routes.push({
        path: `/services/${guide.slug}`,
        title: `${guide.title}${agency ? ` (${agency})` : ''}`,
        description: guide.summary || `What to bring, what it costs, and where to go for ${guide.title} in General Santos City.`,
      })
    }

    for (const event of events) {
      if (!/^[a-z0-9-]+$/.test(event.slug ?? '')) continue
      routes.push({
        path: `/life-events/${event.slug}`,
        title: event.title,
        description: event.summary || `The guides to follow, in order, for ${event.title} in General Santos City.`,
      })
    }

    console.log(`prerendering ${guides.length} guides and ${events.length} life events from the API`)
    return routes
  } catch (error) {
    console.warn(`prerendering fixed pages only: could not read ${API_URL} (${error.message})`)
    return []
  }
}

const font = readdirSync(join(dist, 'assets')).find((name) => /latin-wght-normal.*\.woff2$/.test(name))
if (!font) throw new Error('The Latin font file was not found in dist/assets.')
const fontPreload = `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />`

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const DEFAULT_DESCRIPTION = 'Independent guide to government service requirements, document checklists, and offices in General Santos City.'

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character])
const attr = (text) => escapeHtml(String(text).replace(/\s+/g, ' ').trim())

const page = (route, { title: pageTitle, description = DEFAULT_DESCRIPTION } = {}) => template
  .replace('<html lang="en">', `<html lang="en" data-route="${attr(route)}">`)
  .replace('<title>Andam GenSan</title>', () => `${fontPreload}<title>${attr(pageTitle ? `${pageTitle} · Andam GenSan` : 'Andam GenSan')}</title>`)
  .replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    () => `<meta name="description" content="${attr(description)}" />`,
  )
  .replace('<div id="root"></div>', () => `<div id="root">${render(route)}</div>`)

const routes = [
  ...ROUTES.map(({ path, titleKey }) => ({ path, title: titleKey && title(titleKey) })),
  ...(await dynamicRoutes()),
]

for (const { path, title: pageTitle, description } of routes) {
  const html = page(path, { title: pageTitle, description })
  const folder = join(dist, path)
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, 'index.html'), html)
  console.log(`prerendered ${path} (${Math.round(html.length / 1024)} KB)`)
}

// Served for every other address, such as a guide. index.html hides its page, leaving the header and
// footer, and this page has no photos, so a guide never downloads the home page's hero image.
writeFileSync(join(dist, 'shell.html'), page('/shell'))

// The offline worker stores the app and the fixed public pages when it installs. Guides and life
// events are saved as they are opened, so a new guide does not need a new build. Admin screens,
// other font alphabets, and large images are left out; pictures are saved later, as they are viewed.
const assets = readdirSync(join(dist, 'assets')).filter((name) =>
  (/\.(js|css)$/.test(name) && !/^Admin/.test(name)) || name === font,
)
const precache = [...ROUTES.map(({ path }) => path), '/shell.html', '/manifest.webmanifest', '/favicon.png', '/icons/icon-192.png', ...assets.map((name) => `/assets/${name}`)]
const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12)
const worker = readFileSync(join(dist, 'sw.js'), 'utf8')
  .replace("const VERSION = 'dev'", `const VERSION = '${version}'`)
  .replace('const PRECACHE = []', `const PRECACHE = ${JSON.stringify(precache)}`)
if (!worker.includes(version)) throw new Error('dist/sw.js did not take the build version.')
writeFileSync(join(dist, 'sw.js'), worker)
console.log(`offline worker ${version}: ${precache.length} files`)

rmSync(serverBuild, { recursive: true, force: true })
