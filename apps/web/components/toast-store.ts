import * as React from 'react'

type ToastVariant = 'default' | 'success' | 'destructive' | 'warning'

export interface InternalToast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type Listener = () => void

let toasts: InternalToast[] = []
const listeners = new Set<Listener>()
let idCounter = 0

function notify() {
  for (const l of listeners) l()
}

export const toastStore = {
  push(options: Omit<InternalToast, 'id'>): string {
    const id = `t-${++idCounter}`
    toasts = [...toasts, { ...options, id }]
    notify()
    return id
  },
  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  },
  clear() {
    toasts = []
    notify()
  },
  getSnapshot: () => toasts,
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  useToasts(): InternalToast[] {
    return React.useSyncExternalStore(
      toastStore.subscribe,
      toastStore.getSnapshot,
      () => [],
    )
  },
}

// Convenience wrapper
export function toast<T extends Record<string, unknown>>(
  options: Omit<InternalToast, 'id'>,
): string {
  return toastStore.push(options)
}
