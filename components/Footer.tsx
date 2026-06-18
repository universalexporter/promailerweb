'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DownloadButton from '@/components/DownloadButton'
import TermsModal from '@/components/TermsModal'
import InfoModal from '@/components/InfoModal'
import { supabase } from '@/lib/supabaseClient'

// Content for each info modal (edit freely).
const INFO: Record<string, { title: string; body: string[] }> = {
  'Virtual Ledger': { title: 'Virtual Ledger', body: [
    'The Virtual Ledger is your real-time record of sending activity and usage. Every email routed through ProMail is accounted for, so you always know exactly what you have sent and what remains.',
    'Your ledger updates live as your campaigns run, giving you full transparency over your account.',
  ]},
  'API Reference': { title: 'API Reference', body: [
    'ProMail exposes a simple sending API used by the desktop engine. Each request is authenticated with your private API key.',
    'Full developer documentation is being prepared. For early access or integration questions, please contact support.',
  ]},
  'Changelog': { title: 'Changelog', body: [
    'We ship improvements continuously — deliverability upgrades, dashboard refinements, and new controls.',
    'A detailed public changelog is coming soon. Major updates are announced inside your dashboard.',
  ]},
  'AES-256 Vault': { title: 'AES-256 Vault', body: [
    'Sensitive credentials are protected using AES-256 encryption, the same standard trusted by financial institutions.',
    'Your keys and secrets are never stored in plain text.',
  ]},
  'Zero-Knowledge Policy': { title: 'Zero-Knowledge Policy', body: [
    'Your contact lists live on your own device, not on our servers. ProMail is designed so that your audience data stays under your control.',
    'We route your email without harvesting or reselling your contacts — your data is yours.',
  ]},
  'Sub-Account Isolation': { title: 'Sub-Account Isolation', body: [
    'Each client account is isolated. Your domains, contacts, and sending activity are never shared with or visible to other accounts.',
    'This isolation protects your data and your sending reputation.',
  ]},
  'Audit Logs': { title: 'Audit Logs', body: [
    'Key account actions are logged so you have a clear trail of activity on your account.',
    'Expanded self-serve audit log access is on our roadmap.',
  ]},
  'Compliance': { title: 'Compliance', body: [
    'ProMail is built to support compliant sending. You remain responsible for obtaining consent and following anti-spam laws (such as CAN-SPAM, CASL, and GDPR) in your and your recipients\u2019 jurisdictions.',
    'We provide the tools — including one-click unsubscribe and suppression — to help you stay compliant.',
  ]},
  'About': { title: 'About ProMail', body: [
    'ProMail is a desktop-to-cloud bulk email platform built for operators who demand total control and privacy.',
    'We combine offline-first data privacy with powerful cloud sending infrastructure and pay-as-you-send economics.',
  ]},
  'Status Page': { title: 'System Status', body: [
    'All systems are currently operational.',
    'A live, detailed status page is being prepared. If you experience an issue, please reach out through support.',
  ]},
}

