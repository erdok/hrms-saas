import { z } from 'zod'

export const GenderSchema = z.enum(['K', 'E'])
export type Gender = z.infer<typeof GenderSchema>

export const LeaveTypeSchema = z.enum([
  'Yillik',
  'Mazeret',
  'Hastalik',
  'Ucretsiz',
])
export type LeaveType = z.infer<typeof LeaveTypeSchema>

export const LeaveStatusSchema = z.enum(['pending', 'approved', 'rejected'])
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>

export const EmployeeStatusSchema = z.enum(['active', 'passive'])
export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>

export const PlanSchema = z.enum(['free', 'pro', 'enterprise'])
export type Plan = z.infer<typeof PlanSchema>

/** ISO date string (YYYY-MM-DD) */
const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD formatinda olmali')

export const CompanyCreateSchema = z.object({
  name: z.string().min(2, 'Sirket adi en az 2 karakter').max(120),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Slug yalnizca kucuk harf, rakam ve tire icerebilir'),
})

export const ProfileCreateSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(['super_admin', 'company_admin', 'hr_manager', 'employee']),
})

export const DepartmentCreateSchema = z.object({
  name: z.string().min(1).max(80),
  parentId: z.string().uuid().nullable().optional(),
})

export const EmployeeCreateSchema = z.object({
  tcKimlik: z
    .string()
    .regex(/^\d{11}$/, 'TC 11 haneli olmali')
    .optional()
    .nullable(),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  gender: GenderSchema,
  departmentId: z.string().uuid().nullable().optional(),
  startDate: dateStr,
  contractEnd: dateStr.nullable().optional(),
  address: z.string().max(240).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().nullable().optional(),
  salary: z.number().nonnegative().optional(),
  totalLeaveDays: z.number().int().min(0).max(365).default(14),
})

export const LeaveCreateSchema = z
  .object({
    employeeId: z.string().uuid(),
    type: LeaveTypeSchema,
    startDate: dateStr,
    endDate: dateStr,
    note: z.string().max(500).optional(),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'Bitis tarihi baslangictan once olamaz',
    path: ['endDate'],
  })

export const AttendanceUpdateSchema = z.object({
  employeeId: z.string().uuid(),
  monthDate: dateStr, // YYYY-MM-01
  dayStatus: z.array(z.number().int().min(0).max(255)).length(31),
})
