import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// We use the SERVICE_ROLE_KEY here to act as God-Mode and bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) throw authError

    const { data: profiles } = await supabaseAdmin.from('profiles').select('*')
    const { data: wallets } = await supabaseAdmin.from('wallets').select('*')

    const masterList = authData.users.map(user => {
      const profile = profiles?.find(p => p.id === user.id) || {}
      const wallet = wallets?.find(w => w.user_id === user.id) || { balance: 0 }
      
      return {
        id: user.id,
        email: user.email,
        role: profile.role || 'client',
        api_key: profile.api_key || 'Not Generated',
        balance: wallet.balance || 0
      }
    })

    return NextResponse.json({ clients: masterList }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
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