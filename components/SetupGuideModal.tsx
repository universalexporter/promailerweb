'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const STEPS = [
  {
    n: 1,
    title: 'Create Your Account',
    body: 'Start by signing up on the ProMail website with your email and a password. This is your main account — the control center where you manage everything. Use a real email you check often, because important notices go there.',
    tip: 'Pick a strong password you don\'t use anywhere else. This account controls your sending.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />),
  },
  {
    n: 2,
    title: 'Choose How You\'ll Send',
    body: 'In your dashboard, pick a plan that fits how many emails you expect to send. If you\'re just starting and not sure, begin small — you can always move up later. There\'s no long-term commitment, so you only pay for what you actually use.',
    tip: 'Not sure how many emails you need? Start small and increase once you see your real volume.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />),
  },
  {
    n: 3,
    title: 'Install the Desktop App',
    body: 'Download and install the ProMail desktop application on your computer using the "Download" button on the site. This is where you\'ll build and send your campaigns. Your contact lists stay saved on your own computer — they are never uploaded to us — which keeps your data fully private and in your control.',
    tip: 'On Windows, if you see a "Windows protected your PC" pop-up, click "More info" then "Run anyway" — this is normal for new apps.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />),
  },
  {
    n: 4,
    title: 'Get a Domain for Sending',
    body: 'A "domain" is your own web address, like yourcompany.com. You need one to send professional email. You can use a domain you already own, or buy a fresh one from a registrar like Namecheap, GoDaddy, or Cloudflare. Many people buy a separate domain just for outreach, so their main company domain stays protected.',
    warning: 'Never send cold/bulk email from your main company domain. If something goes wrong with deliverability, it can hurt your normal business email too. Use a separate domain dedicated to outreach.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />),
  },
  {
    n: 5,
    title: 'Connect Your Domain (DNS Setup)',
    body: 'This step proves you own the domain and lets email providers trust you. ProMail gives you a few text "records" (called SPF, DKIM, and DMARC). You copy each one and paste it into your domain provider\'s DNS settings page — the same place you bought the domain. Then click "Verify" in ProMail to confirm it worked. Don\'t worry: ProMail shows you exactly what to copy and where.',
    warning: 'DNS changes can take anywhere from a few minutes up to 24–48 hours to take effect. If verification fails at first, wait a bit and try again — it\'s usually just the records still spreading across the internet. Copy the records EXACTLY, with no extra spaces.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />),
  },
  {
    n: 6,
    title: 'Create Your Sending Email Address',
    body: 'Once your domain is verified, create the email address you\'ll send from — for example, hello@yourdomain.com or news@yourdomain.com. This is the "from" address your recipients will see. Choose something that looks trustworthy and matches your brand.',
    tip: 'Avoid spammy-looking names like "noreply2847@". A clean, human name like hello@ or team@ builds more trust.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />),
  },
  {
    n: 7,
    title: 'Log In to the App & Connect Your Sender',
    body: 'Open the ProMail desktop app and log in with the same account you created in Step 1. Go to Settings and enter the sending email address you just made. This links your verified domain to the app, so the app knows it\'s allowed to send on your behalf. Now you\'re ready to build a campaign.',
    tip: 'Use the same email and password as your website account — they\'re the same login.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />),
  },
  {
    n: 8,
    title: 'Warm Up & Protect Your Reputation',
    body: 'If your domain is brand new, do NOT blast thousands of emails on day one — that\'s the fastest way to get blocked. Start with a small number of emails per day and slowly increase over a couple of weeks. This is called "warming up," and it teaches email providers that you\'re a trustworthy sender. Use the in-app Advisor for a guided warm-up schedule.',
    warning: 'Sending too much, too fast from a new domain is the #1 reason new senders land in spam or get blacklisted. Go slow at the start — patience here protects your delivery for the long run. If you ever get stuck, contact our support team through the dashboard.',
    icon: (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />),
  },
]

export default function SetupGuideModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  // Lock background scroll + close on Escape.
  useEffect(() => {
    setMounted(true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <div
      onClick={onClose}
      data-lenis-prevent
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483646,
        display: 'block',
        background: 'rgba(2,1,6,0.82)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        animation: 'sg-fade 0.25s ease-out',
        overflowY: 'scroll',
        WebkitOverflowScrolling: 'touch',
        padding: '40px 20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="sg-card"
        style={{
          position: 'relative', width: '100%', maxWidth: '760px',
          margin: '0 auto',
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

          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(20px,3.5vw,28px)', letterSpacing: '-0.03em', color: '#fff', margin: 0, lineHeight: 1.1 }}>
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
                  <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '14px', color: '#fff', margin: '0 0 6px' }}>{s.title}</h3>
                  <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '12.5px', lineHeight: 1.6, color: '#9888ad', margin: 0 }}>{s.body}</p>
                  {s.tip && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '9px 12px', borderRadius: '10px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <span style={{ flexShrink: 0, fontSize: '12px', marginTop: '1px' }}>💡</span>
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '12px', lineHeight: 1.55, color: '#8ef0c8' }}>{s.tip}</span>
                    </div>
                  )}
                  {s.warning && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '9px 12px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      <span style={{ flexShrink: 0, fontSize: '12px', marginTop: '1px' }}>⚠️</span>
                      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '12px', lineHeight: 1.55, color: '#f5c97a' }}>{s.warning}</span>
                    </div>
                  )}
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
    </div>,
    document.body
  )
}