export default function Footer() {
  const router = useRouter()
  const [showTerms, setShowTerms] = useState(false)
  const [info, setInfo] = useState<{ title: string; body: string[] } | null>(null)

  // Support → dashboard + open chat (login first if needed).
  const handleSupport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        router.push('/dashboard?support=1')
      } else {
        router.push('/login?next=support')
      }
    } catch {
      router.push('/login?next=support')
    }
  }

  const COLS = [
    {
      title: 'Product',
      links: [
        { label: 'Desktop App',    download: true },
        { label: 'Client Portal',  href: '/login' },
        { label: 'Virtual Ledger', info: true },
        { label: 'API Reference',  info: true },
        { label: 'Changelog',      info: true },
      ],
    },
    {
      title: 'Security',
      links: [
        { label: 'AES-256 Vault',          info: true },
        { label: 'Zero-Knowledge Policy',  info: true },
        { label: 'Sub-Account Isolation',  info: true },
        { label: 'Audit Logs',             info: true },
        { label: 'Compliance',             info: true },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About',            info: true },
        { label: 'Privacy Policy',   terms: true },
        { label: 'Terms of Service', terms: true },
        { label: 'Status Page',      info: true },
        { label: 'Support',          support: true },
      ],
    },
  ]

  const renderLink = (lnk: any) => {
    if (lnk.download) {
      return (
        <DownloadButton className="ft-col-a" align="left" style={{ background:'transparent', border:'none', padding:0, cursor:'pointer' }}>
          {lnk.label}
        </DownloadButton>
      )
    }
    if (lnk.terms) {
      return <button onClick={() => setShowTerms(true)} className="ft-col-a" style={{ background:'transparent', border:'none', padding:0, cursor:'pointer', textAlign:'left' }}>{lnk.label}</button>
    }
    if (lnk.support) {
      return <button onClick={handleSupport} className="ft-col-a" style={{ background:'transparent', border:'none', padding:0, cursor:'pointer', textAlign:'left' }}>{lnk.label}</button>
    }
    if (lnk.info && INFO[lnk.label]) {
      return <button onClick={() => setInfo(INFO[lnk.label])} className="ft-col-a" style={{ background:'transparent', border:'none', padding:0, cursor:'pointer', textAlign:'left' }}>{lnk.label}</button>
    }
    return <Link href={lnk.href || '#'} className="ft-col-a" style={{ textDecoration:'none' }}>{lnk.label}</Link>
  }

  return (
    <footer
      style={{
        position:   'relative',
        zIndex:     2,
        background: 'linear-gradient(180deg, rgba(4,3,10,0.90) 0%, rgba(4,3,10,0.97) 100%)',
        borderTop:  '1px solid rgba(255,255,255,0.06)',
      }}
    >

      <div className="ft-main">

        <div className="ft-brand">
          <Link href="/" className="ft-logo" style={{ textDecoration:'none' }}>
            <span style={{
              width:'8px', height:'8px', borderRadius:'50%',
              background:'#10b981', display:'inline-block', flexShrink:0,
              boxShadow:'0 0 10px #10b981, 0 0 22px rgba(16,185,129,0.4)',
              animation:'pulse-dot 2.2s ease-in-out infinite',
            }}/>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'20px', color:'#9b5de5', textShadow:'0 0 16px rgba(155,93,229,0.65)', letterSpacing:'-0.03em', lineHeight:1 }}>Pro</span>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'20px', color:'#ffffff', letterSpacing:'-0.03em', marginLeft:'-1px', lineHeight:1 }}>Mail</span>
          </Link>

          <p className="ft-tagline">
            The only desktop-to-cloud bulk email platform with offline-first data privacy and pay-as-you-send economics. Built for operators who demand total control.
          </p>
          </div>

        {COLS.map(col => (
          <div key={col.title} className="ft-col">
            <h4 className="ft-col-h">{col.title}</h4>
            <ul className="ft-col-ul">
              {col.links.map((lnk) => (
                <li key={lnk.label}>{renderLink(lnk)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="ft-bottom">
        <p className="ft-copy">© {new Date().getFullYear()} ProMail Technologies. All rights reserved.</p>

        <div className="ft-status">
          <span style={{
            width:'7px', height:'7px', borderRadius:'50%',
            background:'#10b981', display:'inline-block',
            boxShadow:'0 0 8px #10b981',
            animation:'pulse-dot 2.2s ease-in-out infinite',
          }}/>
          All systems operational
        </div>

        <p className="ft-copy ft-copy-right">Built for operators. Trusted by enterprises.</p>
      </div>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {info && <InfoModal title={info.title} body={info.body} onClose={() => setInfo(null)} />}

      <style>{`
        .ft-main {
          max-width: 1240px; margin: 0 auto;
          padding: clamp(40px,5vw,56px) clamp(18px,4vw,48px) clamp(28px,3.5vw,40px);
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: clamp(28px,4vw,48px);
        }
        .ft-brand { display: flex; flex-direction: column; }
        .ft-logo  { display: inline-flex; align-items: center; gap: 9px; margin-bottom: 14px; }
        .ft-tagline {
          font-family: 'DM Sans',sans-serif;
          font-size: clamp(12px,1.1vw,13.5px); font-weight: 300; line-height: 1.75;
          color: #7a7090; max-width: 260px; margin-bottom: 18px; margin-top: 0;
        }
          .ft-col-h {
          font-family: 'Syne',sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase; color: #9b5de5;
          margin: 0 0 16px; padding: 0;
        }
        .ft-col-ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .ft-col-a {
          font-family: 'DM Sans',sans-serif; font-size: clamp(11.5px,1vw,13px);
          color: rgba(122,112,144,0.6); transition: color 0.2s;
        }
        .ft-col-a:hover { color: #ffffff; }

        .ft-bottom {
          max-width: 1240px; margin: 0 auto;
          padding: 16px clamp(18px,4vw,48px);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .ft-copy { font-family: 'DM Sans',sans-serif; font-size: clamp(10.5px,0.9vw,12px); color: rgba(122,112,144,0.4); margin: 0; }
        .ft-status { display: flex; align-items: center; gap: 7px; font-family: 'DM Sans',sans-serif; font-size: clamp(10.5px,0.9vw,12px); color: #10b981; }

        @media (max-width: 900px) {
          .ft-main { grid-template-columns: 1fr 1fr; }
          .ft-brand { grid-column: 1 / -1; }
          .ft-tagline { max-width: 100%; }
          .ft-copy-right { display: none; }
        }
        @media (max-width: 560px) {
          .ft-main { grid-template-columns: 1fr 1fr; padding: 36px 16px 24px; gap: 22px; }
          .ft-brand { grid-column: 1 / -1; }
          .ft-bottom { padding: 14px 16px; flex-direction: column; align-items: flex-start; gap: 8px; }
        }
        @media (max-width: 380px) {
          .ft-main { grid-template-columns: 1fr; padding: 32px 13px 20px; }
        }
      `}</style>
    </footer>
  )
}