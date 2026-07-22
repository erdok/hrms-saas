'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@hrms/db/client'
import {
  createDepartment,
  createEmployee,
} from '@hrms/db/client'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
} from '@hrms/ui'
import { Check, CheckCircle, ChevronLeft, ChevronRight, Building, UserPlus, PartyPopper } from 'lucide-react'

const STEPS = [
  { icon: Building, title: 'Sirket Bilgileri', desc: 'Departman ve limit yonetimi.' },
  { icon: UserPlus, title: 'Ilk Personel', desc: 'Ekibin ilk uyesini ekleyin.' },
  { icon: PartyPopper, title: 'Baslayalim!', desc: 'Her sey hazir.' },
]

// Step 1: Add first department
const deptSchema = z.object({ name: z.string().min(1).max(80) })

// Step 2: Add first employee
const empSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  gender: z.enum(['K', 'E']),
  departmentId: z.string().uuid(),
  startDate: z.string().min(1),
  salary: z.coerce.number().nonnegative().optional(),
})

export default function OnboardingPage() {
  const router = useRouter()
  const locale = 'tr' as const
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [companyName, setCompanyName] = useState('')
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  // On mount / if we have no session, redirect
  // This is fine: just building the UI

  async function onStep0Submit(data: { name: string }) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, full_name')
      .eq('id', user.id)
      .single()
    if (!profile) return

    setCompanyName(data.name)

    const dept = await createDepartment(supabase, data.name, profile.company_id)
    setDepartments([{ id: dept.id, name: dept.name }])
    setSelectedDeptId(dept.id)
    setCompletedSteps((s) => {
      s.add(0)
      return new Set(s)
    })
    setStep(1)
    toast.success(`Departman "${data.name}" olusturuldu`)
  }

  async function onStep1Submit(data: z.infer<typeof empSchema>) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!profile) return

    await createEmployee(
      supabase,
      {
        first_name: data.firstName,
        last_name: data.lastName,
        gender: data.gender,
        department_id: data.departmentId,
        start_date: data.startDate,
        salary: data.salary ?? null,
        created_by: user.id,
      },
      profile.company_id,
    )

    setCompletedSteps((s) => {
      s.add(1)
      return new Set(s)
    })
    setStep(2)
    toast.success(`${data.firstName} ${data.lastName} eklendi`)
  }

  function finish() {
    startTransition(() => {
      router.push(`/${locale}`)
      router.refresh()
    })
  }

  const stepConfig = STEPS[step]
  if (!stepConfig) return null
  const Icon = stepConfig.icon
  const isLast = step === 2

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Icon className="mx-auto mb-3 h-10 w-10 text-primary" />
          <CardTitle className="text-xl">{stepConfig.title}</CardTitle>
          <CardDescription>{stepConfig.desc}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress dots */}
          <div className="mb-6 flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === step
                    ? 'bg-primary'
                    : completedSteps.has(i)
                      ? 'bg-emerald-500'
                      : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {step === 0 && <Step0Form onSubmit={onStep0Submit} isPending={isPending} />}
          {step === 1 && (
            <Step1Form
              onSubmit={onStep1Submit}
              isPending={isPending}
              departments={departments}
              defaultDeptId={selectedDeptId}
              onBack={() => setStep(0)}
            />
          )}
          {isLast && (
            <div className="space-y-4 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="text-sm text-muted-foreground">
                Departman ve ilk personel basariyla olusturuldu. Simdi tam sistem kullanima hazir.
              </p>
              <Button onClick={finish} className="w-full" disabled={isPending}>
                <PartyPopper className="h-4 w-4" />
                {isPending ? 'Yonlendiriliyor...' : 'Sisteme Gir'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Step0Form({
  onSubmit,
  isPending,
}: {
  onSubmit: (d: { name: string }) => void
  isPending: boolean
}) {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Ilk departman adi (orn: Yonetim)</Label>
        <Input id="name" {...register('name')} placeholder="Muhasebe" />
        {formState.errors.name && (
          <p className="text-sm text-destructive">{formState.errors.name.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        <ChevronRight className="h-4 w-4" />
        Devam
      </Button>
    </form>
  )
}

function Step1Form({
  onSubmit,
  isPending,
  departments,
  defaultDeptId,
  onBack,
}: {
  onSubmit: (d: z.infer<typeof empSchema>) => void
  isPending: boolean
  departments: { id: string; name: string }[]
  defaultDeptId: string
  onBack: () => void
}) {
  const { register, handleSubmit, formState } = useForm<z.infer<typeof empSchema>>({
    resolver: zodResolver(empSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: 'K',
      departmentId: defaultDeptId,
      startDate: new Date().toISOString().slice(0, 10),
      salary: undefined,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Ad</Label>
          <Input id="firstName" {...register('firstName')} />
          {formState.errors.firstName && (
            <p className="text-sm text-destructive">{formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Soyad</Label>
          <Input id="lastName" {...register('lastName')} />
          {formState.errors.lastName && (
            <p className="text-sm text-destructive">{formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="startDate">Ise Baslangic</Label>
        <Input id="startDate" type="date" {...register('startDate')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="salary">Maas (TL)</Label>
        <Input id="salary" type="number" min="0" {...register('salary')} placeholder="Opsiyonel" />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Geri
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          <Check className="h-4 w-4" />
          Personel Ekle
        </Button>
      </div>
    </form>
  )
}

export { z }
