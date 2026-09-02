"use client"

import { useEffect } from "react"

/**
 * Registers the service worker that makes the app installable and usable
 * offline. Kept out of the dev build: an aggressively caching worker during
 * development masks code changes and is a well-known source of "why is my edit
 * not showing" confusion.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        // Registration failing is not fatal — the app still works online.
        console.error("Service worker registration failed:", error)
      })
    }

    window.addEventListener("load", onLoad)
    return () => window.removeEventListener("load", onLoad)
  }, [])

  return null
}
