import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@hrms/ui'

const FEATURES = [
  { title: 'Coklu Sirket', desc: 'Her sirket kendi tenanti, kendi kullanicilari.' },
  { title: 'Rol Bazli Erisim', desc: 'super_admin, company_admin, hr_manager, employee.' },
  { title: 'KVKK Uyumlu', desc: 'Audit log, veri sifreleme, erisim kontrolu.' },
  { title: 'Tip Guvenli', desc: 'TypeScript + Supabase generate edilmis tipler.' },
]

export default function LandingPage() {
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
