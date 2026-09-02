/**
 * Crea (o restablece) la cuenta de demostración que el tribunal puede usar para
 * probar las funciones que exigen sesión iniciada, y la deja con un par de
 * calendarios guardados para que la página no aparezca vacía.
 *
 *   node scripts/crear-cuenta-demo.mjs "unaContraseñaQueElijasTú"
 *
 * Es idempotente: si la cuenta ya existe, actualiza su contraseña y vuelve a
 * dejar los calendarios de ejemplo.
 *
 * AVISO: si publicas estas credenciales en la memoria, cualquiera que lea el
 * documento en RiuNet podrá entrar en esa cuenta. Úsala solo para demostración,
 * no guardes en ella nada que no quieras que sea público, y considera cambiar
 * la contraseña una vez pasada la defensa.
 */
import { readFileSync } from 'node:fs'

const EMAIL = 'demo@upvcal.com'
const password = process.argv[2]

if (!password || password.length < 8) {
  console.error('Uso: node scripts/crear-cuenta-demo.mjs "<contraseña de al menos 8 caracteres>"')
  process.exit(1)
}

// Lee .env.local sin volcarlo por pantalla.
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_BASE || !SERVICE) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const admin = (path, init = {}) =>
  fetch(`${URL_BASE}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })

// 1. ¿Existe ya?
const list = await admin(`/auth/v1/admin/users?page=1&per_page=200`)
if (!list.ok) {
  console.error('No se pudo consultar la lista de usuarios:', list.status, await list.text())
  process.exit(1)
}
const { users = [] } = await list.json()
const existing = users.find((u) => u.email === EMAIL)

let userId
if (existing) {
  const upd = await admin(`/auth/v1/admin/users/${existing.id}`, {
    method: 'PUT',
    body: JSON.stringify({ password, email_confirm: true }),
  })
  if (!upd.ok) { console.error('Error actualizando:', await upd.text()); process.exit(1) }
  userId = existing.id
  console.log('Cuenta ya existente: contraseña actualizada.')
} else {
  const cre = await admin(`/auth/v1/admin/users`, {
    method: 'POST',
    body: JSON.stringify({
      email: EMAIL,
      password,
      email_confirm: true, // sin verificación por correo: nadie lee ese buzón
      user_metadata: { full_name: 'Cuenta de demostración' },
    }),
  })
  if (!cre.ok) { console.error('Error creando la cuenta:', await cre.text()); process.exit(1) }
  userId = (await cre.json()).id
  console.log('Cuenta de demostración creada.')
}

// 2. Calendarios de ejemplo, para que /my-calendars no salga vacío.
const ejemplos = [
  { name: '2.º curso GIINF — semestre A', filters: { school: ['ETSINF'], degree: ['Grado en Ingeniería Informática'], year: ['2'], semester: ['A'] } },
  { name: 'Solo mis asignaturas de enero', filters: { school: ['ETSINF'], semester: ['A'] } },
]

await admin(`/rest/v1/user_calendars?user_id=eq.${userId}`, { method: 'DELETE' })
const ins = await admin(`/rest/v1/user_calendars`, {
  method: 'POST',
  headers: { Prefer: 'return=representation' },
  body: JSON.stringify(ejemplos.map((e) => ({ ...e, user_id: userId }))),
})
console.log(ins.ok ? `Calendarios de ejemplo: ${ejemplos.length}` : `Aviso: no se pudieron insertar los calendarios (${ins.status})`)

console.log(`
Listo. Para la memoria (apartado 6.5):

  Correo:     ${EMAIL}
  Contraseña: la que acabas de indicar

Compruébalo entrando en https://www.upvcal.com y abriendo «Mis calendarios».`)
