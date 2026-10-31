// Writes each public page's frame and fixed text into plain HTML, so people on slow connections
// see the page before the JavaScript arrives. Guides and lists still load their data in the browser.
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

for (const { path, titleKey } of ROUTES) {
  const html = template
    .replace('<html lang="en">', `<html lang="en" data-route="${path}">`)
    .replace('<title>Andam GenSan</title>', `${fontPreload}<title>${titleKey ? `${title(titleKey)} · ` : ''}Andam GenSan</title>`)
    .replace('<div id="root"></div>', () => `<div id="root">${render(path)}</div>`)

  const folder = join(dist, path)
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, 'index.html'), html)
  console.log(`prerendered ${path} (${Math.round(html.length / 1024)} KB)`)
}

rmSync(serverBuild, { recursive: true, force: true })
