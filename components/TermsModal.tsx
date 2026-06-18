'use client'

import { useEffect } from 'react'

interface TermsModalProps {
  onClose: () => void
  onAccept?: () => void      // optional: shows an "I Accept" button when provided
}

export default function TermsModal({ onClose, onAccept }: TermsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      data-lenis-prevent
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483647,
        display: 'block', overflowY: 'scroll', WebkitOverflowScrolling: 'touch',
        background: 'rgba(2,1,6,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        padding: '40px 18px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: '720px', margin: '0 auto',
          background: 'linear-gradient(180deg, rgba(12,8,22,0.98), rgba(6,4,14,0.98))',
          border: '1px solid rgba(155,93,229,0.25)', borderRadius: '24px',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 60px rgba(155,93,229,0.15)',
        }}
      >
        <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, #9b5de5, transparent)', borderRadius: '24px 24px 0 0' }} />

        <div style={{ padding: 'clamp(24px,4vw,40px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '16px' }}>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(20px,3vw,26px)', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Terms &amp; Conditions
            </h2>
            <button onClick={onClose} style={{ flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#8a80a0', lineHeight: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13.5px', lineHeight: 1.7, color: '#9888ad', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, color: '#c8b0e0', fontWeight: 600 }}>Please read these terms carefully before using ProMail.</p>

            <p style={{ margin: 0 }}><strong style={{ color: '#fff' }}>1. Acceptable Use.</strong> You agree to use ProMail only for sending email to recipients who have consented to receive your messages. You will not send unsolicited bulk email (spam), deceptive content, or anything unlawful in your jurisdiction or the recipient's.</p>

            <p style={{ margin: 0 }}><strong style={{ color: '#fff' }}>2. Full Responsibility.</strong> You take full and sole responsibility for your account, your sending activity, the content of your emails, your contact lists, and compliance with all applicable anti-spam and data-protection laws (including CAN-SPAM, GDPR, and local regulations). ProMail is a sending tool; the responsibility for how it is used rests entirely with you.</p>

            <p style={{ margin: 0 }}><strong style={{ color: '#fff' }}>3. Account Security.</strong> You are responsible for keeping your login credentials and API keys secure. Any activity performed through your account or API key is your responsibility.</p>

            <p style={{ margin: 0 }}><strong style={{ color: '#fff' }}>4. Domains &amp; Deliverability.</strong> You are responsible for the domains you connect and for properly configuring DNS records. ProMail does not guarantee inbox placement or delivery rates, which depend on your sending practices and reputation.</p>

            <p style={{ margin: 0 }}><strong style={{ color: '#fff' }}>5. Suspension.</strong> ProMail may suspend or terminate accounts that violate these terms, generate abuse complaints, or threaten the reputation of the shared sending infrastructure.</p>

            <p style={{ margin: 0 }}><strong style={{ color: '#fff' }}>6. No Liability.</strong> ProMail is provided "as is." To the maximum extent permitted by law, ProMail is not liable for any damages arising from your use of the service, including lost revenue, blacklisting, or deliverability issues caused by your sending behavior.</p>

            <p style={{ margin: 0 }}><strong style={{ color: '#fff' }}>7. Acknowledgement.</strong> By accepting, you confirm that you have read and understood these terms, that you accept them in full, and that you take complete responsibility for your account and all actions taken through it.</p>

            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6a6080' }}>These terms may be updated. Continued use after changes constitutes acceptance of the revised terms.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px', flexWrap: 'wrap' }}>
            <button onClick={onClose} style={{ padding: '12px 22px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#8a80a0', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
              {onAccept ? 'Cancel' : 'Close'}
            </button>
            {onAccept && (
              <button onClick={() => { onAccept(); onClose() }} style={{ padding: '12px 26px', borderRadius: '12px', border: 'none', background: 'linear-gradient(to right, #6c3b9c, #9b5de5)', color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 0 24px rgba(155,93,229,0.4)' }}>
                I Confirm I Read &amp; Accept
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}