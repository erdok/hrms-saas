import { createClient } from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@hrms/ui'
import { KvkkPanel } from '@/components/settings/kvkk-panel'

export default async function KvkkPage() {
  await requirePermission('read', 'audit_logs')
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)
  const { count: employeesCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .or(`status.eq.active,contract_end.lt.${today + 2}`)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KVKK & Veri Koruma</h1>
        <p className="text-sm text-muted-foreground">
          6698 sayili Kanun ve Aydinlatma Yukumlulugu Yonetmeligi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Veri Sahibi Haklari (Madde 11)</CardTitle>
          <CardDescription>
            Veri sahibinin talep edebilecegi haklari asagidan bulabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Islenip islenmedigini ogrenme</li>
           <li>Islenmis ise buna iliskin bilgi talep etme</li>
           <li>Isleme amacini ve bunlarin amaca uygun kullanilip kullanilmadigini ogrenme</li>
           <li>Eksik veya yanlis islenmis ise duzeltilmesini isteme</li>
           <li>Silinmesini veya yok edilmesini isteme</li>
           <li>Aktarildigi ucuncu kisilere bildirilmesini isteme</li>
           <li>Islenen verilerin munhasiran otomatik sistemler tarafindan analiz edilmesi suretiyle
                aleyhinize bir sonucun ortaya cikmasina itiraz etme</li>
           <li>Zarar gecirmesi hlinde zararin giderilmesini talep etme</li>
          </ul>
        </CardContent>
      </Card>

      <KvkkPanel employeesCount={employeesCount ?? 0} />
    </div>
  )
}
