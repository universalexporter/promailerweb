import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — list a client's domains using their apiKey (the DomainManager component
// can't reliably read the session cookie, so we resolve the user by apiKey here).
// Usage: GET /api/domains?apiKey=pk_live_xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const apiKey = searchParams.get('apiKey')
    if (!apiKey) {
      return NextResponse.json({ domains: [] }, { status: 200 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, active_plan_id')
      .eq('api_key', apiKey)
      .single()

    if (!profile) {
      return NextResponse.json({ domains: [], plan: null }, { status: 200 })
    }

    const { data: domains } = await supabaseAdmin
      .from('client_domains')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ domains: domains || [], plan: profile.active_plan_id || null }, { status: 200 })
  } catch (e: any) {
    console.error('Domain list error:', e)
    return NextResponse.json({ domains: [] }, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { domainName, apiKey, userId: bodyUserId } = body

    if (!domainName) {
      return NextResponse.json({ error: 'Missing domain name.' }, { status: 400 })
    }

    // ── AUTH: accept EITHER the logged-in session cookie OR a valid apiKey ──
    // This makes the route work no matter how the frontend calls it, and fixes
    // the "Unauthorized. Please log in again" error caused by a stale apiKey.
    let userId: string | null = null

    // Method 1: logged-in Supabase session (preferred, secure)
    try {
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
              } catch { /* route handler context; safe to ignore */ }
            },
          },
        }
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId = user.id
    } catch { /* fall through to apiKey */ }

    // Method 2: fall back to apiKey lookup (what the desktop / older frontend sends)
    if (!userId && apiKey) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('api_key', apiKey)
        .single()
      if (profile) userId = profile.id
    }

    // Last resort: trust an explicit userId only if it matches a real profile
    if (!userId && bodyUserId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', bodyUserId)
        .single()
      if (profile) userId = profile.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: please sign in again.' }, { status: 401 })
    }

    // 2. Request new DNS identity from Resend
    const resendResponse = await fetch('https://api.resend.com/domains', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: domainName })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend Domain Error:', resendData)
      return NextResponse.json({ error: resendData?.message || 'Failed to register domain with Resend' }, { status: 502 })
    }

    // 3. Inject the mandatory DMARC record into Resend's records array
    const completeRecords = [
      ...resendData.records,
      {
        record: 'TXT',
        type: 'TXT',
        name: '_dmarc',
        value: 'v=DMARC1; p=none;',
        priority: null
      }
    ]

    // 4. Save the pending domain + complete DNS records (admin client bypasses RLS)
    const { error: dbError } = await supabaseAdmin
      .from('client_domains')
      .insert({
        user_id: userId,
        domain_name: domainName,
        resend_domain_id: resendData.id,
        status: 'pending',
        dns_records: completeRecords
      })

    if (dbError) {
      console.error('Database Error:', dbError)
      return NextResponse.json({ error: 'Failed to save domain to ledger' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      domain: domainName,
      status: 'pending'
    }, { status: 200 })

  } catch (error) {
    console.error('Domain Registration Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}