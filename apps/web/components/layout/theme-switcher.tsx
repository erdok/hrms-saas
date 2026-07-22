'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@hrms/ui'
import { useTheme } from './theme-provider'

export function ThemeSwitcher() {
  const { resolved, setTheme } = useTheme()

  function toggle() {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={resolved === 'dark' ? 'Acik moda gec' : 'Karanlik moda gec'}
    >
      {resolved === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">Tema</span>
    </Button>
  )
}
