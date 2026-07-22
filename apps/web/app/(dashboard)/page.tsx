import { createClient } from '@hrms/db/server'
import { requireSession } from '@/lib/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@hrms/ui'

const DAYS_AHEAD = 14

export default async function DashboardHome() {
  const session = await requireSession()
  const supabase = createClient()
  const companyId = session.profile.company_id

  // counts: aktif, pasif, kadin, erkek, bugun izinli
  const [
    totalResp,
    activeResp,
    femaleResp,
    maleResp,
    passiveResp,
    pendingLeavesResp,
    departmentsResp,
  ] = await Promise.all([
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active'),
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active')
      .eq('gender', 'K'),
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active')
      .eq('gender', 'E'),
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'passive'),
    supabase
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'pending'),
    supabase
      .from('departments')
      .select('id, name')
      .eq('company_id', companyId)
      .order('name'),
  ])

  // Sözleþmesi DAYS_AHEAD gün içinde bitecek aktif personeller
  const today = new Date()
  const future = new Date()
  future.setDate(today.getDate() + DAYS_AHEAD)
  const todayStr = today.toISOString().slice(0, 10)
  const futureStr = future.toISOString().slice(0, 10)

  const { data: expiringList } = await supabase
    .from('employees')
    .select('id, full_name, contract_end, department:departments(name)')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .gte('contract_end', todayStr)
    .lte('contract_end', futureStr)
    .order('contract_end', { ascending: true })

  // Departmental distribution of active employees
  let deptStats: { name: string; count: number }[] = []
  if (departmentsResp.data && departmentsResp.data.length > 0) {
    const { data: activeEmps } = await supabase
      .from('employees')
      .select('department_id')
      .eq('company_id', companyId)
      .eq('status', 'active')
    const counts = new Map<string, number>()
    for (const e of activeEmps ?? []) {
      if (e.department_id) counts.set(e.department_id, (counts.get(e.department_id) ?? 0) + 1)
    }
    deptStats = departmentsResp.data.map((d) => ({
      name: d.name,
      count: d.id ? counts.get(d.id) ?? 0 : 0,
    }))
  }

  // Bugün izinli personeller
  const { data: onLeaveToday } = await supabase
    .from('leaves')
    .select('id, type, employee:employees(full_name, department:departments(name))')
    .eq('company_id', companyId)
    .in('status', ['approved', 'pending'])
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)

  const activeCount = activeResp.count ?? 0
  const totalExp = expiringList?.length ?? 0
  const pendingLeaves = pendingLeavesResp.count ?? 0

  const stats = [
    { label: 'Toplam Personel', value: activeCount, color: 'default' as const },
    { label: 'Kadin Personel', value: femaleResp.count ?? 0, color: 'secondary' as const },
    { label: 'Erkek Personel', value: maleResp.count ?? 0, color: 'secondary' as const },
    { label: 'Pasif (Arsiv)', value: passiveResp.count ?? 0, color: 'outline' as const },
    { label: 'Sozlesmesi Bitmek Uzere', value: totalExp, color: 'warning' as const },
    { label: 'Bekleyen Izinler', value: pendingLeaves, color: 'destructive' as const },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{session.company.name}</span> sirketi genel bakis.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{s.value}</p>
                <Badge variant={s.color} className="text-[10px]">.</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Departmanlara Gore Dagilim</CardTitle>
            <CardDescription>Aktif personellerin departman bazinda dolumu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {deptStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Departman bulunmuyor.</p>
            ) : (
              deptStats.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span>{d.name}</span>
                  <Badge variant={d.count > 0 ? 'secondary' : 'outline'}>{d.count} kisi</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bugun Izinli Personeller</CardTitle>
            <CardDescription>Onayli veya bekleyen izin icinde bugune rastlayan kayitlar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {onLeaveToday && onLeaveToday.length > 0 ? (
              onLeaveToday.map((l) => {
                const e = Array.isArray(l.employee) ? l.employee[0] : l.employee
                const empName = e?.full_name ?? '-'
                const depName = Array.isArray(e?.department) ? e?.department[0]?.name : e?.department?.name
                return (
                  <div key={l.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{empName}</span>
                      {depName ? <span className="ml-2 text-muted-foreground">{depName}</span> : null}
                    </div>
                    <Badge>{l.type}</Badge>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">Bugun izinli personel yok.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onumuzdeki {DAYS_AHEAD} Gunde Bitecek Sozlesmeler</CardTitle>
        </CardHeader>
        <CardContent>
          {expiringList && expiringList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {expiringList.map((e) => {
                const depName = Array.isArray(e.department) ? e.department[0]?.name : e.department?.name
                const days = Math.ceil((new Date(e.contract_end ?? todayStr).getTime() - today.getTime()) / 86_400_000)
                return (
                  <Badge key={e.id} variant={days <= 7 ? 'destructive' : 'warning'}>
                    {e.full_name}
                    {depName ? ` - ${depName}` : ''}
                    {` (${days} gun)`}
                  </Badge>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Onumuzdeki {DAYS_AHEAD} gun icinde biten sozlesme bulunmuyor.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
