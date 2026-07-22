'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarMinus,
  Clock,
  Settings,
} from 'lucide-react'
import { cn } from '@hrms/ui'

const NAV = [
  { href: '/',            label: 'Panel',      icon: LayoutDashboard },
  { href: '/employees',   label: 'Personel',   icon: Users },
  { href: '/leaves',      label: 'Izinler',    icon: CalendarMinus },
  { href: '/attendance',  label: 'Puantaj',    icon: Clock },
  { href: '/settings',    label: 'Ayarlar',    icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t bg-background/95 backdrop-blur md:hidden">
      {NAV.map((item) => {
        const Icon = item.icon
        const active =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
