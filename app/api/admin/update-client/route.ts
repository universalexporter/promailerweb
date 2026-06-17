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
          plan_expires_at: isRevoking ? null : expiresAt.toISOString(),
          pays_enabled: false  // a real plan replaces the Test package
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

    // 4. PAY-AS-YOU-SEND — set or clear a manual email package.
    // value is a JSON string: { enabled, total_quota, daily_cap, days }
    if (action === 'pays') {
      let cfg: any = {}
      try { cfg = typeof value === 'string' ? JSON.parse(value) : (value || {}) } catch { cfg = {} }

      if (cfg.enabled === false) {
        // turn PAYS off (keeps counters but disables sending via PAYS)
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ pays_enabled: false })
          .eq('id', userId)
        if (error) throw error
        return NextResponse.json({ success: true, pays: 'disabled' }, { status: 200 })
      }

      const totalQuota = Math.max(0, Number(cfg.total_quota) || 0)
      const dailyCap = Math.max(0, Number(cfg.daily_cap) || 0)
      const days = Number(cfg.days)
      let expiresAt: string | null = null
      if (days && days > 0) {
        const d = new Date()
        d.setDate(d.getDate() + days)
        expiresAt = d.toISOString()
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          pays_enabled: true,
          pays_total_quota: totalQuota,
          pays_daily_cap: dailyCap,
          pays_used_total: 0,        // fresh package resets usage
          pays_used_today: 0,
          pays_today_date: new Date().toISOString().slice(0, 10),
          pays_expires_at: expiresAt, // null = no expiry
          active_plan_id: 'test',     // desktop app reads plan via active_plan_id
          plan_expires_at: expiresAt,
          emails_sent: 0              // reset usage counter the desktop reads
        })
        .eq('id', userId)
      if (error) throw error

      // Mirror the quota into the shared 'test' pricing row so the desktop app —
      // which looks up email_limit by active_plan_id — sees the correct allowance.
      await supabaseAdmin
        .from('system_pricing')
        .upsert({ id: 'test', name: 'Test Plan', price: 0, email_limit: totalQuota, overage_cost: 0, features: [] })

      return NextResponse.json({ success: true, pays: 'enabled' }, { status: 200 })
    }

    // 5. FULL DELETE — wipes the user from Supabase Auth AND their data.
    // Deleting the auth user is the key step; related rows are best-effort
    // cleaned first so nothing is orphaned.
    if (action === 'delete') {
      // best-effort cleanup of related data (ignore individual failures)
      const tables = ['transactions', 'wallets', 'client_domains', 'support_messages', 'support_tickets', 'campaigns', 'contacts', 'contact_lists']
      for (const tbl of tables) {
        const col = (tbl === 'wallets') ? 'user_id' : 'user_id'
        try { await supabaseAdmin.from(tbl).delete().eq(col, userId) } catch { /* ignore */ }
      }
      // profile row
      try { await supabaseAdmin.from('profiles').delete().eq('id', userId) } catch { /* ignore */ }
      // finally the auth user itself
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error
      return NextResponse.json({ success: true, deleted: true }, { status: 200 })
    }

    // Fallback Rejection
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })

  } catch (error: any) {
    console.error('Master Control Write Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}