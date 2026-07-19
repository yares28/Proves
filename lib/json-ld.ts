/**
 * Serializes a value for embedding inside a `<script type="application/ld+json">`
 * via `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` does NOT escape `<`, so a value containing `</script>` (for
 * example a crafted URL segment reflected into structured data) would close the
 * script element early and allow HTML/JS injection. Escaping `<` to its unicode
 * form keeps the JSON valid while making that breakout impossible; `>` and `&`
 * are escaped too for defense in depth against `<!--`/`]]>` sequences.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
