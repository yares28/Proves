/**
 * Re-renders the UML diagrams embedded in the memoria (Figuras 1 y 5).
 *
 *   npm run diagramas
 *
 * Edit the .svg sources in docs/diagramas/ and re-run; then re-insert the PNGs
 * into the .docx. SVG is the source of truth so the diagrams stay editable
 * rather than being opaque bitmaps.
 */
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'docs/diagramas'
const WIDTH = 2000

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.svg'))) {
  const svg = readFileSync(join(DIR, file), 'utf8')
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng()
  const out = file.replace(/\.svg$/, '.png')
  writeFileSync(join(DIR, out), png)
  console.log(`${file} -> ${out} (${(png.length / 1024).toFixed(0)} kB)`)
}
