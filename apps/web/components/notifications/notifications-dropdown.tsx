'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@hrms/db/client'
import { Bell, BellDot } from 'lucide-react'
import { Button, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@hrms/ui'

interface Notification {
  id: string
  type: string
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  'leave.created': 'Izin talebi geldi',
  'leave.approved': 'Izin onaylandi',
  'leave.rejected': 'Izin reddedildi',
  'employee.created': 'Yeni personel eklendi',
  'contract.expiring': 'Sozlesmesi bitmek uzere',
  'kvkk.subject-access': 'KVKK islem',
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let ignore = false

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!ignore && data) {
        const items = data as Notification[]
        setNotifications(items)
        setUnreadCount(items.filter((n) => !n.read_at).length)
      }
    }

    load()

    // Realtime channel (optional: subscribe to inserts)
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          load()
        },
      )
      .subscribe()

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [])

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  async function markAllRead() {
    const supabase = createClient()
    const ids = notifications.filter((n) => !n.read_at).map((n) => n.id)
    if (!ids.length) return
    await Promise.all(
      ids.map((id) =>
        supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id),
      ),
    )
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    )
    setUnreadCount(0)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? <BellDot className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-auto">
        {unreadCount > 0 && (
          <DropdownMenuItem onClick={markAllRead} className="text-xs text-primary">
            Tumu okut
          </DropdownMenuItem>
        )}
        {notifications.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">Bildirim yok</div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read_at
            const label = TYPE_LABELS[n.type] ?? n.type
            const time = new Date(n.created_at).toLocaleString('tr-TR')

            return (
              <div
                key={n.id}
                className="flex items-start gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                onClick={() => markRead(n.id)}
                role="button"
                tabIndex={0}
              >
                {isUnread && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
                <div className="min-w-0">
                  <p className={`truncate ${isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{time}</p>
                </div>
              </div>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
