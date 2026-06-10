import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { apiKey, domainName } = body

    if (!apiKey || !domainName) {
      return NextResponse.json({ error: 'Missing API Key or Domain Name' }, { status: 400 })
    }

    // 1. Authenticate the Client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 })
    }

    // 2. Request new DNS identity from Resend
    const resendResponse = await fetch('https://api.resend.com/domains', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: domainName
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend Domain Error:', resendData)
      return NextResponse.json({ error: 'Failed to register domain with Resend' }, { status: 502 })
    }

    // 3. Save the pending domain and DNS records to your database
    const { error: dbError } = await supabaseAdmin
      .from('client_domains')
      .insert({
        user_id: profile.id,
        domain_name: domainName,
        resend_domain_id: resendData.id,
        status: 'pending',
        dns_records: resendData.records
      })

    if (dbError) {
      console.error('Database Error:', dbError)
      return NextResponse.json({ error: 'Failed to save domain to ledger' }, { status: 500 })
    }

    // 4. Return the DNS records so the client dashboard can display them
    return NextResponse.json({
      success: true,
      domain: domainName,
      status: 'pending',
      records: resendData.records
    }, { status: 200 })

  } catch (error) {
    console.error('Domain Registration Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}