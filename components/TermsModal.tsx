'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface TermsModalProps {
  onClose: () => void
  onAccept?: () => void
}

// ── FULL TERMS & CONDITIONS ──
// Each item is one "page" in the reader. Edit the body text freely.
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Acceptance of Terms',
    body: [
      'By creating an account, accessing, or using ProMail (the "Service"), you agree to be bound by these Terms & Conditions in their entirety. If you do not agree, you must not use the Service.',
      'Your electronic acceptance — including the checkbox confirmation and the typed signature provided at sign-up — constitutes a legally binding agreement equivalent to a handwritten signature.',
      'You confirm that you are at least 18 years old and legally capable of entering into a binding contract.',
    ],
  },
  {
    title: '2. Nature of the Service',
    body: [
      'ProMail provides software and infrastructure that allows you to route and send email through cloud servers, sending engines, and storage systems.',
      'ProMail is a tool. It does not create, endorse, or control the content you send, the recipients you choose, or the manner in which you use the Service.',
      'The Service is provided on an "as is" and "as available" basis without warranties of any kind.',
    ],
  },
  {
    title: '3. Your Full Responsibility',
    body: [
      'You take full, sole, and complete responsibility for your account, your API keys, your sending activity, your email content, your contact lists, and every action taken through your account.',
      'You are solely responsible for ensuring that every recipient has consented to receive your emails, and that your use complies with all applicable laws including anti-spam laws (such as CAN-SPAM, CASL, and GDPR) in your jurisdiction and the recipient\u2019s jurisdiction.',
      'ProMail bears no responsibility whatsoever for how you use the Service or for any consequences arising from your use.',
    ],
  },
  {
    title: '4. Domain Protection & Configuration',
    body: [
      'You are solely responsible for the domains you connect to the Service, including their ownership, security, and correct DNS configuration (SPF, DKIM, DMARC, and related records).',
      'You are responsible for protecting your domain\u2019s reputation. Improper sending practices, sending to non-consenting recipients, or ignoring warm-up guidance may cause your domain to be flagged, throttled, or blacklisted by mailbox providers.',
      'ProMail does not guarantee inbox placement, deliverability, or that your domain will not be marked as spam. Deliverability depends entirely on your sending behavior and reputation.',
      'Any damage to your domain reputation, blacklisting, or delivery failure is your responsibility alone, and ProMail accepts no liability for it.',
    ],
  },
  {
    title: '5. Correct & Acceptable Usage',
    body: [
      'You agree to use the Service only for lawful purposes and only to send email to recipients who have explicitly consented to receive it.',
      'You will NOT use the Service to send unsolicited bulk email (spam), phishing, malware, fraudulent, deceptive, harassing, hateful, or illegal content of any kind.',
      'You will not attempt to bypass, overload, reverse-engineer, probe, or interfere with the Service, its servers, its engines, or its security systems.',
      'You will not use purchased, scraped, rented, or otherwise non-consenting contact lists.',
    ],
  },
  {
    title: '6. No Refunds Policy',
    body: [
      'All payments are final and strictly non-refundable under any circumstances.',
      'When you make a payment, those funds are immediately and automatically used to activate and pay for servers, storage, sending engines, and infrastructure that operate on your behalf. These are real, automatic operational costs paid forward to third-party providers and cannot be reversed.',
      'Because your payment directly activates and funds live infrastructure, no refund, partial refund, credit, or chargeback is available for any reason, including unused balance, dissatisfaction, account suspension, or termination for violations.',
      'By paying, you explicitly acknowledge and accept that you are purchasing the immediate activation of paid infrastructure and that no refund will ever be issued.',
    ],
  },
  {
    title: '7. Chargebacks',
    body: [
      'Initiating a chargeback, payment dispute, or reversal in violation of the No Refunds policy is considered a material breach of these Terms and may constitute fraud.',
      'In the event of a wrongful chargeback, ProMail reserves the right to immediately and permanently terminate your account, retain all data and balances, and pursue recovery of the disputed amount plus any associated costs.',
    ],
  },
  {
    title: '8. Violations, Bans & Blocks',
    body: [
      'If you violate any rule in these Terms, ProMail reserves the absolute right to suspend, ban, block, throttle, or permanently terminate your account immediately and without prior notice.',
      'ProMail protects its servers, systems, infrastructure, and reputation at all costs. Any activity that threatens the platform, other users, the shared sending infrastructure, or ProMail\u2019s standing with providers may result in immediate termination.',
      'No refund or compensation will be provided for accounts suspended or terminated due to violations.',
      'The determination of whether a violation has occurred is made at ProMail\u2019s sole discretion.',
    ],
  },
  {
    title: '9. Account Security',
    body: [
      'You are responsible for maintaining the confidentiality of your login credentials and API keys.',
      'Any and all activity performed through your account or API key is your responsibility, whether or not you authorized it.',
      'You must notify ProMail immediately of any unauthorized use; however, ProMail is not liable for losses arising from compromised credentials.',
    ],
  },
  {
    title: '10. Service Availability & Server Issues',
    body: [
      'ProMail does not guarantee uninterrupted, error-free, or continuous availability of the Service.',
      'Servers, engines, and infrastructure may experience downtime, delays, maintenance, failures, or interruptions. You agree that ProMail bears ZERO responsibility and ZERO liability for any such event or its consequences.',
      'In the event of any server problem, outage, data delay, or infrastructure issue, you agree to remain patient and to refrain from drama, public disparagement, or aggressive escalation, and to allow ProMail reasonable time to address the matter.',
      'ProMail is not liable for any loss of data, revenue, opportunity, or reputation resulting from service interruptions of any kind.',
    ],
  },
  {
    title: '11. Limitation of Liability',
    body: [
      'To the maximum extent permitted by law, ProMail and its operators shall not be liable for any direct, indirect, incidental, special, consequential, punitive, or exemplary damages whatsoever arising from or related to your use of the Service.',
      'This includes, without limitation, lost profits, lost revenue, lost data, business interruption, blacklisting, deliverability failures, or damage to reputation.',
      'In all cases, ProMail\u2019s total aggregate liability to you shall not exceed zero, given the non-refundable, infrastructure-activation nature of all payments.',
    ],
  },
  {
    title: '12. Indemnification',
    body: [
      'You agree to defend, indemnify, and hold harmless ProMail, its operators, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising from your use of the Service, your content, your sending activity, or your breach of these Terms.',
      'This obligation survives the termination of your account.',
    ],
  },
  {
    title: '13. No Warranties',
    body: [
      'The Service is provided "as is" and "as available" without warranties of any kind, whether express, implied, or statutory, including any implied warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      'ProMail does not warrant that the Service will meet your requirements, be uninterrupted, secure, or error-free, or that any defects will be corrected.',
    ],
  },
  {
    title: '14. Data & Privacy Responsibility',
    body: [
      'You are responsible for the legality of the contact data you upload and process, and for honoring unsubscribe and data-deletion requests.',
      'You are the data controller for your contacts; ProMail acts only as a processor for the limited purpose of routing your email.',
      'You are responsible for compliance with all applicable data-protection laws regarding your contacts.',
    ],
  },
  {
    title: '15. Suspension of Shared Infrastructure',
    body: [
      'Because sending infrastructure may be shared, behavior by one user that threatens the reputation or stability of the system may result in protective action affecting that user\u2019s account.',
      'ProMail may take any action it deems necessary to protect the integrity, reputation, and availability of its infrastructure, at its sole discretion and without liability.',
    ],
  },
  {
    title: '16. Changes to the Terms',
    body: [
      'ProMail may modify these Terms at any time. Material changes will be reflected by updating this document.',
      'Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.',
      'It is your responsibility to review these Terms periodically.',
    ],
  },
  {
    title: '17. Recordkeeping & Signature',
    body: [
      'Your acceptance of these Terms, including your typed signature, name, email, and the date and time of acceptance, is recorded and stored.',
      'You agree that this record may be retained and used as evidence of your agreement to these Terms in the event of any dispute, now or in the future.',
      'You waive any objection to the admissibility or enforceability of these Terms on the basis that they were accepted electronically.',
    ],
  },
  {
    title: '18. Dispute Conduct',
    body: [
      'In the event of any disagreement or issue, you agree to communicate respectfully and in good faith, to remain patient, and to refrain from public disparagement, harassment, or coercive tactics against ProMail or its operators.',
      'You agree to allow ProMail a reasonable opportunity to investigate and respond to any concern before escalating.',
    ],
  },
  {
    title: '19. Severability',
    body: [
      'If any provision of these Terms is found to be unenforceable or invalid under applicable law, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining Terms remain in full force and effect.',
    ],
  },
  {
    title: '20. Entire Agreement & Acknowledgement',
    body: [
      'These Terms constitute the entire agreement between you and ProMail regarding the Service and supersede any prior agreements.',
      'By accepting, you confirm that you have read, understood, and agree to every section above; that you take full responsibility for your account and all actions taken through it; that you understand all payments are non-refundable because they activate paid infrastructure; and that ProMail bears no liability for server issues, deliverability, or domain reputation.',
      'You accept these Terms freely, knowingly, and with full understanding of their meaning.',
    ],
  },
]

