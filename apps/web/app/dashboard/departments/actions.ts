'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@hrms/db/server'
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@hrms/db/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth'

const schema = z.object({
  name: z.string().min(1, 'Departman adi gerekli').max(80),
  parentId: z.string().uuid().optional().nullable(),
})

export async function createDepartmentAction(formData: FormData) {
  const session = await requirePermission('create', 'departments')
  const supabase = createClient()

  const data = schema.parse({
    name: formData.get('name') as string,
    parentId: (formData.get('parentId') as string) || null,
  })

  await createDepartment(supabase, data.name, session.profile.company_id, data.parentId)
  revalidatePath('/employees')
  revalidatePath('/departments')
}

export async function updateDepartmentAction(id: string, formData: FormData) {
  await requirePermission('update', 'departments')
  const supabase = createClient()

  const data = schema.parse({
    name: formData.get('name') as string,
    parentId: (formData.get('parentId') as string) || null,
  })

  await updateDepartment(supabase, id, {
    name: data.name,
    parent_id: data.parentId ?? null,
  })
  revalidatePath('/departments')
  revalidatePath('/employees')
}

export async function deleteDepartmentAction(id: string) {
  await requirePermission('delete', 'departments')
  const supabase = createClient()
  await deleteDepartment(supabase, id)
  revalidatePath('/departments')
  revalidatePath('/employees')
}
