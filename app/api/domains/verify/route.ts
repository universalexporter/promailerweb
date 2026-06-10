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

    // --- ADDED: SILENTLY TRIGGER RESEND'S API ---
    // This tells Resend to start checking on their end without breaking your custom local checks.
    if (domainData.resend_domain_id) {
      try {
        await fetch(`https://api.resend.com/domains/${domainData.resend_domain_id}/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (e) {
        console.log(`Silent Resend trigger failed for ${domainName}`, e)
      }
    }
    // --------------------------------------------
    
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

    // 4. Update Database State based on verified checkpoints
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

    return NextResponse.json({ 
      success: false, 
      status: 'pending', 
      message: 'Propagation ongoing. Ensure TXT records are accurately added to your registrar.' 
    })

  } catch (error: any) {
    console.error('DNS Verification Engine Crash:', error)
    return NextResponse.json({ error: 'Internal Core Failure' }, { status: 500 })
  }
}