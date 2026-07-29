import {
  createClient,
  getAttendanceMonth,
  AttendanceCode,
  daysInMonth,
  type AttendanceMonthRow,
} from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import { AttendanceGrid } from '@/components/attendance/attendance-grid'

interface PageProps {
  searchParams?: { month?: string }
}

export default async function AttendancePage({ searchParams }: PageProps) {
  await requirePermission('read', 'attendance')

  // Default to current month
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthDate = (searchParams?.month ?? defaultMonth).slice(0, 7) + '-01'
  const totalDays = daysInMonth(monthDate)

  const supabase = createClient()
  const [rows, employeesResp, holidaysResp] = await Promise.all([
    getAttendanceMonth(supabase, monthDate),
    supabase
      .from('employees')
      .select('id, full_name, department:departments(name)')
      .eq('status', 'active')
      .order('full_name'),
    supabase.from('public_holidays').select('date, name').eq('country', 'TR'),
  ])

  // Merge: attendance rows have latest data; employees not on attendance get empty arrays
  const empIndex = new Map<string, AttendanceMonthRow>()
  for (const r of rows) empIndex.set(r.employee_id, r)
  const merged = (employeesResp.data ?? []).map((e) => {
    const existing = empIndex.get(e.id)
    return {
      employee_id: e.id,
      employee_name: e.full_name,
      department_name: Array.isArray(e.department) ? e.department[0]?.name : e.department?.name,
      day_status: existing?.day_status ?? new Array(31).fill(0),
    }
  })

  const holidayDates = (holidaysResp.data ?? []).map((h) => h.date)

  // Build prev/next month links
  const prevMonth = (() => {
    const [y, m] = monthDate.split('-').map(Number)
    return `${y}-${String(Math.max(1, m - 1)).padStart(2, '0')}-01`
  })()
  const nextMonth = (() => {
    const [y, m] = monthDate.split('-').map(Number)
    const d = new Date(y, m, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })()

  const [year, monthIdx] = monthDate.split('-').map(Number)
  const monthName = [
    'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik',
  ][monthIdx - 1]

  // Summary
  const summary = merged.map((row) => {
    const stat = {
      G: 0, R: 0, I: 0, T: 0, B: 0,
    }
    for (let i = 0; i < totalDays; i++) {
      const c = row.day_status[i] ?? 0
      if (c === AttendanceCode.CAME) stat.G++
      else if (c === AttendanceCode.REPORT) stat.R++
      else if (c === AttendanceCode.LEAVE) stat.I++
      else if (c === AttendanceCode.HOLIDAY) stat.T++
      else if (c === AttendanceCode.ABSENT) stat.B++
    }
    return stat
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Puantaj</h1>
          <p className="text-sm text-muted-foreground">
            {monthName} {year} - Aktif personeller
          </p>
        </div>
        <div className="flex gap-1">
          <a
            href={`/dashboard/attendance?month=${prevMonth}`}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            &laquo; Onceki
          </a>
          <a
            href={`/dashboard/attendance?month=${nextMonth}`}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Sonraki &raquo;
          </a>
        </div>
      </div>

      <AttendanceGrid
        rows={merged}
        monthDate={monthDate}
        daysInMonth={totalDays}
        holidays={holidayDates}
      />

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          Ay ozeti (gun sayilari)
        </summary>
        <div className="mt-3 overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-2 text-left">Personel</th>
                <th className="p-2 text-center">Geldi</th>
                <th className="p-2 text-center">Raporlu</th>
                <th className="p-2 text-center">Izinli</th>
                <th className="p-2 text-center">Tatil</th>
                <th className="p-2 text-center">Boss</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{merged[i].employee_name}</td>
                  <td className="p-2 text-center text-emerald-700">{s.G}</td>
                  <td className="p-2 text-center text-amber-700">{s.R}</td>
                  <td className="p-2 text-center text-blue-700">{s.I}</td>
                  <td className="p-2 text-center text-purple-700">{s.T}</td>
                  <td className="p-2 text-center text-red-700">{s.B}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
