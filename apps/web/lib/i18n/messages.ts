import { cookies } from 'next/headers'
import type { IncomingHttpHeaders } from 'http'
import { defaultLocale, locales, type Locale } from './config'

// Server-side helper: picks locale from cookie, falls back to default
export function getLocale(): Locale {
  const cookieStore = cookies()
  const cookie = cookieStore.get('NEXT_LOCALE')
  if (cookie && locales.includes(cookie.value as Locale)) {
    return cookie.value as Locale
  }
  return defaultLocale
}

/** Looks up nested key like "nav.employees" in a messages object. */
export function t(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return key
    }
  }
  return typeof cur === 'string' ? cur : key
}

// Cache messages in dev (avoid re-parsing on each request)
const _cache: Partial<Record<Locale, Record<string, unknown>>> = {}

export async function getMessages(locale: Locale): Promise<Record<string, unknown>> {
  if (_cache[locale]) return _cache[locale]!
  // dynamic import workaround for next runtime
  const data = await import(`../../messages/${locale}.json`)
  _cache[locale] = data.default as Record<string, unknown>
  return _cache[locale]!
}

// Generic client-side accessor (used by client components)
export function makeTranslationTable(
  messages: Record<string, unknown>,
): (key: string) => string {
  return (key: string) => t(messages, key)
}
