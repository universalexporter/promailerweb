import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ──────────────────────────────────────────────────────────────────────────
// SERVER-SIDE ROUTE PROTECTION
//
// This runs on Vercel's edge BEFORE the page is sent to the browser, so a
// non-admin can never load /support-desk at all — not by typing the URL, not
// by any client trick. This is the real lock; the client-side check in the
// page is now just a fast UX redirect on top of it.
//
// Protects:  /support-desk  (admin/support only)
//            /dashboard     (any logged-in user)
// ──────────────────────────────────────────────────────────────────────────

const ADMIN_PATHS = ['/support-desk']
const USER_PATHS = ['/dashboard']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdminPath = ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isUserPath = USER_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isAdminPath && !isUserPath) return NextResponse.next()

  // Prepare a response we can attach refreshed auth cookies to.
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // getUser() verifies the JWT with Supabase (more trustworthy than getSession).
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → send to login for ANY protected path.
  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Admin paths require an admin/support role, checked server-side.
  if (isAdminPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    if (role !== 'admin' && role !== 'support') {
      // Logged in but not authorized → bounce to their normal dashboard.
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return res
}

// Only run middleware on the protected routes (keeps it fast).
export const config = {
  matcher: ['/support-desk', '/support-desk/:path*', '/dashboard', '/dashboard/:path*'],
}