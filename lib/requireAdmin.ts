// lib/requireAdmin.ts
//
// Server-side admin guard for /api/admin/* routes.
// Call this at the TOP of every admin API route. It verifies the caller's
// session AND that their profile role is admin/support — on the server, where
// it can't be faked. Returns the user on success, or a ready-to-return
// NextResponse 401/403 on failure.
//
// Usage in an admin route:
//
//   import { requireAdmin } from '@/lib/requireAdmin'
//   export async function POST(req: Request) {
//     const gate = await requireAdmin()
//     if (gate instanceof Response) return gate   // blocked
//     const { user } = gate                        // authorized admin
//     ...
//   }

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function requireAdmin() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* called from a route handler; safe to ignore */ }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: please sign in.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  if (role !== 'admin' && role !== 'support') {
    return NextResponse.json({ error: 'Forbidden: admin access required.' }, { status: 403 })
  }

  return { user, role, supabase }
}