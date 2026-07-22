'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@hrms/ui'
import { Languages } from 'lucide-react'
import { useTransition } from 'react'

export function LanguageSwitcher() {
  const locale = 'tr' as const
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const next = locale === 'tr' ? 'en' : 'tr'
    startTransition(() => {
      router.push(`/${next}${window.location.pathname.replace(/^\/(tr|en)/, '')}${window.location.search}`)
    })
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} disabled={isPending} title={`Switch to ${locale === 'tr' ? 'English' : 'Turkce'}`}>
      <Languages className="h-4 w-4" />
      <span className="sr-only">{locale.toUpperCase()}</span>
    </Button>
  )
}
