import { redirect } from 'next/navigation'
import { createClient } from '@hrms/db/server'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard/employees')
  redirect('/auth/login')
}
