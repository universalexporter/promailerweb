import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/requireAdmin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// READ current pricing — PUBLIC on purpose.
// The client dashboard calls this to show plan tiers to every signed-in user,
// so it must NOT be locked to admins. It only exposes prices, never secrets.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('system_pricing').select('*').order('price', { ascending: true })
    if (error) throw error
    return NextResponse.json({ pricing: data || [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// UPDATE pricing — ADMIN ONLY.
// Changing prices is a privileged action, so we gate it server-side.
export async function POST(req: Request) {
  try {
    const gate = await requireAdmin()
    if (gate instanceof Response) return gate   // 401 / 403 — blocked

    const { updates } = await req.json()

    const { error } = await supabaseAdmin.from('system_pricing').upsert(updates)

    if (error) throw error
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}