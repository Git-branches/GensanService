import { StrictMode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans/wght.css'
import './index.css'
import App from './App.jsx'
import I18nProvider from './i18n/I18nProvider'

const container = document.getElementById('root')
const html = document.documentElement
const app = (
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
)

// A pre-built page that matches this visitor comes alive in place. Any other page is drawn fresh,
// and the classes set in index.html come off only once it is ready, so nothing wrong ever shows.
const matches = !html.classList.contains('other-language') && !html.classList.contains('other-page')

if (container.hasChildNodes() && matches) {
  hydrateRoot(container, app)
} else {
  const root = createRoot(container)
  flushSync(() => root.render(app))
  html.classList.remove('other-language', 'other-page')
}
