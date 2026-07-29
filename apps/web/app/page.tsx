import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()
  const all = cookieStore.getAll()
  const hasAuth = all.some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  if (hasAuth) redirect('/dashboard/employees')
  redirect('/auth/login')
}
