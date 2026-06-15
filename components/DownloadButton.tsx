'use client'

// A single reusable Download control used everywhere on the site.
// Clicking it opens a menu with Windows + Mac options.
//   • Windows → downloads the installer immediately
//   • Mac     → shows a "coming soon" note (no broken file)
//
// The menu is rendered through a PORTAL to <body> and positioned with fixed
// coordinates measured from the button. This makes it escape any parent that
// has transforms / overflow / z-index stacking (like the GSAP-animated Hero),
// so it is ALWAYS fully visible on top of everything.

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

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
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  align?: 'left' | 'right' | 'center'
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export default function DownloadButton({
  children, className, style, align = 'center', onMouseEnter, onMouseLeave,
}: Props) {
  const [open, setOpen] = useState(false)
  const [macNote, setMacNote] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const MENU_WIDTH = 240

  useEffect(() => { setMounted(true) }, [])

  // Measure the button and place the menu just below it (in viewport coords).
  const place = useCallback(() => {
    const b = btnRef.current
    if (!b) return
    const r = b.getBoundingClientRect()
    let left = r.left
    if (align === 'right') left = r.right - MENU_WIDTH
    else if (align === 'center') left = r.left + r.width / 2 - MENU_WIDTH / 2
    // keep within viewport with an 8px margin
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8))
    setCoords({ top: r.bottom + 10, left })
  }, [align])

  const toggle = () => {
    if (!open) place()
    setOpen(o => !o)
    setMacNote(false)
  }

  // Reposition on scroll/resize while open, and close on outside click / Esc.
  useEffect(() => {
    if (!open) return
    const onScrollResize = () => place()
    const onDown = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) { setOpen(false); setMacNote(false) }
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setMacNote(false) } }
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, place])

  const chooseWindows = () => { triggerDownload(WINDOWS_INSTALLER_URL); setOpen(false); setMacNote(false) }
  const chooseMac = () => {
    if (MAC_INSTALLER_URL) { triggerDownload(MAC_INSTALLER_URL); setOpen(false); setMacNote(false) }
    else setMacNote(true)
  }

  const menu = (
    <div
      ref={menuRef}
      style={{
        position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH,
        zIndex: 2147483647, // max — above absolutely everything
        background: 'rgba(10,7,20,0.99)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(155,93,229,0.3)',
        borderRadius: '16px', padding: '8px',
        boxShadow: '0 24px 70px rgba(0,0,0,0.85), 0 0 36px rgba(155,93,229,0.22)',
        animation: 'pm-dl-in 0.16s ease-out',
      }}
    >
      <style>{`@keyframes pm-dl-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <button type="button" onClick={chooseWindows}
        style={{ display:'flex', alignItems:'center', gap:'12px', width:'100%', padding:'12px 14px', borderRadius:'11px', border:'none', cursor:'pointer', background:'transparent', color:'#fff', textAlign:'left', fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'13px', transition:'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.16)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color:'#3b82f6', flexShrink:0 }}>
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/>
        </svg>
        <span style={{ display:'flex', flexDirection:'column' }}>
          Download for Windows
          <span style={{ fontFamily:'DM Sans, sans-serif', fontWeight:400, fontSize:'10px', color:'#8a80a0', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'2px' }}>
            .exe Installer · Ready
          </span>
        </span>
      </button>

      <button type="button" onClick={chooseMac}
        style={{ display:'flex', alignItems:'center', gap:'12px', width:'100%', padding:'12px 14px', borderRadius:'11px', border:'none', cursor:'pointer', background:'transparent', color: macNote ? '#8a80a0' : '#fff', textAlign:'left', fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:'13px', transition:'background 0.15s', marginTop:'2px' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color:'#d4cfe8', flexShrink:0 }}>
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        <span style={{ display:'flex', flexDirection:'column' }}>
          {macNote ? 'macOS — Coming Soon' : 'Download for Mac'}
          <span style={{ fontFamily:'DM Sans, sans-serif', fontWeight:400, fontSize:'10px', color:'#8a80a0', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'2px' }}>
            {macNote ? 'Use the web portal on Mac for now' : 'Apple Silicon & Intel'}
          </span>
        </span>
      </button>
    </div>
  )

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={className}
        style={style}
        onClick={toggle}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </button>
      {mounted && open && createPortal(menu, document.body)}
    </>
  )
}