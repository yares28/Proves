/**
 * Scores the usability questionnaire from Anexo E of the memoria.
 *
 *   npm run sus -- docs/usabilidad/respuestas.csv
 *
 * Input: a CSV with one row per participant and ten columns Q1..Q10, each an
 * integer 1-5. A leading identifier column is optional and ignored. A header
 * row is detected and skipped.
 *
 * This computes results from real responses. It does not generate them: a SUS
 * figure without participants behind it is not a result.
 */
import { readFileSync, existsSync } from 'node:fs'

const file = process.argv[2] || 'docs/usabilidad/respuestas.csv'
if (!existsSync(file)) {
  console.error(`No such file: ${file}\n`)
  console.error('Expected a CSV of real responses, one row per participant:')
  console.error('  participante,Q1,Q2,Q3,Q4,Q5,Q6,Q7,Q8,Q9,Q10')
  console.error('  P1,4,2,5,1,4,2,5,1,4,2')
  process.exit(1)
}

const rows = readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => l.split(',').map((c) => c.trim()))

// Drop a header row if the last ten cells are not numeric.
const isDataRow = (r) => r.slice(-10).every((c) => /^[1-5]$/.test(c))
const data = rows.filter(isDataRow)
const skipped = rows.length - data.length
if (!data.length) {
  console.error('No valid response rows found (each needs ten integers 1-5).')
  process.exit(1)
}

/** Standard SUS scoring: odd items score-1, even items 5-score, sum x 2.5. */
function susScore(answers) {
  let total = 0
  answers.forEach((raw, idx) => {
    const v = Number(raw)
    total += (idx % 2 === 0) ? v - 1 : 5 - v
  })
  return total * 2.5
}

const scores = data.map((r) => susScore(r.slice(-10)))
const n = scores.length
const mean = scores.reduce((a, b) => a + b, 0) / n
const sorted = [...scores].sort((a, b) => a - b)
const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
const sd = n > 1
  ? Math.sqrt(scores.reduce((a, s) => a + (s - mean) ** 2, 0) / (n - 1))
  : 0
// 95% CI, normal approximation — indicative only at these sample sizes.
const ci = n > 1 ? 1.96 * (sd / Math.sqrt(n)) : 0

// Sauro & Lewis curved grading of the SUS score.
const grade = (s) =>
  s >= 80.3 ? 'A (excelente)' :
  s >= 74   ? 'B (bueno)' :
  s >= 68   ? 'C (aceptable, en la media)' :
  s >= 51   ? 'D (pobre)' : 'F (inaceptable)'

console.log(`\nParticipantes: ${n}${skipped ? `  (${skipped} fila(s) ignorada(s))` : ''}`)
console.log('\n| Participante | SUS |')
console.log('|---|---|')
data.forEach((r, i) => {
  const label = isDataRow(r) && r.length > 10 ? r[0] : `P${i + 1}`
  console.log(`| ${label} | ${scores[i].toFixed(1)} |`)
})

console.log(`\nMedia:    ${mean.toFixed(1)}`)
console.log(`Mediana:  ${median.toFixed(1)}`)
console.log(`Desv.tip: ${sd.toFixed(1)}`)
if (n > 1) console.log(`IC 95%:   ${(mean - ci).toFixed(1)} – ${(mean + ci).toFixed(1)}`)
console.log(`Valoración: ${grade(mean)}`)
console.log(`Referencia: la media de los sistemas evaluados con SUS se sitúa en torno a 68.`)
console.log(`\nNota: la puntuación SUS no es un porcentaje de acierto.\n`)
