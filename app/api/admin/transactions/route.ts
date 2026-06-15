import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/requireAdmin'
import { activateTransaction } from '@/lib/activatePlan'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — list every transaction, newest first, with the buyer's email attached.
// Admin only.
export async function GET() {
  try {
    const gate = await requireAdmin()
    if (gate instanceof Response) return gate

    const { data: txns, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error

    // Attach emails. We map user_id -> email via auth admin listing.
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
    const emailById = new Map<string, string>()
    authData?.users.forEach(u => { if (u.id) emailById.set(u.id, u.email || '') })

    const rows = (txns || []).map(t => ({
      ...t,
      email: t.user_id ? (emailById.get(t.user_id) || 'unknown') : 'unknown',
    }))

    return NextResponse.json({ transactions: rows }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — admin actions on a transaction. Admin only.
//   { action: 'approve', txn_id }  → activate the plan/wallet (same as webhook)
export async function POST(req: Request) {
  try {
    const gate = await requireAdmin()
    if (gate instanceof Response) return gate

    const { action, txn_id } = await req.json()
    if (!txn_id) {
      return NextResponse.json({ error: 'Missing txn_id' }, { status: 400 })
    }

    if (action === 'approve') {
      const result = await activateTransaction(txn_id)
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, detail: result.detail, alreadyDone: result.alreadyDone || false }, { status: 200 })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}