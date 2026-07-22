'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolved: 'light',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolved, setResolved] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) setThemeState(stored)
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', theme)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const compute = () => {
      const active = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme
      setResolved(active)
      document.documentElement.classList.toggle('dark', active === 'dark')
    }

    compute()
    mq.addEventListener('change', compute)
    return () => mq.removeEventListener('change', compute)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export { type Theme }
