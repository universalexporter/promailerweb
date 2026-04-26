'use client'

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  const mouse = useRef({ x: -100, y: -100 })
  const ring  = useRef({ x: -100, y: -100 })
  const raf   = useRef<number>(0)

  useEffect(() => {
    // Track mouse instantly
    const onMove = (e: MouseEvent) => { mouse.current.x = e.clientX; mouse.current.y = e.clientY }
    document.addEventListener('mousemove', onMove)

    // Smooth animation loop
    const tick = () => {
      // Dot snaps immediately
      if (dotRef.current) {
        dotRef.current.style.left = `${mouse.current.x}px`
        dotRef.current.style.top  = `${mouse.current.y}px`
      }
      // Ring follows with easing — THIS is what makes it feel smooth
      ring.current.x += (mouse.current.x - ring.current.x) * 0.10
      ring.current.y += (mouse.current.y - ring.current.y) * 0.10
      if (ringRef.current) {
        ringRef.current.style.left = `${ring.current.x}px`
        ringRef.current.style.top  = `${ring.current.y}px`
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    // Grow on interactive elements
    const all = document.querySelectorAll('a, button, [data-hover]')
    const grow = () => {
      if (dotRef.current) { dotRef.current.style.width='16px'; dotRef.current.style.height='16px'; dotRef.current.style.background='#9b5de5' }
      if (ringRef.current) { ringRef.current.style.width='52px'; ringRef.current.style.height='52px'; ringRef.current.style.borderColor='rgba(155,93,229,0.75)' }
    }
    const shrink = () => {
      if (dotRef.current) { dotRef.current.style.width='10px'; dotRef.current.style.height='10px'; dotRef.current.style.background='#9b5de5' }
      if (ringRef.current) { ringRef.current.style.width='38px'; ringRef.current.style.height='38px'; ringRef.current.style.borderColor='rgba(108,59,156,0.45)' }
    }

    all.forEach(el => { el.addEventListener('mouseenter', grow); el.addEventListener('mouseleave', shrink) })

    // Hide on leave
    const onLeave = () => { if (dotRef.current) dotRef.current.style.opacity='0'; if (ringRef.current) ringRef.current.style.opacity='0' }
    const onEnter = () => { if (dotRef.current) dotRef.current.style.opacity='1'; if (ringRef.current) ringRef.current.style.opacity='1' }
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      cancelAnimationFrame(raf.current)
      all.forEach(el => { el.removeEventListener('mouseenter', grow); el.removeEventListener('mouseleave', shrink) })
    }
  }, [])

  return (
    <>
      {/* Inner dot — snaps to cursor */}
      <div ref={dotRef} style={{
        position:      'fixed',
        zIndex:        9999,
        width:         '10px',
        height:        '10px',
        borderRadius:  '50%',
        background:    '#9b5de5',
        pointerEvents: 'none',
        transform:     'translate(-50%, -50%)',
        boxShadow:     '0 0 12px #9b5de5, 0 0 24px rgba(155,93,229,0.5)',
        mixBlendMode:  'screen',
        transition:    'width 0.15s ease, height 0.15s ease, background 0.15s ease',
        willChange:    'left, top',
      }} />
      {/* Outer ring — lags behind */}
      <div ref={ringRef} style={{
        position:      'fixed',
        zIndex:        9998,
        width:         '38px',
        height:        '38px',
        borderRadius:  '50%',
        border:        '1px solid rgba(108,59,156,0.45)',
        pointerEvents: 'none',
        transform:     'translate(-50%, -50%)',
        transition:    'width 0.2s ease, height 0.2s ease, border-color 0.2s ease',
        willChange:    'left, top',
      }} />
    </>
  )
}