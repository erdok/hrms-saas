'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@hrms/ui'
import { createClient } from '@hrms/db/client'
import { useState } from 'react'

export function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut} disabled={busy}>
      <LogOut className="h-4 w-4" />
      <span className="sr-only">Cikis</span>
    </Button>
  )
}
