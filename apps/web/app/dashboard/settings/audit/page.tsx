import { createClient } from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@hrms/ui'

interface PageProps {
  searchParams?: { entity?: string; page?: string }
}

const PAGE_SIZE = 50

const ENTITY_LABELS: Record<string, string> = {
  employees: 'Personel',
  departments: 'Departman',
  leaves: 'Izin',
  attendance: 'Puantaj',
  templates: 'Sablon',
  documents: 'Belge',
  profiles: 'Kullanici',
}

const ACTION_LABELS: Record<string, { variant: 'success' | 'warning' | 'destructive' | 'secondary'; label: string }> = {
  create: { variant: 'success', label: 'Olustur' },
  update: { variant: 'warning', label: 'Guncelle' },
  delete: { variant: 'destructive', label: 'Sil' },
}

export default async function AuditPage({ searchParams }: PageProps) {
  await requirePermission('read', 'audit_logs')
  const supabase = createClient()

  const page = Math.max(1, parseInt(searchParams?.page ?? '1', 10) || 1)
  const entity = searchParams?.entity ?? null

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (entity) query = query.eq('entity', entity)

  const { data: logs, count } = await query

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Denetim Kayitlari (Audit Log)</h1>
        <p className="text-sm text-muted-foreground">
          KVKK Madde 12 geregi tum veri degisiklikleri kayit altinda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtre</CardTitle>
          <CardDescription>Kayit tipine gore filtrele.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <a
              href="/dashboard/settings/audit"
              className={`rounded-md px-3 py-1.5 text-sm ${
                !entity ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'
              }`}
            >
              Tumu
            </a>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <a
                key={key}
                href={`/dashboard/settings/audit?entity=${key}`}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  entity === key ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {(count ?? 0)} kayit - Sayfa {page} / {totalPages}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kayit bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const desc = ACTION_LABELS[log.action] ?? {
                  variant: 'secondary' as const,
                  label: log.action,
                }
                return (
                  <div key={log.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant={desc.variant}>{desc.label}</Badge>
                      <span className="font-medium">
                        {ENTITY_LABELS[log.entity] ?? log.entity}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.entity_id ? `${log.entity_id.slice(0, 8)}` : ''}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    {log.diff && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          Fark goster
                        </summary>
                        <pre className="mt-2 max-h-[200px] overflow-auto rounded-md bg-muted p-2 text-xs">
                          {JSON.stringify(log.diff, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/dashboard/settings/audit?${entity ? `entity=${entity}&` : ''}page=${page - 1}`}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              &laquo; Onceki
            </a>
          )}
          {page < totalPages && (
            <a
              href={`/dashboard/settings/audit?${entity ? `entity=${entity}&` : ''}page=${page + 1}`}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Sonraki &raquo;
            </a>
          )}
        </div>
      )}
    </div>
  )
}
