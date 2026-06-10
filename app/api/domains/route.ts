import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Notice we receive domainId (which is the Resend ID) and supabaseRecordId from the frontend
    const { apiKey, domainId, supabaseRecordId } = body

    if (!apiKey || !domainId || !supabaseRecordId) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 })
    }

    // 1. Authenticate the Client via your Database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 })
    }

    // 2. Trigger the Verification inside Resend
    // This tells Resend to look at the DNS records right now.
    const verifyResponse = await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, // Using your Master Resend Key
        'Content-Type': 'application/json'
      }
    })

    if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        console.error('Resend Verify Trigger Error:', errorData)
        return NextResponse.json({ error: errorData.message || 'Failed to trigger verification with Resend.' }, { status: verifyResponse.status })
    }

    // 3. Optional but highly recommended: Fetch the updated status from Resend immediately after triggering
    const statusResponse = await fetch(`https://api.resend.com/domains/${domainId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
    })

    let updatedStatus = 'pending_verification' // default fallback
    if (statusResponse.ok) {
        const domainData = await statusResponse.json()
        // Resend returns statuses like 'pending', 'verified', 'failed'
        updatedStatus = domainData.status === 'verified' ? 'verified' : 'pending_verification'
    }

    // 4. Update the local Supabase Database so the client UI reacts
    const { error: dbError } = await supabaseAdmin
      .from('client_domains')
      .update({ status: updatedStatus })
      .eq('id', supabaseRecordId)
      .eq('user_id', profile.id) // Extra security check

    if (dbError) {
      console.error('Database Error:', dbError)
      return NextResponse.json({ error: 'Failed to update domain status in ledger.' }, { status: 500 })
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Verification triggered successfully.',
        status: updatedStatus 
    }, { status: 200 })

  } catch (error) {
    console.error('Domain Verification Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}