import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Routes that are accessible without authentication.
 */
const PUBLIC_ROUTES = ['/login', '/signup']

/**
 * Routes that authenticated users should be redirected away from
 * (e.g. don't show the login page to a logged-in user).
 */
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Refresh the session and get the current user
  const { supabaseResponse, user } = await updateSession(request)

  const isAuthenticated = !!user
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  // 2. Unauthenticated user trying to access a protected route → /login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // 3. Authenticated user trying to access /login or /signup → /dashboard
  if (isAuthenticated && isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // 4. Pass through — return the response with refreshed session cookies
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico   (favicon)
     * - public folder files (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
