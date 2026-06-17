import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { domainName } = body

    if (!domainName) {
      return NextResponse.json({ error: 'Missing domain name.' }, { status: 400 })
    }

    // 1. Authenticate via the logged-in session (secure) — no client-passed key.
    //    This is what fixes the "Unauthorized. Please log in again" error: we no
    //    longer rely on a stale apiKey/userId from the browser; we trust the
    //    signed Supabase session cookie instead.
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: please sign in again.' }, { status: 401 })
    }
    const userId = user.id

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