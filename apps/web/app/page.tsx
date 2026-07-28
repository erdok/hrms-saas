import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@hrms/db/server'
import { getSession } from '@hrms/db/server'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@hrms/ui'

const FEATURES = [
  { title: 'Coklu Sirket', desc: 'Her sirket kendi tenanti, kendi kullanicilari.' },
  { title: 'Rol Bazli Erisim', desc: 'super_admin, company_admin, hr_manager, employee.' },
  { title: 'KVKK Uyumlu', desc: 'Audit log, veri sifreleme, erisim kontrolu.' },
  { title: 'Tip Guvenli', desc: 'TypeScript + Supabase generate edilmis tipler.' },
]

const DAYS_AHEAD = 14

async function DashboardHome() {
  const supabase = createClient()
  const session = await getSession(supabase)
  if (!session) redirect('/login')

  const companyId = session.profile.company_id

  const [
    activeResp,
    femaleResp,
    maleResp,
    passiveResp,
    pendingLeavesResp,
    departmentsResp,
  ] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true })
      .eq('company_id', companyId).eq('status', 'active'),
    supabase.from('employees').select('*', { count: 'exact', head: true })
      .eq('company_id', companyId).eq('status', 'active').eq('gender', 'K'),
    supabase.from('employees').select('*', { count: 'exact', head: true })
      .eq('company_id', companyId).eq('status', 'active').eq('gender', 'E'),
    supabase.from('employees').select('*', { count: 'exact', head: true })
      .eq('company_id', companyId).eq('status', 'passive'),
    supabase.from('leaves').select('*', { count: 'exact', head: true })
      .eq('company_id', companyId).eq('status', 'pending'),
    supabase.from('departments').select('id, name').eq('company_id', companyId).order('name'),
  ])

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

function LandingPage() {
  return (
    <main className="container py-20">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Modern <span className="text-primary">Insan Kaynaklari</span> Sistemi
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Personel, izin, puantaj ve belge yonetimini tek panelden olcebilecek
          bir SaaS altyapisi.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Ucretsiz Basla</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Oturum Ac
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return <DashboardHome />
  return <LandingPage />
}
