import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types-generated'

export type TemplateRow = Database['public']['Tables']['templates']['Row']
export type TemplateInsert = Database['public']['Tables']['templates']['Insert']

export type DocumentRow = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']

/** List all templates in the current tenant. */
export async function listTemplates(
  supabase: SupabaseClient<Database>,
): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getTemplate(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<TemplateRow | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createTemplate(
  supabase: SupabaseClient<Database>,
  name: string,
  content: string,
  companyId: string,
): Promise<TemplateRow> {
  const payload: TemplateInsert = { name, content, company_id: companyId }
  const { data, error } = await supabase
    .from('templates')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTemplate(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: { name?: string; content?: string },
): Promise<TemplateRow> {
  const { data, error } = await supabase
    .from('templates')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTemplate(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', id)
  if (error) throw error
}

/** Renders a template for an employee server-side via RPC. */
export async function renderTemplate(
  supabase: SupabaseClient<Database>,
  templateId: string,
  employeeId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('render_template', {
    p_template_id: templateId,
    p_employee_id: employeeId,
  })
  if (error) throw error
  return data as unknown as string
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function listDocuments(
  supabase: SupabaseClient<Database>,
): Promise<(DocumentRow & { employee_name?: string; template_name?: string })[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*, employee:employees(full_name), template:templates(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((d) => ({
    ...d,
    employee_name: Array.isArray(d.employee) ? d.employee[0]?.full_name : (d.employee as { full_name?: string })?.full_name,
    template_name: Array.isArray(d.template) ? d.template[0]?.name : (d.template as { name?: string })?.name,
  }))
}

export async function createDocument(
  supabase: SupabaseClient<Database>,
  input: Omit<DocumentInsert, 'company_id'>,
  companyId: string,
): Promise<DocumentRow> {
  const payload: DocumentInsert = { ...input, company_id: companyId }
  const { data, error } = await supabase
    .from('documents')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDocument(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: Partial<DocumentInsert>,
): Promise<DocumentRow> {
  const { data, error } = await supabase
    .from('documents')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDocument(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}

/** Replace {{tokens}} on the client (for preview purposes). */
export const TEMPLATE_TOKENS = [
  'name',
  'firstName',
  'lastName',
  'tcKimlik',
  'gender',
  'departmentName',
  'startDate',
  'contractEnd',
  'address',
  'phone',
  'email',
  'salary',
  'totalLeaveDays',
  'currentDate',
  'currentDateLong',
] as const
