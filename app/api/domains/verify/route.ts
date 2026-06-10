import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import dns from 'dns'
import { promisify } from 'util'

const resolveTxt = promisify(dns.resolveTxt)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { domainId } = await req.json()

    if (!domainId) {
      return NextResponse.json({ error: 'Missing target domain ID' }, { status: 400 })
    }

    // 1. Fetch the domain and its target records from Supabase
    const { data: domainData, error: dbError } = await supabaseAdmin
      .from('client_domains')
      .select('*')
      .eq('id', domainId)
      .single()

    if (dbError || !domainData) {
      return NextResponse.json({ error: 'Domain profile not found in ledger.' }, { status: 404 })
    }

    const domainName = domainData.domain_name

    // --- NEW SMART SYNC: Check Resend's Live Status First ---
    if (domainData.resend_domain_id) {
      try {
        // 1a. Ask Resend what the real-time status is right now
        const statusCheck = await fetch(`https://api.resend.com/domains/${domainData.resend_domain_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })

        if (statusCheck.ok) {
          const resendStatusData = await statusCheck.json()
          
          // If Resend confirms it's verified, sync to Supabase immediately and finish!
          if (resendStatusData.status === 'verified') {
            await supabaseAdmin
              .from('client_domains')
              .update({ status: 'active' })
              .eq('id', domainId)
              
            return NextResponse.json({ 
              success: true, 
              status: 'active', 
              message: 'Network Linked! Resend has fully verified your domain.' 
            })
          }
        }

        // 1b. If not verified yet, trigger Resend's verification crawler engine to look again
        await fetch(`https://api.resend.com/domains/${domainData.resend_domain_id}/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })

      } catch (e) {
        console.log(`Resend verification engine sync fallback for ${domainName}`, e)
      }
    }
    // --------------------------------------------------------

    // We search the generated records array for the required types
    const expectedDkim = domainData.dns_records.find((r: any) => r.type === 'TXT' && r.name.includes('dkim'))?.value
    const expectedSpf = domainData.dns_records.find((r: any) => r.type === 'TXT' && r.name === '@')?.value

    let dkimVerified = false
    let spfVerified = false

    // 2. Query Global DNS Servers for DKIM
    try {
      const dkimHost = `resend._domainkey.${domainName}`
      const txtRecords = await resolveTxt(dkimHost)
      const flatRecords = txtRecords.flatMap(record => record.join(''))
      
      if (flatRecords.some(r => r.includes(expectedDkim) || r === expectedDkim)) {
        dkimVerified = true
      }
    } catch (e) {
      console.log(`DKIM lookup propagation pending for ${domainName}`)
    }

    // 3. Query Global DNS Servers for SPF
    try {
      const txtRecords = await resolveTxt(domainName)
      const flatRecords = txtRecords.flatMap(record => record.join(''))
      
      if (flatRecords.some(r => r.includes('v=spf1') && (r.includes(expectedSpf) || r === expectedSpf))) {
        spfVerified = true
      }
    } catch (e) {
      console.log(`SPF lookup propagation pending for ${domainName}`)
    }

    // 4. Update Database State based on local verified checkpoints fallback
    if (dkimVerified && spfVerified) {
      await supabaseAdmin
        .from('client_domains')
        .update({ status: 'active' })
        .eq('id', domainId)

      return NextResponse.json({ 
        success: true, 
        status: 'active', 
        message: 'Network Linked! All architectural checkpoints verified.' 
      })
    }

    // If still propagating, set status to pending_verification so the UI shows it's working
    await supabaseAdmin
      .from('client_domains')
      .update({ status: 'pending_verification' })
      .eq('id', domainId)

    return NextResponse.json({ 
      success: false, 
      status: 'pending_verification', 
      message: 'Propagation ongoing. Ensure TXT records are accurately added to your registrar.' 
    })

  } catch (error: any) {
    console.error('DNS Verification Engine Crash:', error)
    return NextResponse.json({ error: 'Internal Core Failure' }, { status: 500 })
  }
}