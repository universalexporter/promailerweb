'use client'

import Link from 'next/link'
import DownloadButton from '@/components/DownloadButton'

const COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Desktop App',    href: '#', download: true },
      { label: 'Client Portal',  href: '/login' },
      { label: 'Virtual Ledger', href: '#' },
      { label: 'API Reference',  href: '#' },
      { label: 'Changelog',      href: '#' },
    ],
  },
  {
    title: 'Security',
    links: [
      { label: 'AES-256 Vault',          href: '#' },
      { label: 'Zero-Knowledge Policy',  href: '#' },
      { label: 'Sub-Account Isolation',  href: '#' },
      { label: 'Audit Logs',             href: '#' },
      { label: 'Compliance',             href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',            href: '#' },
      { label: 'Privacy Policy',   href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Status Page',      href: '#' },
      { label: 'Support',          href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer
      style={{
        position:   'relative',
        zIndex:     2,
        background: 'linear-gradient(180deg, rgba(4,3,10,0.90) 0%, rgba(4,3,10,0.97) 100%)',
        borderTop:  '1px solid rgba(255,255,255,0.06)',
      }}
    >

      {/* ── MAIN GRID ── */}
      <div className="ft-main">

        {/* Brand */}
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

        {/* Link columns */}
        {COLS.map(col => (
          <div key={col.title} className="ft-col">
            <h4 className="ft-col-h">{col.title}</h4>
            <ul className="ft-col-ul">
              {col.links.map((lnk) => (
                <li key={lnk.label}>
                  {('download' in lnk && lnk.download) ? (
                    // Desktop App → opens the Windows/Mac chooser dropdown
                    <DownloadButton className="ft-col-a" align="left"
                      style={{ background:'transparent', border:'none', padding:0, cursor:'pointer' }}>
                      {lnk.label}
                    </DownloadButton>
                  ) : (
                    <Link href={lnk.href} className="ft-col-a" style={{ textDecoration:'none' }}>{lnk.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── BOTTOM BAR ── */}
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

      {/* ── STYLES ── */}
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

        /* tablet */
        @media (max-width: 900px) {
          .ft-main { grid-template-columns: 1fr 1fr; }
          .ft-brand { grid-column: 1 / -1; }
          .ft-tagline { max-width: 100%; }
          .ft-copy-right { display: none; }
        }
        /* mobile */
        @media (max-width: 560px) {
          .ft-main { grid-template-columns: 1fr 1fr; padding: 36px 16px 24px; gap: 22px; }
          .ft-brand { grid-column: 1 / -1; }
          .ft-bottom { padding: 14px 16px; flex-direction: column; align-items: flex-start; gap: 8px; }
        }
        /* very small */
        @media (max-width: 380px) {
          .ft-main { grid-template-columns: 1fr; padding: 32px 13px 20px; }
        }
      `}</style>
    </footer>
  )
}