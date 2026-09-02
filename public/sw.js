/*
 * UPV-Cal service worker.
 *
 * Strategy is split by what the resource is, because exam data and app shell
 * have opposite requirements:
 *
 *   - Build assets (/_next/static/*) are content-hashed and immutable, so they
 *     are cache-first: once cached they never need revalidating.
 *   - Navigations and exam data are network-first with a cache fallback. Exam
 *     dates get corrected during the term, so a stale date shown as if it were
 *     current is worse than a visible "offline" state; the network always wins
 *     when it is reachable, and the cache only covers the offline case.
 *   - Everything cached is same-origin GET. Supabase auth traffic and the ICS
 *     feed are deliberately left alone: caching a session response or a
 *     calendar subscription would serve one user's data to the next.
 */

const VERSION = 'upv-cal-v1'
const SHELL_CACHE = `${VERSION}-shell`
const DATA_CACHE = `${VERSION}-data`
const OFFLINE_URL = '/offline'

// Kept deliberately small: only what is needed to render *something* useful.
const SHELL_ASSETS = [OFFLINE_URL, '/icon-192.png', '/icon-512.png', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll rejects the whole install if any single URL 404s, so each asset
      // is added independently and a missing one is simply skipped.
      .then((cache) => Promise.allSettled(SHELL_ASSETS.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

/** Requests that must never be served from, or written to, the cache. */
function isBypassed(url) {
  return (
    url.pathname.startsWith('/api/ical') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/auth/') ||
    url.searchParams.has('_rsc')
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isBypassed(url)) return

  // Immutable build output: cache-first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(SHELL_CACHE).then((c) => c.put(request, copy))
            }
            return res
          })
      )
    )
    return
  }

  // Page navigations: network-first, falling back to the last good copy and
  // finally to the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(DATA_CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match(OFFLINE_URL))
            .then((hit) => hit || Response.error())
        )
    )
    return
  }

  // Same-origin static media: cache-first with background fill.
  if (/\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(SHELL_CACHE).then((c) => c.put(request, copy))
            }
            return res
          })
      )
    )
  }
})
