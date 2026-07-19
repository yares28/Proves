"use client"

/**
 * Intentionally renders nothing. The app previously showed auth warning banners
 * here; that UX was removed but the mount point is kept so `app/page.tsx` (and
 * any future re-enable) doesn't need to change.
 */
export function AuthStatusIndicator() {
  return null
}
