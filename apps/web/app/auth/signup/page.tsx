'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@hrms/db/client'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@hrms/ui'

const schema = z
  .object({
    companyName: z.string().min(2, 'Sirket adi en az 2 karakter'),
    companySlug: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[a-z0-9-]+$/, 'Kucuk harf, rakam, tire'),
    fullName: z.string().min(2, 'Ad Soyad gerekli'),
    email: z.string().email('Gecerli bir e-posta girin'),
    password: z.string().min(8, 'Sifre en az 8 karakter'),
  })

type Form = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { register, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: Form) {
    setError(null)
    setBusy(true)
    try {
      const supabase = createClient()

      // 1) Auth kullaniciyi olustur
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.fullName } },
      })

      if (authErr) throw authErr
      if (!authData.user) throw new Error('Kullanici olusturulamadi')

      // 2) Sirket + profile'i tek transaction'da olusturan RPC
      const { error: rpcErr } = await supabase.rpc('sign_up_company', {
        p_company_name: data.companyName,
        p_company_slug: data.companySlug,
        p_full_name: data.fullName,
      })

      if (rpcErr) throw rpcErr

      router.push('/onboarding')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kayit basarisiz'
      setError(msg)
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Yeni Sirket Kaydi</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Sirket Adi</Label>
            <Input id="companyName" {...register('companyName')} />
            {formState.errors.companyName && (
              <p className="text-sm text-destructive">
                {formState.errors.companyName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="companySlug">Subdomain (slug)</Label>
            <Input id="companySlug" placeholder="acme" {...register('companySlug')} />
            {formState.errors.companySlug && (
              <p className="text-sm text-destructive">
                {formState.errors.companySlug.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input id="fullName" {...register('fullName')} />
            {formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" {...register('email')} />
            {formState.errors.email && (
              <p className="text-sm text-destructive">
                {formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Sifre</Label>
            <Input id="password" type="password" {...register('password')} />
            {formState.errors.password && (
              <p className="text-sm text-destructive">
                {formState.errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Kaydediliyor...' : 'Kayit Ol'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabiniz var?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Oturum acin
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

