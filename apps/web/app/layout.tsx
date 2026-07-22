import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/toaster'

export const metadata: Metadata = {
  title: {
    default: 'HRMS - Insan Kaynaklari Yonetim Sistemi',
    template: '%s | HRMS',
  },
  description: 'Modern, guvenli, cok-sirketli IKS yonetim platformu.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
