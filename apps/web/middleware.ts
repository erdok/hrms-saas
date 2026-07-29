import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/onboarding', '/auth/login', '/auth/signup', '/callback', '/api/auth/callback']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function hasSessionCookie(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()
  return cookies.some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token') && c.value.length > 0)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next()
  }

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  if (!hasSessionCookie(request)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|images|opengraph-image).*)'],
}
