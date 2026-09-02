/**
 * Re-runs the accessibility/performance audit reported in the memoria (7.7).
 *
 * Lighthouse's accessibility category runs axe-core internally. Point it at a
 * production build — dev-mode numbers are not comparable, since the dev server
 * ships unminified bundles and no caching.
 *
 *   npm run build && npx next start -p 3100
 *   npm run audit:a11y                       # defaults to http://localhost:3100
 *   npm run audit:a11y -- https://upv-cal.vercel.app
 */
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import { writeFileSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:3100'

const ROUTES = [
  ['Portada', '/'],
  ['Lista de exámenes', '/lista-examenes'],
  ['Resultados de búsqueda', '/exams?school=ETSINF'],
  ['Aterrizaje de escuela (ETSINF)', '/ETSINF/calendarios'],
]

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })
const rows = []

try {
  for (const [name, path] of ROUTES) {
    process.stderr.write(`auditing ${name}…\n`)
    const { lhr } = await lighthouse(`${BASE}${path}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'desktop',
      screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
      // Vercel Analytics only resolves on Vercel; locally it 404s and would
      // pollute errors-in-console. Blocking it keeps local ≈ deployed.
      blockedUrlPatterns: ['*_vercel/insights*', '*vitals.vercel-insights*'],
    })

    const scores = Object.fromEntries(
      Object.entries(lhr.categories).map(([k, v]) => [k, Math.round((v.score ?? 0) * 100)])
    )
    const failures = Object.values(lhr.audits)
      .filter((a) => a.score === 0 && a.scoreDisplayMode === 'binary')
      .map((a) => a.id)

    rows.push({ name, url: `${BASE}${path}`, scores, failures })
  }
} finally {
  await chrome.kill()
}

writeFileSync('docs/auditoria/lighthouse-ultima-ejecucion.json', JSON.stringify(rows, null, 2))

console.log('\n| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO |')
console.log('|---|---|---|---|---|')
for (const r of rows) {
  const s = r.scores
  console.log(`| ${r.name} | ${s.performance} | ${s.accessibility} | ${s['best-practices']} | ${s.seo} |`)
}

const worstA11y = Math.min(...rows.map((r) => r.scores.accessibility))
console.log(`\nLowest accessibility score: ${worstA11y}`)
for (const r of rows) {
  console.log(`  ${r.name}: ${r.failures.length ? r.failures.join(', ') : '(sin fallos)'}`)
}
