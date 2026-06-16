import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/requireAdmin'

// We use the SERVICE_ROLE_KEY here to act as God-Mode and bypass RLS.
// Because this bypasses RLS, EVERY function here MUST verify admin first.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    // ADMIN ONLY — this returns every user's email, API key and balance.
    const gate = await requireAdmin()
    if (gate instanceof Response) return gate

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) throw authError

    const { data: profiles } = await supabaseAdmin.from('profiles').select('*')
    const { data: wallets } = await supabaseAdmin.from('wallets').select('*')
    const { data: domains } = await supabaseAdmin.from('client_domains').select('*')

    const masterList = authData.users.map(user => {
      const profile = profiles?.find(p => p.id === user.id) || {}
      const wallet = wallets?.find(w => w.user_id === user.id) || { balance: 0 }
      const userDomains = (domains || []).filter(d => d.user_id === user.id)

      return {
        id: user.id,
        email: user.email,
        role: profile.role || 'client',
        api_key: profile.api_key || 'Not Generated',
        balance: wallet.balance || 0,
        active_plan_id: profile.active_plan_id || null,
        plan_expires_at: profile.plan_expires_at || null,
        emails_sent: profile.emails_sent || 0,
        pays_enabled: profile.pays_enabled || false,
        pays_total_quota: profile.pays_total_quota || 0,
        pays_daily_cap: profile.pays_daily_cap || 0,
        pays_used_total: profile.pays_used_total || 0,
        pays_used_today: profile.pays_used_today || 0,
        pays_expires_at: profile.pays_expires_at || null,
        domains: userDomains.map(d => ({
          id: d.id,
          domain_name: d.domain_name,
          status: d.status,
          dns_records: d.dns_records || []
        }))
      }
    })

    return NextResponse.json({ clients: masterList }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // ADMIN ONLY — this changes a user's wallet balance.
    const gate = await requireAdmin()
    if (gate instanceof Response) return gate

    const { userId, newBalance } = await req.json()

    if (newBalance === undefined || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}