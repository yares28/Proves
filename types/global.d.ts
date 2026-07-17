// Global type augmentations.

export {}

declare global {
  interface Window {
    // Google Identity Services (loaded on demand from accounts.google.com/gsi/client).
    google?: any
  }
}
