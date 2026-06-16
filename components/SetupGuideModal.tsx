'use client'

import { useEffect } from 'react'

const STEPS = [
  {
    n: 1,
    title: 'Account Initialization',
    body: 'Create your master account on the ProMail web dashboard to access the primary system infrastructure.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />),
  },
  {
    n: 2,
    title: 'Select Execution Tier',
    body: 'Choose the pay-as-you-send plan that aligns with your required outreach volume.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />),
  },
  {
    n: 3,
    title: 'Install the Local Client',
    body: 'Download the ProMail desktop application. Your target lists and contact data remain secured locally on your machine, ensuring absolute data sovereignty.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />),
  },
  {
    n: 4,
    title: 'Domain Provisioning',
    body: 'Connect an existing, established domain — or register a brand-new domain dedicated strictly to your outreach campaigns.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />),
  },
  {
    n: 5,
    title: 'DNS Configuration',
    body: "Secure your deliverability. Copy the provided authentication records from ProMail and paste them into your domain registrar's DNS settings. Run the internal system check to ensure your domain is fully verified and connected.",
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />),
  },
  {
    n: 6,
    title: 'Mailbox Generation',
    body: 'Create the specific email address on your verified domain that will act as your outbound sender.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />),
  },
  {
    n: 7,
    title: 'Client Login & Sender Binding',
    body: 'Open the local ProMail application, log in with your master credentials, and navigate to settings. Input your newly created sender email to bind it to the sending architecture.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />),
  },
  {
    n: 8,
    title: 'Reputation Management & Support',
    body: 'On a fresh, newly registered domain, immediately consult the in-app Advisor and follow the strict step-by-step warm-up procedures to protect your domain from blacklists. For technical escalation, contact our support team directly through the web dashboard.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />),
  },
]

export default function SetupGuideModal({ onClose }: { onClose: () => void }) {
  // Lock background scroll + close on Escape.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483646,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '20px',
        background: 'rgba(2,1,6,0.82)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        animation: 'sg-fade 0.25s ease-out',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="sg-card"
        style={{
          position: 'relative', width: '100%', maxWidth: '760px',
          margin: 'auto',
          background: 'linear-gradient(180deg, rgba(12,8,22,0.98) 0%, rgba(6,4,14,0.98) 100%)',
          border: '1px solid rgba(155,93,229,0.25)',
          borderRadius: '28px',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 60px rgba(155,93,229,0.18)',
          animation: 'sg-pop 0.35s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Glowing top hairline */}
        <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, #10b981, #9b5de5, transparent)', borderRadius: '28px 28px 0 0' }} />

        {/* Header */}
        <div style={{
          padding: 'clamp(24px,4vw,36px) clamp(24px,4vw,40px) 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: '20px', right: '20px',
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#cfc4e0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cfc4e0' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', marginBottom: '14px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'sg-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8ef0c8' }}>Setup Guide</span>
          </div>

          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(24px,4vw,34px)', letterSpacing: '-0.03em', color: '#fff', margin: 0, lineHeight: 1.1 }}>
            From Zero to <span style={{ background: 'linear-gradient(120deg,#10b981,#9b5de5)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>First Send</span>
          </h2>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13.5px', color: '#9888ad', marginTop: '8px', marginBottom: 0 }}>
            Eight steps to launch your private, high-deliverability outreach engine.
          </p>
        </div>

        {/* Steps */}
        <div style={{ padding: 'clamp(20px,4vw,32px) clamp(20px,4vw,40px) clamp(28px,4vw,40px)' }}>
          <div style={{ position: 'relative' }}>
            {/* vertical connector line */}
            <div style={{ position: 'absolute', left: '23px', top: '20px', bottom: '20px', width: '2px', background: 'linear-gradient(to bottom, rgba(16,185,129,0.4), rgba(155,93,229,0.4))' }} />

            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="sg-step"
                style={{ display: 'flex', gap: '18px', marginBottom: i === STEPS.length - 1 ? 0 : '22px', animation: `sg-slide 0.5s ease-out both`, animationDelay: `${0.05 + i * 0.06}s`, position: 'relative' }}
              >
                {/* numbered node */}
                <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(155,93,229,0.18))', border: '1px solid rgba(155,93,229,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, boxShadow: '0 0 20px rgba(155,93,229,0.15)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8b0e0">{s.icon}</svg>
                  <span style={{ position: 'absolute', top: '-7px', right: '-7px', width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#6c3b9c)', color: '#fff', fontSize: '11px', fontWeight: 800, fontFamily: 'Syne,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{s.n}</span>
                </div>

                {/* text */}
                <div style={{ paddingTop: '2px', flex: 1 }}>
                  <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '16px', color: '#fff', margin: '0 0 6px' }}>{s.title}</h3>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13.5px', lineHeight: 1.65, color: '#9888ad', margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onClose}
              style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', padding: '14px 36px', borderRadius: '13px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6c3b9c,#8c52c8)', boxShadow: '0 0 28px rgba(108,59,156,0.5)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 48px rgba(108,59,156,0.7)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(108,59,156,0.5)' }}
            >
              Got it — Let's Begin
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sg-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sg-pop { from { opacity: 0; transform: scale(0.95) translateY(12px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes sg-slide { from { opacity: 0; transform: translateX(-14px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes sg-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.5); opacity: 0.6 } }
        .sg-card::-webkit-scrollbar { width: 6px; }
        .sg-card::-webkit-scrollbar-thumb { background: rgba(155,93,229,0.3); border-radius: 10px; }
        .sg-step:hover h3 { color: #c8b0e0; }
      `}</style>
    </div>
  )
}