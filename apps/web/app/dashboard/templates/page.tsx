import { createClient, listTemplates, TEMPLATE_TOKENS } from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@hrms/ui'
import { TemplateList } from '@/components/templates/template-list'

export default async function TemplatesPage() {
  await requirePermission('read', 'templates')
  const supabase = createClient()
  const templates = await listTemplates(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sablonlar</h1>
        <p className="text-sm text-muted-foreground">
          Belge sablonlarini olusturun. Asagidaki etiketleri metin icinde kullanabilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Etiketler</CardTitle>
          <CardDescription>
            Sablonu render ederken personel verileri ile degistirilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          {TEMPLATE_TOKENS.map((t) => (
            <code
              key={t}
              className="rounded bg-muted p-1.5 text-xs text-foreground"
            >
              {`{{${t}}}`}
            </code>
          ))}
        </CardContent>
      </Card>

      <TemplateList templates={templates} />
    </div>
  )
}
