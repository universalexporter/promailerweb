import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// READ current pricing
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('system_pricing').select('*').order('price', { ascending: true })
    if (error) throw error
    return NextResponse.json({ pricing: data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// UPDATE pricing
export async function POST(req: Request) {
  try {
    const { updates } = await req.json() // Array of modified plan objects
    
    // Upsert the whole array
    const { error } = await supabaseAdmin.from('system_pricing').upsert(updates)
    
    if (error) throw error
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}