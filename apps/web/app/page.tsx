import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value.slice(0, 20)}...`).join(', ')
  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <h1>HRMS Test 2 - cookies()</h1>
      <p>Cookies: {allCookies || '(empty)'}</p>
      <p>URL: /</p>
    </div>
  )
}
