'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarMinus,
  Clock,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@hrms/ui'

const MOBILE_NAV = [
  { href: '/',              icon: LayoutDashboard, label: 'Panel' },
  { href: '/employees',     icon: Users,            label: 'Personeller' },
  { href: '/leaves',        icon: CalendarMinus,    label: 'Izinler' },
  { href: '/attendance',    icon: Clock,             label: 'Puantaj' },
]

export function MobileNav() {
  const pathname = usePathname()
  const locale = 'tr' as const
  function localHref(href: string) {
    return `/${locale}${href}`.replace(/\/$/, '')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur md:hidden">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon
        const href = item.href === '/' ? `/${locale}` : `${localHref(item.href)}`
        const active =
          item.href === '/'
            ? pathname === href
            : pathname.startsWith(href)
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors',
              active
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}

      <Link
        href={`/${locale}/departments`}
        className={cn(
          'flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors',
          pathname.startsWith(`/${locale}/departments`)
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <MoreHorizontal className="h-5 w-5" />
        <span>Diger</span>
      </Link>
    </nav>
  )
}
