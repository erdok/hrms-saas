'use server'

import { revalidatePath } from 'next/cache'
import {
  createClient,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '@hrms/db/server'
import { requirePermission } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(80),
  content: z.string().min(1).max(50_000),
})

export async function saveTemplateAction(formData: FormData, id?: string) {
  const session = await requirePermission(id ? 'update' : 'create', 'templates')
  const supabase = createClient()
  const data = schema.parse({
    name: formData.get('name') as string,
    content: formData.get('content') as string,
  })
  if (id) {
    await updateTemplate(supabase, id, data)
  } else {
    await createTemplate(supabase, data.name, data.content, session.profile.company_id)
  }
  revalidatePath('/dashboard/templates')
}

export async function deleteTemplateAction(id: string) {
  await requirePermission('delete', 'templates')
  const supabase = createClient()
  await deleteTemplate(supabase, id)
  revalidatePath('/dashboard/templates')
}
