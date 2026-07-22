'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@hrms/db/client'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@hrms/ui'

const schema = z.object({
  email: z.string().email('Gecerli bir e-posta girin'),
  password: z.string().min(1, 'Sifre gerekli'),
})

type Form = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
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
      const { error: err } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (err) throw err

      const next = params.get('next') ?? '/employees'
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giris basarisisiz')
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Oturum Ac</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {busy ? 'Giris yapiliyor...' : 'Giris Yap'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Hesabiniz yok mu?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sirket kaydi olusturun
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Yukleniyor...</div>}>
      <LoginForm />
    </Suspense>
  )
}
