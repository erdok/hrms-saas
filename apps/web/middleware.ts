import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/onboarding', '/auth/login', '/auth/signup', '/api/auth/callback']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next()
  }

  let res = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
            res = NextResponse.next({ request })
            res.cookies.set(name, value)
          })
        },
      },
    },
  )

  await supabase.auth.getSession()

  if (isPublic(pathname)) {
    return res
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|images|opengraph-image).*)'],
}
