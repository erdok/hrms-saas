'use client'

import * as React from 'react'

export type ToastVariant = 'default' | 'success' | 'destructive' | 'warning'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: React.ReactNode
}

const ToastContext = React.createContext<{
  toasts: (ToastOptions & { id: string })[]
  push: (t: ToastOptions) => void
  dismiss: (id: string) => void
} | null>(null)

let idCounter = 0

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastOptions & { id: string })[]>([])

  const push = React.useCallback((t: ToastOptions) => {
    const id = `toast-${++idCounter}`
    setToasts((prev) => [...prev, { ...t, id }])
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = React.useMemo(
    () => ({ toasts, push, dismiss }),
    [toasts, push, dismiss],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    return {
      push: () => {},
      dismiss: () => {},
    }
  }
  return {
    push: ctx.push,
    dismiss: (id: string) => ctx.dismiss(id),
  }
}
