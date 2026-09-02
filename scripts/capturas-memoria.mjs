/**
 * Recaptura las pantallas que ilustran la memoria, desde el despliegue real.
 *
 *   npm run capturas
 *
 * Las capturas anteriores se hicieron sobre versiones previas de la interfaz y
 * algunas ya no se corresponden con lo desplegado (la página de resultados, por
 * ejemplo, estaba en inglés y sin paginar). Se rehacen todas de una vez para que
 * el capítulo del producto muestre una interfaz coherente.
 *
 * Dos precauciones que el resultado agradece: las animaciones se congelan antes
 * de disparar, porque framer-motion mantiene la página en movimiento y cada
 * captura saldría en un punto distinto; y se fuerza el tema, ya que la
 * aplicación arranca en oscuro y la memoria ilustra el recorrido en claro.
 */
import puppeteer from 'puppeteer-core'
import { Launcher } from 'chrome-launcher'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.BASE || 'https://www.upvcal.com'
const OUT = 'docs/capturas'
mkdirSync(OUT, { recursive: true })

const FREEZE = `
  *,*::before,*::after{animation:none!important;transition:none!important;
    animation-duration:0s!important;transition-duration:0s!important}
  html{scroll-behavior:auto!important}
`

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: Launcher.getFirstInstallation(),
  headless: 'new',
  args: ['--no-sandbox'],
})

async function open(path, [w, h], theme = 'light') {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: w < 500 })
  await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 45000 })
  await page.addStyleTag({ content: FREEZE })
  await page.evaluate((t) => {
    document.documentElement.classList.toggle('dark', t === 'dark')
    document.documentElement.style.colorScheme = t
    try { localStorage.setItem('upv-theme', t) } catch {}
  }, theme)
  await wait(1200)
  return page
}

/** Handle for the element whose visible text starts with `label`. */
async function sectionWith(page, label) {
  return page.evaluateHandle((lbl) => {
    const secs = [...document.querySelectorAll('section')]
    return secs.find((s) => (s.textContent || '').includes(lbl)) || document.body
  }, label)
}

/**
 * Drives the whole cascade down to a concrete cohort. Selecting only a school
 * leaves the calendar empty and expands the subject accordion to a list of
 * hundreds of entries, which is useless as an illustration.
 */
async function selectCohort(page) {
  for (const id of ['school-ETSINF', 'degree-GIINF', 'semester-A', 'year-2']) {
    await page.evaluate((wanted) => {
      const cb = [...document.querySelectorAll('[role="checkbox"]')].find((c) => c.id === wanted)
      if (cb) cb.click()
    }, id)
    await wait(1600)
  }
  // el acordeón de asignaturas queda desplegado y alarga el panel sin aportar
  await page.evaluate(() => {
    const h = [...document.querySelectorAll('h3,button')].find((x) => /^Asignaturas$/.test(x.textContent.trim()))
    const btn = h && (h.tagName === 'BUTTON' ? h : h.closest('button'))
    if (btn && btn.getAttribute('aria-expanded') === 'true') btn.click()
  })
  await wait(900)
}

/** Scrolls so `label` sits near the top and captures the viewport. */
async function shotAt(page, name, label, offset = 90) {
  await page.evaluate((args) => {
    const [lbl, off] = args
    const el = [...document.querySelectorAll('h2,h3')].find((x) => x.textContent.includes(lbl))
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: 'auto' })
  }, [label, offset])
  await wait(700)
  await page.screenshot({ path: join(OUT, `${name}.png`) })
  console.log(`  ✓ ${name}`)
}

// ---- portada -------------------------------------------------------------
{
  const page = await open('/', [1280, 860])
  await page.screenshot({ path: join(OUT, 'portada.png') })
  console.log('  ✓ portada')
  await page.close()
}

// ---- filtros, calendario, próximos exámenes y lista ----------------------
{
  const page = await open('/', [1400, 1050])
  await selectCohort(page)

  await shotAt(page, 'filtros-etsinf', 'Filtros')
  await shotAt(page, 'calendario', 'Calendario de Exámenes')
  await shotAt(page, 'proximos-examenes', 'Próximos exámenes', 60)

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /^Lista$/.test(x.textContent.trim()))
    if (b) b.click()
  })
  await wait(1800)
  await shotAt(page, 'vista-lista', 'Calendario de Exámenes')

  // aviso que aparece al intentar guardar sin haber iniciado sesión
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /Guardar/.test(x.textContent))
    if (b) b.click()
  })
  await wait(1600)
  await shotAt(page, 'guardar-sin-sesion', 'Calendario de Exámenes')
  await page.close()
}

// ---- páginas propias -----------------------------------------------------
for (const [name, path, size] of [
  ['resultados-exams', '/exams?school=ETSINF', [1280, 1000]],
  ['lista-examenes', '/lista-examenes', [1280, 900]],
  ['lista-anteriores', '/lista-examenes-anteriores', [1280, 900]],
  ['my-calendars-sin-sesion', '/my-calendars', [1280, 760]],
]) {
  const page = await open(path, size)
  await page.screenshot({ path: join(OUT, `${name}.png`) })
  console.log(`  ✓ ${name}`)
  await page.close()
}

// ---- tema oscuro y móvil -------------------------------------------------
{
  const page = await open('/', [1280, 860], 'dark')
  await page.screenshot({ path: join(OUT, 'tema-oscuro.png') })
  console.log('  ✓ tema-oscuro')
  await page.close()
}
{
  const page = await open('/', [390, 844])
  await page.screenshot({ path: join(OUT, 'movil.png') })
  console.log('  ✓ movil')
  await page.close()
}

await browser.close()
console.log(`\nCapturas en ${OUT}/`)
