'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@hrms/ui'
import { Eraser, Save } from 'lucide-react'
import type { AttendanceMonthRow } from '@hrms/db'

interface GridRow {
  employee_id: string
  employee_name: string | null
  department_name: string | null
  day_status: number[]
}

interface Props {
  rows: GridRow[]
  monthDate: string      // YYYY-MM-01
  daysInMonth: number
  holidays: string[]     // dates that are public holidays
}

const CODES = [0, 1, 2, 3, 4, 5] as const
const CODE_COLORS: Record<number, string> = {
  0: 'bg-muted/40 text-muted-foreground',
  1: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  2: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  3: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  4: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  5: 'bg-red-100 text-red-800 hover:bg-red-200',
}
const CODE_LETTER: Record<number, string> = {
  0: '',
  1: 'G',
  2: 'R',
  3: 'I',
  4: 'T',
  5: 'B',
}

export function AttendanceGrid({ rows, monthDate, daysInMonth, holidays }: Props) {
  const [pending, startTransition] = useTransition()
  // local optimistic state mirrors rows for snappy typing
  const [localRows, setLocalRows] = useState(rows)

  useEffect(() => {
    setLocalRows(rows)
  }, [rows])

  const totalCols = 31
  // headers
  const days = Array.from({ length: totalCols }, (_, i) => i + 1)
  const holidaySet = new Set(holidays)

  function getCell(row: GridRow, day: number): number {
    return row.day_status[day - 1] ?? 0
  }

  function setCellCode(employeeId: string, day: number, currentCode: number) {
    // cycle through codes 1 -> 2 -> 3 -> 4 -> 5 -> 0 -> 1
    const order = [0, 1, 5, 3, 2, 4]
    const next = order[(order.indexOf(currentCode) + 1) % order.length]

    setLocalRows((prev) =>
      prev.map((r) => {
        if (r.employee_id !== employeeId) return r
        const newStatus = [...r.day_status]
        newStatus[day - 1] = next
        return { ...r, day_status: newStatus }
      }),
    )

    startTransition(async () => {
      const { setDay } = await import('@/app/dashboard/attendance/actions')
      await setDay(employeeId, monthDate, day, next)
    })
  }

  function clearRow(employeeId: string) {
    if (!confirm('Bu personelin tum ay puantaji sifirlansin mi?')) return
    startTransition(async () => {
      const { clearMonth } = await import('@/app/dashboard/attendance/actions')
      await clearMonth(employeeId, monthDate)
      setLocalRows((prev) =>
        prev.map((r) =>
          r.employee_id === employeeId
            ? { ...r, day_status: new Array(31).fill(0) }
            : r,
        ),
      )
    })
  }

  function row(row: GridRow) {
    return (
      <TableRow key={row.employee_id}>
        <TableCell className="sticky left-0 z-10 min-w-[180px] bg-background font-medium">
          {row.employee_name}
          {row.department_name ? (
            <span className="ml-2 text-muted-foreground">- {row.department_name}</span>
          ) : null}
        </TableCell>
        {days.map((day) => {
          if (day > daysInMonth) {
            return <TableCell key={day} className="p-0"></TableCell>
          }
          const date = `${monthDate.slice(0, 8)}${String(day).padStart(2, '0')}`
          const isHoliday = holidaySet.has(date)
          const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6
          const code = getCell(row, day)
          return (
            <TableCell key={day} className="p-0.5">
              <button
                type="button"
                onClick={() => setCellCode(row.employee_id, day, code)}
                className={`flex h-7 w-7 items-center justify-center rounded-md border text-[10px] font-semibold transition-colors ${
                  CODE_COLORS[code] ?? CODE_COLORS[0]
                } ${
                  isWeekend && code === 0 ? 'border-border/50 bg-slate-50' : ''
                } ${isHoliday && code === 0 ? 'border-purple-300 bg-purple-50' : ''}`}
                title={`${date}${isWeekend ? ' (hafta sonu)' : ''}${
                  isHoliday ? ' - resmi tatil' : ''
                }`}
              >
                {CODE_LETTER[code]}
              </button>
            </TableCell>
          )
        })}
        <TableCell className="sticky right-0 z-10 bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => clearRow(row.employee_id)}
            disabled={pending}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Bu ay icin puantaj bulunamadi. Cell'lere tiklayarak doldurmaya baslayin.
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-muted">Personel</TableHead>
            {days.map((d) => {
              if (d > daysInMonth) return null
              const date = `${monthDate.slice(0, 8)}${String(d).padStart(2, '0')}`
              const isHoliday = holidaySet.has(date)
              const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6
              return (
                <TableHead
                  key={d}
                  className={`px-1 text-center text-[10px] ${
                    isWeekend ? 'bg-slate-100' : ''
                  } ${isHoliday ? 'bg-purple-100' : ''}`}
                >
                  {d}
                </TableHead>
              )
            })}
            <TableHead className="sticky right-0 z-10 bg-muted text-center">Sil</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localRows.map(row)}
        </TableBody>
      </Table>
      <div className="border-t bg-muted/30 p-2 text-xs text-muted-foreground">
        Tusa tiklayarak kodu degistir: G (Geldi), R (Raporlu), I (Izinli), T (Tatil), B (Boss).
      </div>
    </div>
  )
}
