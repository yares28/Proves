import type { Exam, SubjectOption } from '@/types/exam'

/**
 * UPV teaches in Castellano and Valencià, and publishes English names for most
 * subjects. Castellano is the canonical language: it is what identifies a
 * subject in URLs and in saved calendars. The other two are display only.
 */
export const LOCALES = ['es', 'va', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'es'

export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'Castellano',
  va: 'Valencià',
  en: 'English',
}

/** BCP-47 tags, for the `lang` attribute and date formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  es: 'es-ES',
  va: 'ca-ES-valencia',
  en: 'en-GB',
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/**
 * The subject name to show for a locale, falling back to Castellano.
 *
 * Not every exam is translated — the ETSA rows come from outside the API that
 * carries translations, and upstream leaves some blank — so the fallback is the
 * normal case, not an error.
 */
export function examSubject(exam: Exam, locale: Locale): string {
  if (locale === 'va') return exam.subject_va || exam.subject
  if (locale === 'en') return exam.subject_en || exam.subject
  return exam.subject
}

/** The label for a sidebar subject option. `value` is always Castellano. */
export function subjectLabel(option: SubjectOption, locale: Locale): string {
  if (locale === 'va') return option.va || option.value
  if (locale === 'en') return option.en || option.value
  return option.value
}
