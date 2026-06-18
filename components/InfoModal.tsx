'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface InfoModalProps {
  title: string
  body: string[]
  onClose: () => void
}

export default function InfoModal({ title, body, onClose }: InfoModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!mounted) return null

  return createPortal(
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
          position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto',
          background: 'linear-gradient(180deg, rgba(12,8,22,0.98), rgba(6,4,14,0.98))',
          border: '1px solid rgba(155,93,229,0.25)', borderRadius: '24px',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 60px rgba(155,93,229,0.15)',
        }}
      >
        <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, #9b5de5, transparent)', borderRadius: '24px 24px 0 0' }} />

        <div style={{ padding: 'clamp(24px,4vw,40px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '16px' }}>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(20px,3vw,26px)', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
            <button onClick={onClose} style={{ flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#8a80a0', lineHeight: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '13.5px', lineHeight: 1.7, color: '#9888ad', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {body.map((para, i) => (
              <p key={i} style={{ margin: 0 }}>{para}</p>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
            <button onClick={onClose} style={{ padding: '12px 26px', borderRadius: '12px', border: 'none', background: 'linear-gradient(to right, #6c3b9c, #9b5de5)', color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 0 24px rgba(155,93,229,0.4)' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}