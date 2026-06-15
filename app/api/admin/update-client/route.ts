import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/requireAdmin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // ── SECURITY GATE ──────────────────────────────────────────────
    // Verify the caller is a logged-in admin/support user BEFORE doing
    // anything. Without this, anyone could POST here and change balances,
    // plans, emails or passwords. requireAdmin checks the role server-side.
    const gate = await requireAdmin()
    if (gate instanceof Response) return gate   // 401 / 403 — blocked
    // (gate.user is the authenticated admin if you ever want to log who acted)
    // ───────────────────────────────────────────────────────────────

    const { userId, action, value } = await req.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // 1. FINANCIAL ROUTING (Upsert Wallet Balance to prevent phantom rows)
    if (action === 'balance') {
      const { error } = await supabaseAdmin
        .from('wallets')
        .upsert(
          { user_id: userId, balance: parseFloat(value) },
          { onConflict: 'user_id' } // Forces Supabase to match the user or create a new row
        )

      if (error) throw error
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // 2. SUBSCRIPTION ROUTING (Update Plan & Start 30-Day Timer)
    if (action === 'plan') {
      const isRevoking = value === 'none'

      // Calculate exactly 30 days from this exact second
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          active_plan_id: isRevoking ? null : value,
          plan_expires_at: isRevoking ? null : expiresAt.toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // 3. SECURITY ROUTING (Update Identity)
    // Checking both formats to ensure backward compatibility
    if (action === 'email' || action === 'update_email') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { email: value })
      if (error) throw error
      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (action === 'password' || action === 'update_password') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: value })
      if (error) throw error
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Fallback Rejection
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })

  } catch (error: any) {
    console.error('Master Control Write Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}