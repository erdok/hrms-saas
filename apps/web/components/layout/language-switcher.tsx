'use client'

import { Button } from '@hrms/ui'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = 'tr' as const
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled
      title={`Dil: ${locale.toUpperCase()} (yakinda EN)`}
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">{locale.toUpperCase()}</span>
    </Button>
  )
}
