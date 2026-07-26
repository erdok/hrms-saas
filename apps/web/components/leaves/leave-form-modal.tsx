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
import {
  createLeaveAction,
  type LeaveActionResult,
} from '@/app/(dashboard)/leaves/actions'

export interface EmployeeOption {
  id: string
  full_name: string | null
  department_name?: string | null
}

const schema = z.object({
  employeeId: z.string().uuid('Personel secin'),
  type: z.enum(['Yillik', 'Mazeret', 'Hastalik', 'Ucretsiz']),
  startDate: z.string().min(1, 'Baslangic tarihi gerekli'),
  endDate: z.string().min(1, 'Bitis tarihi gerekli'),
  note: z.string().max(500).optional(),
})

type Form = z.infer<typeof schema>

export function LeaveFormModal({
  trigger,
  employees,
}: {
  trigger: React.ReactNode
  employees: EmployeeOption[]
}) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<LeaveActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: '',
      type: 'Yillik',
      startDate: '',
      endDate: '',
      note: '',
    },
  })

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      reset()
      setResult(null)
    }
  }

  async function onSubmit(values: Form) {
    setResult(null)
    startTransition(async () => {
      const r = await createLeaveAction(values)
      if (r.kind === 'ok') {
        setOpen(false)
      } else {
        setResult(r)
      }
    })
  }

  // Auto-fill end = start when not set (most leaves are 1 day)
  const startDateVal = watch('startDate')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Izin Talebi</DialogTitle>
          <DialogDescription>
            Talep varsayilan olarak bekleyen durumundadir. Yoneticiniz onaylayacaktir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="employeeId">Personel</Label>
            <Select id="employeeId" {...register('employeeId')}>
              <option value="">Personel seciniz...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                  {e.department_name ? ` - ${e.department_name}` : ''}
                </option>
              ))}
            </Select>
            {errors.employeeId && (
              <p className="text-sm text-destructive">{errors.employeeId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="type">Izin Turu</Label>
              <Select id="type" {...register('type')}>
                <option value="Yillik">Yillik</option>
                <option value="Mazeret">Mazeret</option>
                <option value="Hastalik">Hastalik</option>
                <option value="Ucretsiz">Ucretsiz</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Baslangic</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                onBlur={(e) => {
                  const v = e.target.value
                  const endInput = document.getElementById('endDate') as HTMLInputElement
                  if (endInput && !endInput.value) endInput.value = v
                }}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endDate">Bitis</Label>
            <Input id="endDate" type="date" min={startDateVal} {...register('endDate')} />
            {errors.endDate && (
              <p className="text-sm text-destructive">{errors.endDate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Aciklama (opsiyonel)</Label>
            <Textarea id="note" rows={2} {...register('note')} />
          </div>

          {result?.kind === 'overlap' && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium">Tarih cakismasi tespit edildi:</p>
              <ul className="mt-1 list-disc pl-5">
                {(result.overlaps as Array<{ type: string; start_date: string; end_date: string; days: number }> ).map((o, i) => (
                  <li key={i}>
                    {o.type} - {o.start_date} / {o.end_date} ({o.days} gun)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result?.kind === 'error' && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {result.message}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Iptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Kaydediliyor...' : 'Talep Gonder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
