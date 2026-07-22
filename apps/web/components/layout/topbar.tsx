import { createClient } from '@hrms/db/server'
import { User as UserIcon } from 'lucide-react'
import { SignOutButton } from './sign-out-button'
import { ThemeSwitcher } from '@/components/layout/theme-switcher'
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown'

export async function Topbar() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('full_name, role, email')
        .eq('id', user.id)
        .single()
    : { data: null }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
      <div className="mr-auto text-sm text-muted-foreground">
        {profile ? (
          <span>
            {profile.full_name} &middot; <span className="text-foreground">{profile.role}</span>
          </span>
        ) : (
          ' - '
        )}
      </div>
      <div className="flex items-center gap-3">
        <ThemeSwitcher />`n        <NotificationsDropdown />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserIcon className="h-4 w-4" />
          {profile?.email ?? ''}
        </div>
        <SignOutButton />
      </div>
    </header>
  )
}

