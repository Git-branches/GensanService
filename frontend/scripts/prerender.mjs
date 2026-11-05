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

const font = readdirSync(join(dist, 'assets')).find((name) => /latin-wght-normal.*\.woff2$/.test(name))
if (!font) throw new Error('The Latin font file was not found in dist/assets.')
const fontPreload = `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />`

const template = readFileSync(join(dist, 'index.html'), 'utf8')

const page = (route, pageTitle) => template
  .replace('<html lang="en">', `<html lang="en" data-route="${route}">`)
  .replace('<title>Andam GenSan</title>', `${fontPreload}<title>${pageTitle ? `${pageTitle} · ` : ''}Andam GenSan</title>`)
  .replace('<div id="root"></div>', () => `<div id="root">${render(route)}</div>`)

for (const { path, titleKey } of ROUTES) {
  const html = page(path, titleKey && title(titleKey))
  const folder = join(dist, path)
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, 'index.html'), html)
  console.log(`prerendered ${path} (${Math.round(html.length / 1024)} KB)`)
}

// Served for every other address, such as a guide. index.html hides its page, leaving the header and
// footer, and this page has no photos, so a guide never downloads the home page's hero image.
writeFileSync(join(dist, 'shell.html'), page('/shell'))

// The offline worker stores the app and the public pages when it installs. Admin screens, other font
// alphabets, and large images are left out; pictures are saved later, as they are viewed.
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
