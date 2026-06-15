'use client'

// A single reusable Download control used everywhere on the site.
// Clicking it opens a dropdown with Windows + Mac options.
//   • Windows → downloads the installer immediately
//   • Mac     → shows a "coming soon" note (no broken file)
//
// Maintain the URLs in ONE place (below). When the Mac build is ready,
// set MAC_INSTALLER_URL and the Mac option starts working automatically.

import { useState, useRef, useEffect } from 'react'

export const WINDOWS_INSTALLER_URL =
  'https://ijhmrmubqexpvwmnhlrm.supabase.co/storage/v1/object/public/downloads/ProMailSuite-Setup.exe'

export const MAC_INSTALLER_URL: string | null = null // set when Mac build is hosted

function triggerDownload(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

type Props = {
  /** Pass your existing button markup/classes as children. */
  children: React.ReactNode
  /** className for the trigger button so it matches each location's style. */
  className?: string
  /** Optional inline style for the trigger button. */
  style?: React.CSSProperties
  /** Dropdown alignment relative to the button. */
  align?: 'left' | 'right' | 'center'
  /** Hover handlers (so callers can keep their existing hover effects). */
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export default function DownloadButton({
  children, className, style, align = 'center', onMouseEnter, onMouseLeave,
}: Props) {
  const [open, setOpen] = useState(false)
  const [macNote, setMacNote] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setMacNote(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const chooseWindows = () => {
    triggerDownload(WINDOWS_INSTALLER_URL)
    setOpen(false); setMacNote(false)
  }

  const chooseMac = () => {
    if (MAC_INSTALLER_URL) {
      triggerDownload(MAC_INSTALLER_URL)
      setOpen(false); setMacNote(false)
    } else {
      setMacNote(true) // show inline "coming soon"
    }
  }

  const alignClass =
    align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block', zIndex: open ? 9999 : 'auto' }}>
      <button
        type="button"
        className={className}
        style={style}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </button>

      {open && (
        <div
          className={`pm-dl-menu ${alignClass}`}
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', zIndex: 99999,
            minWidth: '230px',
            background: 'rgba(10,7,20,0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(155,93,229,0.25)',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(155,93,229,0.18)',
          }}
        >
          {/* Windows */}
          <button
            type="button"
            onClick={chooseWindows}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '12px 14px', borderRadius: '11px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#fff', textAlign: 'left',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#3b82f6', flexShrink: 0 }}>
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/>
            </svg>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              Download for Windows
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400, fontSize: '10px', color: '#8a80a0', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
                .exe Installer · Ready
              </span>
            </span>
          </button>

          {/* Mac */}
          <button
            type="button"
            onClick={chooseMac}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
              padding: '12px 14px', borderRadius: '11px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: macNote ? '#8a80a0' : '#fff', textAlign: 'left',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px',
              transition: 'background 0.15s', marginTop: '2px',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#d4cfe8', flexShrink: 0 }}>
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              {macNote ? 'macOS — Coming Soon' : 'Download for Mac'}
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400, fontSize: '10px', color: '#8a80a0', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
                {macNote ? 'Use the web portal on Mac for now' : 'Apple Silicon & Intel'}
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}