'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Network,
  CalendarMinus,
  Clock,
  FileText,
  FilePlus,
  Settings,
  Home,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn, Button } from '@hrms/ui'

const NAV = [
  { href: '/',                      label: 'Panel',       icon: LayoutDashboard },
  { href: '/dashboard/employees',    label: 'Personeller',  icon: Users },
  { href: '/dashboard/departments',  label: 'Departmanlar', icon: Network },
  { href: '/dashboard/leaves',       label: 'Izinler',      icon: CalendarMinus },
  { href: '/dashboard/attendance',   label: 'Puantaj',       icon: Clock },
  { href: '/dashboard/templates',    label: 'Sablonlar',     icon: FileText },
  { href: '/dashboard/documents',    label: 'Belgeler',      icon: FilePlus },
  { href: '/dashboard/settings',     label: 'Ayarlar',       icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const locale = 'tr' as const
  const [mobileOpen, setMobileOpen] = useState(false)

  function localHref(href: string) {
    return `/${locale}${href}`.replace(/\/$/, '')
  }

  function isActive(href: string) {
    const normalized = href === '/' ? localHref('/') : localHref(href)
    return href === '/' ? pathname === normalized : pathname.startsWith(normalized)
  }

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        className="fixed left-3 top-3 z-40 rounded-md border bg-background p-2 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 border-r bg-card md:block">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Home className="h-5 w-5 text-primary" />
          <Link href={localHref('/')} className="font-semibold">HRMS</Link>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={localHref(item.href)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform duration-250 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Home className="h-5 w-5 text-primary" />
          <Link href={localHref('/')} className="font-semibold">HRMS</Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={localHref(item.href)}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
