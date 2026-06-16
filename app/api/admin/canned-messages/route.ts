import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/requireAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — list all canned messages (admin/support only)
export async function GET() {
  const gate = await requireAdmin()
  if (gate instanceof Response) return gate
  try {
    const { data, error } = await supabaseAdmin
      .from('canned_messages')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) throw error
    return NextResponse.json({ messages: data || [] }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST — create, update, or delete a canned message
//   { action: 'create', category, title, body }
//   { action: 'update', id, category, title, body }
//   { action: 'delete', id }
export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (gate instanceof Response) return gate
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'create') {
      const { error } = await supabaseAdmin.from('canned_messages').insert({
        category: body.category || 'General',
        title: body.title || 'Untitled',
        body: body.body || '',
        sort_order: Number(body.sort_order) || 0
      })
      if (error) throw error
      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (action === 'update') {
      if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const { error } = await supabaseAdmin.from('canned_messages').update({
        category: body.category,
        title: body.title,
        body: body.body
      }).eq('id', body.id)
      if (error) throw error
      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (action === 'delete') {
      if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const { error } = await supabaseAdmin.from('canned_messages').delete().eq('id', body.id)
      if (error) throw error
      return NextResponse.json({ success: true }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}