import { redirect } from 'next/navigation'
import { createClient, getSession } from '@hrms/db/server'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/toaster'
import { Sidebar } from '@/components/layout/sidebar'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Topbar } from '@/components/layout/topbar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const session = await getSession(supabase)
  if (!session) redirect('/auth/login')

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-muted/30">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
          <Topbar />
          <LanguageSwitcher />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
          <BottomNav />
        </div>
        <MobileNav />
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
