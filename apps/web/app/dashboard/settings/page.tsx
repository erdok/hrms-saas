import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@hrms/ui'
import { CreditCard, ScrollText, Shield } from 'lucide-react'
import { requireSession } from '@/lib/auth'

const SECTIONS = [
  {
    href: '/dashboard/settings/billing',
    icon: CreditCard,
    title: 'Abonelik & Faturalandirma',
    desc: 'Plan, limit, Stripe portal, fatura listesi.',
  },
  {
    href: '/dashboard/settings/audit',
    icon: ScrollText,
    title: 'Denetim Kayitlari',
    desc: 'Tum veri degisiklikleri KVKK Madde 12 geregi.',
  },
  {
    href: '/dashboard/settings/kvkk',
    icon: Shield,
    title: 'KVKK & Veri Koruma',
    desc: 'Aydinlatma metni, veri ihraci, silme talebi.',
  },
]

export default async function SettingsPage() {
  const session = await requireSession()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{session.company.name}</span> -
          rol: <span className="ml-1 inline-flex rounded bg-muted px-2 py-0.5 text-xs font-mono">{session.profile.role}</span>
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.href} href={s.href}>
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <Icon className="mb-2 h-6 w-6 text-primary" />
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <CardDescription>{s.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
