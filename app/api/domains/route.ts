import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { apiKey, domainName, userId } = body

    if (!apiKey || !domainName || !userId) {
      return NextResponse.json({ error: 'Missing API Key, Domain Name, or User ID' }, { status: 400 })
    }

    // 1. Authenticate the Client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (profileError || !profile || profile.id !== userId) {
      return NextResponse.json({ error: 'Invalid API Key or Identity mismatch' }, { status: 401 })
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

    // --- THIS IS THE FIX ---
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

    // 4. Save the pending domain and the COMPLETE DNS records to your database
    const { error: dbError } = await supabaseAdmin
      .from('client_domains')
      .insert({
        user_id: profile.id,
        domain_name: domainName,
        resend_domain_id: resendData.id,
        status: 'pending',
        dns_records: completeRecords // Saving the 4 records to Supabase here!
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