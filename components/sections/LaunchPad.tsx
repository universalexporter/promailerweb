'use client'

import { useRef } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import Link from 'next/link' // Added Link import

export default function LaunchPad() {
  const ref = useRef<HTMLElement>(null!)
  useScrollReveal(ref)

  return (
    <section
      ref={ref}
      id="cta"
      style={{
        position:   'relative',
        padding:    'clamp(80px,10vw,150px) 24px',
        textAlign:  'center',
        background: 'linear-gradient(180deg, rgba(4,3,10,0.96) 0%, rgba(8,4,18,0.98) 100%)',
        borderTop:  '1px solid rgba(108,59,156,0.2)',
        overflow:   'hidden',
      }}
    >
      {/* Centre glow */}
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'min(900px,100vw)', height:'500px', background:'radial-gradient(ellipse, rgba(108,59,156,0.16) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:'min(600px,100vw)', height:'300px', background:'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 65%)', pointerEvents:'none' }} />

      <div data-reveal style={{ position:'relative', zIndex:2, maxWidth:'600px', margin:'0 auto' }}>

        {/* Label */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', marginBottom:'28px' }}>
          <span style={{ width:'32px', height:'1px', background:'linear-gradient(to right, transparent, #9b5de5)', display:'inline-block' }} />
          <span style={{ fontSize:'11px', fontFamily:'Syne,sans-serif', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase' as const, color:'#9b5de5' }}>The Launchpad</span>
          <span style={{ width:'32px', height:'1px', background:'linear-gradient(to left, transparent, #9b5de5)', display:'inline-block' }} />
        </div>

        <h2 style={{
          fontFamily:    'Syne, sans-serif',
          fontWeight:    800,
          color:         '#ffffff',
          lineHeight:    1.05,
          letterSpacing: '-0.045em',
          marginBottom:  '18px',
          fontSize:      'clamp(38px, 5.5vw, 68px)',
        }}>
          Take Control of<br />Your Outbound.
        </h2>

        <p style={{
          fontSize:     'clamp(15px,1.7vw,17.5px)',
          fontFamily:   'DM Sans, sans-serif',
          fontWeight:   300,
          lineHeight:   1.7,
          color:        '#9080a8',
          marginBottom: '48px',
          maxWidth:     '480px',
          margin:       '0 auto 48px',
        }}>
          Enterprise-grade delivery. Total data privacy. Pay only for what you send. The future of bulk email starts here.
        </p>

        {/* Buttons — properly sized, NOT full-width */}
        <div style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', gap:'14px', marginBottom:'24px' }}>
          <div style={{ display:'flex', gap:'14px', flexWrap:'wrap', justifyContent:'center' }}>
            <button style={{
              display:       'flex', alignItems:'center', gap:'9px',
              padding:       'clamp(13px,1.5vw,17px) clamp(28px,3.5vw,44px)',
              borderRadius:  '14px',
              fontSize:      'clamp(14px,1.5vw,15.5px)',
              fontFamily:    'Syne, sans-serif', fontWeight:700,
              color:         '#ffffff',
              background:    'linear-gradient(135deg, #6c3b9c 0%, #8c52c8 100%)',
              border:        'none', cursor:'pointer',
              boxShadow:     '0 0 30px rgba(108,59,156,0.55), 0 4px 24px rgba(0,0,0,0.5)',
              transition:    'transform 0.2s ease, box-shadow 0.2s ease',
              whiteSpace:    'nowrap' as const,
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-2px)'; el.style.boxShadow='0 0 60px rgba(108,59,156,0.7), 0 0 120px rgba(108,59,156,0.2), 0 6px 28px rgba(0,0,0,0.55)' }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(0)'; el.style.boxShadow='0 0 30px rgba(108,59,156,0.55), 0 4px 24px rgba(0,0,0,0.5)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download the Desktop App
            </button>

            {/* Changed to Link routing to /dashboard */}
            <Link href="/dashboard" style={{
              display:       'flex', alignItems:'center', gap:'9px',
              padding:       'clamp(13px,1.5vw,17px) clamp(28px,3.5vw,44px)',
              borderRadius:  '14px',
              fontSize:      'clamp(14px,1.5vw,15.5px)',
              fontFamily:    'Syne, sans-serif', fontWeight:700,
              color:         '#ffffff',
              background:    'linear-gradient(135deg, #0d9668 0%, #10b981 100%)',
              border:        'none', cursor:'pointer',
              boxShadow:     '0 0 28px rgba(16,185,129,0.45), 0 4px 22px rgba(0,0,0,0.45)',
              transition:    'transform 0.2s ease, box-shadow 0.2s ease',
              whiteSpace:    'nowrap' as const,
              letterSpacing: '0.01em',
              textDecoration: 'none' // Added to prevent default link underline
            }}
            onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-2px)'; el.style.boxShadow='0 0 56px rgba(16,185,129,0.6), 0 6px 26px rgba(0,0,0,0.5)' }}
            onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(0)'; el.style.boxShadow='0 0 28px rgba(16,185,129,0.45), 0 4px 22px rgba(0,0,0,0.45)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              Fund Your Account
            </Link>
          </div>
        </div>

        <p style={{ fontSize:'12.5px', fontFamily:'DM Sans,sans-serif', color:'rgba(122,112,144,0.55)', letterSpacing:'0.03em', marginBottom:'40px' }}>
          No subscription required · Crypto & card accepted · Instant activation
        </p>

        {/* Trust badges */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', justifyContent:'center' }}>
          {['🔒 AES-256 Encrypted', '🌐 99.9% Uptime SLA', '⚡ Sub-10s Activation', '₿ Crypto Accepted'].map(b => (
            <span key={b} style={{
              padding:    '7px 14px',
              borderRadius: '100px',
              fontSize:   '12px',
              fontFamily: 'DM Sans, sans-serif',
              color:      '#8a8099',
              background: 'rgba(255,255,255,0.03)',
              border:     '1px solid rgba(255,255,255,0.07)',
            }}>{b}</span>
          ))}
        </div>
      </div>
    </section>
  )
}