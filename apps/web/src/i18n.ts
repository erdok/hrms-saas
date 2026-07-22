import { getRequestConfig } from 'next-intl/server'

const LOCALES = ['tr', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export { LOCALES }

export const DEFAULT_LOCALE: Locale = 'tr'

export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE
  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  }
})
