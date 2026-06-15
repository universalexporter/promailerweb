'use client'

import { useRef } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import Link from 'next/link'
import DownloadButton from '@/components/DownloadButton'

export default function LaunchPad() {
  const ref = useRef<HTMLElement>(null!)
  useScrollReveal(ref)

  return (
    <section
      ref={ref}
      id="cta"
      style={{
        position:   'relative',
        padding:    'clamp(90px,11vw,170px) 24px',
        textAlign:  'center',
        background: 'linear-gradient(180deg, rgba(4,3,10,0.96) 0%, rgba(8,4,18,0.98) 100%)',
        borderTop:  '1px solid rgba(108,59,156,0.2)',
        overflow:   'hidden',
      }}
    >
      {/* ── Ambient depth: layered glows ── */}
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'min(900px,100vw)', height:'520px', background:'radial-gradient(ellipse, rgba(108,59,156,0.18) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:'min(620px,100vw)', height:'320px', background:'radial-gradient(ellipse, rgba(16,185,129,0.09) 0%, transparent 65%)', pointerEvents:'none' }} />
      {/* floating orbs for depth */}
      <div style={{ position:'absolute', top:'18%', left:'12%', width:'160px', height:'160px', background:'radial-gradient(circle, rgba(155,93,229,0.12) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(20px)', pointerEvents:'none', animation:'lp-float-a 9s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'20%', right:'14%', width:'130px', height:'130px', background:'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)', borderRadius:'50%', filter:'blur(18px)', pointerEvents:'none', animation:'lp-float-b 11s ease-in-out infinite' }} />

      {/* top + bottom hairline accents */}
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'min(680px,90vw)', height:'1px', background:'linear-gradient(to right, transparent, rgba(155,93,229,0.6), transparent)', pointerEvents:'none' }} />

      <div data-reveal style={{ position:'relative', zIndex:2, maxWidth:'640px', margin:'0 auto' }}>

        {/* Label pill */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', marginBottom:'30px', padding:'7px 16px', borderRadius:'100px', background:'rgba(155,93,229,0.08)', border:'1px solid rgba(155,93,229,0.22)', boxShadow:'0 0 24px rgba(155,93,229,0.12), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', display:'inline-block', animation:'lp-pulse 2.2s ease-in-out infinite' }} />
          <span style={{ fontSize:'10.5px', fontFamily:'Syne,sans-serif', fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' as const, color:'#c8b0e0' }}>The Launchpad</span>
        </div>

        <h2 style={{
          fontFamily:    'Syne, sans-serif',
          fontWeight:    800,
          color:         '#ffffff',
          lineHeight:    1.04,
          letterSpacing: '-0.045em',
          marginBottom:  '20px',
          fontSize:      'clamp(40px, 5.8vw, 72px)',
        }}>
          Take Control of<br />
          <span style={{
            background: 'linear-gradient(120deg, #ffffff 0%, #c8b0e0 50%, #9b5de5 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 70px rgba(155,93,229,0.3)',
          }}>Your Outbound.</span>
        </h2>

        <p style={{
          fontSize:     'clamp(15px,1.7vw,18px)',
          fontFamily:   'DM Sans, sans-serif',
          fontWeight:   300,
          lineHeight:   1.75,
          color:        '#9888ad',
          maxWidth:     '500px',
          margin:       '0 auto 52px',
        }}>
          Enterprise-grade delivery. Total data privacy. Pay only for what you send. The future of bulk email starts here.
        </p>

        {/* Buttons */}
        <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'14px', marginBottom:'26px' }}>
          <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', justifyContent:'center' }}>

            {/* Download → dropdown chooser (Windows / Mac) */}
            <DownloadButton align="center" style={{
              display:       'flex', alignItems:'center', gap:'10px',
              padding:       'clamp(14px,1.6vw,18px) clamp(30px,3.6vw,46px)',
              borderRadius:  '15px',
              fontSize:      'clamp(14px,1.5vw,15.5px)',
              fontFamily:    'Syne, sans-serif', fontWeight:700,
              color:         '#ffffff',
              background:    'linear-gradient(135deg, #6c3b9c 0%, #8c52c8 100%)',
              border:        'none', cursor:'pointer',
              boxShadow:     '0 0 34px rgba(108,59,156,0.55), 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)',
              transition:    'transform 0.2s ease, box-shadow 0.2s ease',
              whiteSpace:    'nowrap' as const,
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-2px)'; el.style.boxShadow='0 0 64px rgba(108,59,156,0.75), 0 0 130px rgba(108,59,156,0.22), 0 6px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(0)'; el.style.boxShadow='0 0 34px rgba(108,59,156,0.55), 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download the Desktop App
            </DownloadButton>

            {/* Fund Your Account → /dashboard */}
            <Link href="/dashboard" style={{
              display:       'flex', alignItems:'center', gap:'10px',
              padding:       'clamp(14px,1.6vw,18px) clamp(30px,3.6vw,46px)',
              borderRadius:  '15px',
              fontSize:      'clamp(14px,1.5vw,15.5px)',
              fontFamily:    'Syne, sans-serif', fontWeight:700,
              color:         '#ffffff',
              background:    'linear-gradient(135deg, #0d9668 0%, #10b981 100%)',
              border:        'none', cursor:'pointer',
              boxShadow:     '0 0 30px rgba(16,185,129,0.45), 0 4px 22px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
              transition:    'transform 0.2s ease, box-shadow 0.2s ease',
              whiteSpace:    'nowrap' as const,
              letterSpacing: '0.01em',
              textDecoration: 'none'
            }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-2px)'; el.style.boxShadow='0 0 60px rgba(16,185,129,0.62), 0 6px 26px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(0)'; el.style.boxShadow='0 0 30px rgba(16,185,129,0.45), 0 4px 22px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              Fund Your Account
            </Link>
          </div>
        </div>

        <p style={{ fontSize:'12.5px', fontFamily:'DM Sans,sans-serif', color:'rgba(122,112,144,0.6)', letterSpacing:'0.03em', marginBottom:'44px' }}>
          No subscription required · Crypto &amp; card accepted · Instant activation
        </p>

        {/* Trust badges */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'center' }}>
          {['🔒 AES-256 Encrypted', '🌐 99.9% Uptime SLA', '⚡ Sub-10s Activation', '₿ Crypto Accepted'].map(b => (
            <span key={b} className="lp-badge" style={{
              padding:    '8px 15px',
              borderRadius: '100px',
              fontSize:   '12px',
              fontFamily: 'DM Sans, sans-serif',
              color:      '#9a90a9',
              background: 'rgba(255,255,255,0.03)',
              border:     '1px solid rgba(255,255,255,0.07)',
              transition: 'all 0.25s ease',
              cursor:     'default',
            }}>{b}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes lp-pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%     { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes lp-float-a {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(20px,-24px); }
        }
        @keyframes lp-float-b {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(-22px,18px); }
        }
        .lp-badge:hover {
          color: #ffffff;
          background: rgba(155,93,229,0.1);
          border-color: rgba(155,93,229,0.35);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(155,93,229,0.18);
        }
      `}</style>
    </section>
  )
}