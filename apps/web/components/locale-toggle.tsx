'use client'

import { usePathname, useRouter } from 'next/navigation'
import { setCookie } from 'cookies-next'
import { Select } from '@hrms/ui'
import { locales, localeLabels, type Locale } from '@/lib/i18n/config'

export function LocaleToggle({ current }: { current: Locale }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Select
      aria-label="Dil"
      value={current}
      onChange={(e) => {
        const v = e.target.value as Locale
        setCookie('NEXT_LOCALE', v, { path: '/', maxAge: 60 * 60 * 24 * 365 })
        router.refresh()
      }}
      className="h-9 w-24 text-xs"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeLabels[l]}
        </option>
      ))}
    </Select>
  )
}
