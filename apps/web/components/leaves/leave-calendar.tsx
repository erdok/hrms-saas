'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Badge } from '@hrms/ui'
import type { LeaveWithEmployee } from '@hrms/db'

type Leave = LeaveWithEmployee

const WEEKDAYS = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTHS_TR = [
  'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
  'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik',
]

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function LeaveCalendar({ leaves }: { leaves: Leave[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const leavesByDay = useMemo(() => {
    const map = new Map<string, Leave[]>()
    for (const l of leaves) {
      const start = new Date(l.start_date)
      const end = new Date(l.end_date)
      while (start <= end) {
        const k = dateKey(start)
        if (!map.has(k)) map.set(k, [])
        map.get(k)!.push(l)
        start.setDate(start.getDate() + 1)
      }
    }
    return map
  }, [leaves])

  const weeks = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)

    // Adjust so Monday (1) is the first day; Sunday (0) becomes 7
    const startDay = (first.getDay() + 6) % 7
    const totalDays = last.getDate()
    const cells: Array<{ date: Date; inMonth: boolean }> = []
    // prev month padding
    for (let i = startDay - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month, -i), inMonth: false })
    }
    for (let i = 1; i <= totalDays; i++) {
      cells.push({ date: new Date(year, month, i), inMonth: true })
    }
    // pad to 42 cells (6 weeks * 7)
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date
      cells.push({ date: new Date(last.getTime() + 86_400_000), inMonth: false })
    }

    type Cell = { date: Date; inMonth: boolean }
    const w: Cell[][] = []
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7) as Cell[])
    return w
  }, [cursor])

  const today = new Date()

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="font-semibold">
          {MONTHS_TR[cursor.getMonth()]} {cursor.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
          >
            Bugun
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border text-center text-xs font-semibold uppercase text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-muted p-2">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border">
        {weeks.flat().map((cell) => {
          const k = dateKey(cell.date)
          const dayLeaves = leavesByDay.get(k) ?? []
          const isToday = isSameDay(cell.date, today)
          return (
            <div
              key={k}
              className={`min-h-[80px] bg-background p-1.5 ${cell.inMonth ? '' : 'bg-muted/30 text-muted-foreground'}`}
            >
              <div className={`mb-1 text-xs ${isToday ? 'rounded bg-primary px-1 text-primary-foreground' : ''}`}>
                {cell.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayLeaves.slice(0, 3).map((l) => (
                  <div
                    key={l.id}
                    className={`truncate rounded px-1 py-0.5 text-[10px] ${
                      l.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-900'
                        : l.status === 'rejected'
                          ? 'bg-red-100 text-red-900'
                          : 'bg-amber-100 text-amber-900'
                    }`}
                    title={`${l.employee_name} - ${l.type} (${l.start_date} / ${l.end_date})`}
                  >
                    {l.employee_name.split(' ')[0]}
                  </div>
                ))}
                {dayLeaves.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">
                    +{dayLeaves.length - 3} daha
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 border-t p-3 text-xs text-muted-foreground">
        <Badge variant="success">Onayli</Badge>
        <Badge variant="warning">Bekleyen</Badge>
        <Badge variant="destructive">Reddedildi</Badge>
      </div>
    </div>
  )
}
