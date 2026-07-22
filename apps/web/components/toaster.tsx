'use client'

import {
  ToastProvider,
  ToastViewport,
  ToastRoot,
  ToastClose,
  ToastTitle,
  ToastDescription,
} from '@hrms/ui'
import { toastStore, type InternalToast } from './toast-store'

export function Toaster() {
  const toasts = toastStore.useToasts()
  return (
    <ToastProvider duration={5000} swipeDirection="right">
      {toasts.map((t) => (
        <ToastRoot
          key={t.id}
          variant={t.variant}
          onOpenChange={(open) => {
            if (!open) toastStore.dismiss(t.id)
          }}
        >
          {t.title && <ToastTitle>{t.title}</ToastTitle>}
          {t.description && <ToastDescription>{t.description}</ToastDescription>}
          <ToastClose />
        </ToastRoot>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
