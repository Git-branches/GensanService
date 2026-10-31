import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import I18nProvider from './i18n/I18nProvider'
import { DEFAULT_LOCALE } from './i18n/languages'
import { translate } from './i18n/translate'

// Used by scripts/prerender.mjs after the build. The tree must match main.jsx.
export function render(url) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <I18nProvider serverLocale={DEFAULT_LOCALE}>
          <App />
        </I18nProvider>
      </StaticRouter>
    </StrictMode>,
  )
}

export const title = (key) => translate(DEFAULT_LOCALE, key)
