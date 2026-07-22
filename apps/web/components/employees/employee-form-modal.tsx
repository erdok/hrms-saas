'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  Textarea,
} from '@hrms/ui'
import { saveEmployeeAction } from '@/app/(dashboard)/employees/actions'

export interface DepartmentOption {
  id: string
  name: string
  parentName?: string | null
}

export interface EmployeeModalProps {
  trigger: React.ReactNode
  departments: DepartmentOption[]
  employee?: EmployeeFormValues & { id: string }
}

const schema = z.object({
  firstName: z.string().min(1, 'Ad gerekli').max(60),
  lastName: z.string().min(1, 'Soyad gerekli').max(60),
  tcKimlik: z
    .string()
    .regex(/^\d{11}$/, 'TC 11 haneli olmali')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['K', 'E']),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  startDate: z.string().min(1, 'Baslangic tarihi gerekli'),
  contractEnd: z.string().optional().or(z.literal('')),
  address: z.string().max(240).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Gecerli e-posta degil').optional().or(z.literal('')),
  salary: z.coerce.number().nonnegative().optional().or(z.literal('')),
  totalLeaveDays: z.coerce.number().int().min(0).max(365).default(14),
})

export type EmployeeFormValues = z.infer<typeof schema>

export function EmployeeFormModal({
  trigger,
  departments,
  employee,
}: EmployeeModalProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEdit = !!employee

  const defaultValues: EmployeeFormValues = employee
    ? {
        firstName: employee.firstName,
        lastName: employee.lastName,
        tcKimlik: '',
        gender: employee.gender,
        departmentId: employee.departmentId || '',
        startDate: employee.startDate,
        contractEnd: employee.contractEnd || '',
        address: employee.address || '',
        phone: employee.phone || '',
        email: employee.email || '',
        salary: employee.salary ?? '',
        totalLeaveDays: employee.totalLeaveDays ?? 14,
      }
    : {
        firstName: '',
        lastName: '',
        tcKimlik: '',
        gender: 'K',
        departmentId: '',
        startDate: '',
        contractEnd: '',
        address: '',
        phone: '',
        email: '',
        salary: '',
        totalLeaveDays: 14,
      }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      reset(defaultValues)
      setServerError(null)
    }
  }

  async function onSubmit(values: EmployeeFormValues) {
    setServerError(null)
    const payload = {
      ...values,
      tcKimlik: values.tcKimlik || undefined,
      contractEnd: values.contractEnd || undefined,
      address: values.address || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      salary: typeof values.salary === 'number' ? values.salary : undefined,
      departmentId: values.departmentId || undefined,
    }

    startTransition(async () => {
      try {
        await saveEmployeeAction(payload, employee?.id ?? null)
        setOpen(false)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Kayit basarisiz'
        setServerError(msg)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Personel Duzenle' : 'Yeni Personel'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Personel bilgilerini guncelleyin.'
              : 'Yeni bir personel kaydi olusturun.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="firstName">Ad</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Soyad</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="tcKimlik">TC Kimlik</Label>
              <Input id="tcKimlik" inputMode="numeric" maxLength={11} {...register('tcKimlik')} />
              {errors.tcKimlik && (
                <p className="text-sm text-destructive">{errors.tcKimlik.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Cinsiyet</Label>
              <Select id="gender" {...register('gender')}>
                <option value="K">Kadin</option>
                <option value="E">Erkek</option>
              </Select>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="departmentId">Departman</Label>
              <Select id="departmentId" {...register('departmentId')}>
                <option value="">Departman seciniz</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.parentName ? `${d.parentName} / ${d.name}` : d.name}
                  </option>
                ))}
              </Select>
              {errors.departmentId && (
                <p className="text-sm text-destructive">{errors.departmentId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Ise Baslangic</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contractEnd">Sozlesme Bitis</Label>
              <Input id="contractEnd" type="date" {...register('contractEnd')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" {...register('phone')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salary">Maas (TL)</Label>
              <Input id="salary" type="number" min="0" step="0.01" {...register('salary')} />
              {errors.salary && (
                <p className="text-sm text-destructive">{errors.salary.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalLeaveDays">Yillik Izin (gun)</Label>
              <Input
                id="totalLeaveDays"
                type="number"
                min="0"
                max="365"
                {...register('totalLeaveDays')}
              />
              {errors.totalLeaveDays && (
                <p className="text-sm text-destructive">{errors.totalLeaveDays.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Adres</Label>
            <Textarea id="address" rows={2} {...register('address')} />
          </div>

          {serverError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Iptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : isEdit ? 'Guncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