export default function TermsModal({ onClose, onAccept }: TermsModalProps) {
  const [page, setPage] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const last = SECTIONS.length - 1
  const atEnd = page === last

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && page < last) setPage(p => p + 1)
      if (e.key === 'ArrowLeft' && page > 0) setPage(p => p - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, page, last])

  const section = SECTIONS[page]

  if (!mounted) return null

  return createPortal(
    <div
      onClick={onClose}
      data-lenis-prevent
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483646,
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

        <div style={{ padding: 'clamp(22px,4vw,36px)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '12px' }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '13px', color: '#9b5de5', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Terms &amp; Conditions</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setShowMenu(s => !s)} title="Jump to section" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#8a80a0', lineHeight: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
              </button>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#8a80a0', lineHeight: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((page + 1) / SECTIONS.length) * 100}%`, background: 'linear-gradient(to right, #6c3b9c, #9b5de5)', borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '11px', color: '#6a6080', fontWeight: 700, whiteSpace: 'nowrap' }}>{page + 1} / {SECTIONS.length}</span>
          </div>

          {/* Jump menu */}
          {showMenu && (
            <div style={{ marginBottom: '18px', maxHeight: '220px', overflowY: 'auto', background: 'rgba(4,3,10,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '8px' }} data-lenis-prevent>
              {SECTIONS.map((s, i) => (
                <button key={i} onClick={() => { setPage(i); setShowMenu(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: i === page ? 'rgba(155,93,229,0.15)' : 'transparent', color: i === page ? '#fff' : '#9888ad', fontFamily: 'DM Sans,sans-serif', fontSize: '12px', fontWeight: i === page ? 700 : 400 }}>
                  {s.title}
                </button>
              ))}
            </div>
          )}

          {/* Section content */}
          <div style={{ minHeight: '260px' }}>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(18px,3vw,24px)', color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>{section.title}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {section.body.map((para, i) => (
                <p key={i} style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13.5px', lineHeight: 1.7, color: '#9888ad', margin: 0 }}>{para}</p>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '26px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.06)', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: '11px 20px', borderRadius: '11px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === 0 ? '#3a3050' : '#c8b0e0', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
              ← Back
            </button>

            {!atEnd ? (
              <button onClick={() => setPage(p => Math.min(last, p + 1))} style={{ padding: '11px 24px', borderRadius: '11px', border: 'none', background: 'linear-gradient(to right, #6c3b9c, #9b5de5)', color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 0 20px rgba(155,93,229,0.35)' }}>
                Next →
              </button>
            ) : onAccept ? (
              <button onClick={() => { onAccept(); onClose() }} style={{ padding: '11px 22px', borderRadius: '11px', border: 'none', background: 'linear-gradient(to right, #059669, #10b981)', color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                ✓ I Read &amp; Accept
              </button>
            ) : (
              <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: '11px', border: 'none', background: 'linear-gradient(to right, #6c3b9c, #9b5de5)', color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}