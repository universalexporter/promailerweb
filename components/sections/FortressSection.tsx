'use client'

import { useRef, useEffect, useState } from 'react'

// ═══════════════════════════════════════════════════════════════
//  1. STRICT MAILER DISPATCH ANIMATION
// ═══════════════════════════════════════════════════════════════
function GlobalDispatchAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let animationId: number

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth * 2
        canvas.height = parent.clientHeight * 2
      }
    }
    window.addEventListener('resize', resize)
    resize()

    // ── FIXED INBOX DESTINATIONS (Arching over the vault) ──
    const numDests = 7
    const destinations = Array.from({ length: numDests }).map((_, i) => {
      // Spread them in a clean semi-circle
      const angle = Math.PI + (Math.PI * (i / (numDests - 1)))
      return { angle, ripples: [] as number[] }
    })

    // ── EMAIL PACKETS (Sleek Envelopes) ──
    const packets = Array.from({ length: 12 }).map((_, i) => ({
      destIndex: Math.floor(Math.random() * numDests),
      progress: -(i * 0.15), // Staggered start times
      speed: 0.008 + Math.random() * 0.004,
    }))

    // Helper: Draw sleek minimalist envelope
    const drawEnvelope = (x: number, y: number, alpha: number) => {
      const w = 18
      const h = 12
      ctx.save()
      ctx.translate(x, y)
      ctx.globalAlpha = alpha

      // Envelope Base
      ctx.beginPath()
      ctx.rect(-w/2, -h/2, w, h)
      ctx.fillStyle = '#070512'
      ctx.fill()
      ctx.strokeStyle = '#9b5de5'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Envelope Flap (The "V")
      ctx.beginPath()
      ctx.moveTo(-w/2, -h/2)
      ctx.lineTo(0, 2)
      ctx.lineTo(w/2, -h/2)
      ctx.strokeStyle = '#10b981' // Green secure check color
      ctx.stroke()

      // Outer Glow
      ctx.shadowBlur = 10
      ctx.shadowColor = '#9b5de5'
      ctx.stroke()

      ctx.restore()
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const w = canvas.width
      const h = canvas.height
      const engineX = w / 2
      const engineY = h - 60
      const radius = Math.min(w * 0.4, h * 0.6)

      // ── DRAW SECURE NETWORK TUNNELS ──
      destinations.forEach(dest => {
        const dx = engineX + Math.cos(dest.angle) * radius
        const dy = engineY + Math.sin(dest.angle) * radius

        // Straight structural lines
        ctx.beginPath()
        ctx.moveTo(engineX, engineY)
        ctx.lineTo(dx, dy)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Destination Inbox Nodes
        ctx.beginPath()
        ctx.rect(dx - 15, dy - 10, 30, 20)
        ctx.fillStyle = '#070512'
        ctx.fill()
        ctx.strokeStyle = 'rgba(155, 93, 229, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Inbox text
        ctx.font = '600 8px monospace'
        ctx.fillStyle = '#8a80a0'
        ctx.textAlign = 'center'
        ctx.fillText('INBOX', dx, dy + 3)

        // Draw active ripples if an email just landed
        for (let i = dest.ripples.length - 1; i >= 0; i--) {
          dest.ripples[i] += 0.02
          const r = dest.ripples[i]
          if (r > 1) {
            dest.ripples.splice(i, 1)
          } else {
            ctx.beginPath()
            ctx.arc(dx, dy, r * 40, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(16, 185, 129, ${1 - r})` // Green success pulse
            ctx.lineWidth = 2
            ctx.stroke()
          }
        }
      })

      // ── DRAW EMAILS SLIDING DOWN TUNNELS ──
      packets.forEach(p => {
        p.progress += p.speed
        
        // Reset when it hits the inbox
        if (p.progress >= 1) {
          destinations[p.destIndex].ripples.push(0) // Trigger ripple
          p.progress = -Math.random() * 0.5
          p.destIndex = Math.floor(Math.random() * numDests) // Pick new inbox
        }

        if (p.progress > 0) {
          const dest = destinations[p.destIndex]
          const dx = engineX + Math.cos(dest.angle) * radius
          const dy = engineY + Math.sin(dest.angle) * radius

          // Linear interpolation for rigid, robotic movement
          const x = engineX + (dx - engineX) * p.progress
          const y = engineY + (dy - engineY) * p.progress

          // Fade in as it leaves the vault, fade out right before inbox
          let alpha = 1
          if (p.progress < 0.1) alpha = p.progress * 10
          if (p.progress > 0.9) alpha = (1 - p.progress) * 10

          drawEnvelope(x, y, alpha)
        }
      })

      // ── DRAW THE LOCAL VAULT ENGINE ──
      ctx.beginPath()
      ctx.arc(engineX, engineY, 45, 0, Math.PI * 2)
      ctx.fillStyle = '#070512'
      ctx.fill()
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 4
      ctx.shadowBlur = 30
      ctx.shadowColor = '#10b981'
      ctx.stroke()
      ctx.shadowBlur = 0

      // Vault inner text
      ctx.font = '800 10px Syne'
      ctx.fillStyle = '#10b981'
      ctx.textAlign = 'center'
      ctx.fillText('PROMAIL', engineX, engineY - 5)
      ctx.fillText('ENGINE', engineX, engineY + 8)

      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full scale-[0.85] md:scale-100"
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  FEATURES DATA
// ═══════════════════════════════════════════════════════════════
const FEATURES = [
  {
    icon: '🔒',
    title: 'AES-256 Local Vault',
    body:  'All contact records, templates, and campaign logic encrypted at rest on your hardware. Inaccessible even under physical seizure—we hold no keys.',
    tag:   'Military-grade',
    color: 'purple',
  },
  {
    icon: '🛰️',
    title: 'Offline-First Architecture',
    body:  'Build multi-million-record campaigns with zero internet connection. The Desktop App functions fully air-gapped. Sync only the dispatch signal when ready.',
    tag:   'Air-gap ready',
    color: 'purple',
  },
  {
    icon: '👁️',
    title: 'Zero-Knowledge Dispatch',
    body:  'Our cloud receives only stripped message payloads. No recipient data, no metadata, no logs you don\'t control. We are architecturally blind to your lists.',
    tag:   'Zero exposure',
    color: 'green',
  },
  {
    icon: '🔑',
    title: 'Client-Side Key Management',
    body:  'Encryption keys never leave your machine. Every campaign, contact, and template is signed locally before any data touches our infrastructure.',
    tag:   'You hold keys',
    color: 'green',
  },
]

const TRUST_STATS = [
  { val: '256-bit', label: 'Encryption' },
  { val: '0',       label: 'Data shared' },
  { val: '100%',    label: 'Local storage' },
]

// ═══════════════════════════════════════════════════════════════
//  MAIN SECTION
// ═══════════════════════════════════════════════════════════════
export default function FortressSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Custom Scroll Interpolation Engine
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      
      const rect = sectionRef.current.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const sectionCenter = rect.top + rect.height / 2
      
      // Calculate how far the center of the section is from the center of the screen
      const distanceToCenter = Math.abs(viewportCenter - sectionCenter)
      
      // The distance (in pixels) at which the animation begins to fade/slide in
      const maxDistance = window.innerHeight * 0.7 

      // Creates a number between 0 and 1
      let rawProgress = 1 - (distanceToCenter / maxDistance)
      rawProgress = Math.max(0, Math.min(1, rawProgress))

      // Smooth step easing so it feels buttery smooth, not rigid
      const smoothProgress = rawProgress * rawProgress * (3 - 2 * rawProgress)
      
      setScrollProgress(smoothProgress)
    }

    // Passive true ensures the scroll listener doesn't hurt page performance
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Trigger once to set initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="security"
      style={{
        position: 'relative',
        // ── UPDATED: Lighter, transparent glass background ──
        background: 'linear-gradient(135deg, rgba(4,3,10,0.4) 0%, rgba(10,5,22,0.3) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop:    '1px solid rgba(108,59,156,0.22)',
        borderBottom: '1px solid rgba(108,59,156,0.16)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background:'linear-gradient(to bottom, transparent, #6c3b9c 40%, #6c3b9c 60%, transparent)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'400px', height:'400px', background:'radial-gradient(ellipse, rgba(108,59,156,0.08) 0%, transparent 65%)', pointerEvents:'none' }} />

      <div style={{
        maxWidth: '1240px',
        margin:   '0 auto',
        padding:  'clamp(60px, 8vw, 110px) clamp(20px, 4vw, 48px)',
        display:  'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:      'clamp(32px, 5vw, 80px)',
        alignItems: 'center',
      }}
      className="fortress-grid"
      >
        {/* ── LEFT: COPY (Manual Scroll Interpolation from Left) ── */}
        <div style={{
          opacity: scrollProgress,
          transform: `translateX(${(1 - scrollProgress) * -120}px)`,
          // Adding a tiny 0.1s transition smooths out notch-based mouse wheels
          transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
          willChange: 'transform, opacity'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'11px', fontFamily:'Syne,sans-serif', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase' as const, color:'#9b5de5', marginBottom:'20px' }}>
            <span style={{ width:'28px', height:'1px', background:'linear-gradient(to right,#9b5de5,transparent)', display:'inline-block' }} />
            Data Sovereignty
          </div>

          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'#ffffff', lineHeight:1.1, letterSpacing:'-0.04em', marginBottom:'20px', fontSize:'clamp(26px, 3.2vw, 50px)' }}>
            The Fortress.<br />Your Data.<br />Your Machine.
          </h2>

          <p style={{ fontSize:'clamp(13.5px, 1.3vw, 16px)', fontFamily:'DM Sans,sans-serif', fontWeight:300, lineHeight:1.78, color:'#9a90b0', marginBottom:'10px' }}>
            Every contact record, list segment, and campaign template lives exclusively inside the ProMail Desktop App—fully encrypted, fully offline. We never see it. Zero cloud exposure, by architectural design.
          </p>
          <p style={{ fontSize:'clamp(13.5px, 1.3vw, 16px)', fontFamily:'DM Sans,sans-serif', fontWeight:300, lineHeight:1.78, color:'#9a90b0', marginBottom:'28px' }}>
            Compose campaigns of any scale in air-gapped environments. Only the dispatch signal—stripped of all personal data—ever crosses the wire to our cloud.
          </p>

          <div style={{ display:'flex', gap:'clamp(16px, 3vw, 32px)', padding:'14px 18px', borderRadius:'12px', background:'rgba(108,59,156,0.07)', border:'1px solid rgba(108,59,156,0.14)', marginBottom:'28px', flexWrap:'wrap' as const }}>
            {TRUST_STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(16px, 1.8vw, 22px)', color:'#c084fc', letterSpacing:'-0.03em' }}>{s.val}</div>
                <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'10.5px', color:'#7a7090', textTransform:'uppercase' as const, letterSpacing:'0.1em', marginTop:'2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column' as const, gap:'10px' }}>
            {FEATURES.map((f, i) => {
              // Creating a slight delay stagger using math, directly tied to the scroll progress
              const itemProgress = Math.max(0, Math.min(1, scrollProgress * 1.2 - (i * 0.1)))
              
              return (
                <li
                  key={f.title}
                  style={{
                    display:      'flex',
                    alignItems:   'flex-start',
                    gap:          '12px',
                    padding:      'clamp(10px, 1.2vw, 14px) clamp(12px, 1.5vw, 16px)',
                    borderRadius: '13px',
                    background:   f.color === 'purple' ? 'rgba(108,59,156,0.07)' : 'rgba(16,185,129,0.05)',
                    border:       f.color === 'purple' ? '1px solid rgba(108,59,156,0.16)' : '1px solid rgba(16,185,129,0.12)',
                    
                    // The stagger makes the bottom ones slide up a bit slower!
                    opacity: itemProgress,
                    transform: `translateY(${(1 - itemProgress) * 30}px)`,
                    transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
                    willChange: 'transform, opacity'
                  }}
                >
                  <div style={{ width:'34px', height:'34px', flexShrink:0, borderRadius:'9px', background: f.color === 'purple' ? 'rgba(108,59,156,0.22)' : 'rgba(16,185,129,0.14)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>
                    {f.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px', flexWrap:'wrap' as const }}>
                      <span style={{ fontSize:'13px', fontFamily:'Syne,sans-serif', fontWeight:600, color:'#ffffff' }}>{f.title}</span>
                      <span style={{ fontSize:'9.5px', fontFamily:'Syne,sans-serif', fontWeight:600, padding:'2px 7px', borderRadius:'100px', letterSpacing:'0.08em', background: f.color === 'purple' ? 'rgba(108,59,156,0.25)' : 'rgba(16,185,129,0.18)', color: f.color === 'purple' ? '#c084fc' : '#10b981' }}>
                        {f.tag}
                      </span>
                    </div>
                    <div style={{ fontSize:'12px', fontFamily:'DM Sans,sans-serif', color:'#7a7090', lineHeight:1.6 }}>{f.body}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── RIGHT: MAILER ANIMATION (Manual Scroll Interpolation from Right) ── */}
        <div style={{
          opacity: scrollProgress,
          transform: `translateX(${(1 - scrollProgress) * 120}px)`,
          transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
          willChange: 'transform, opacity'
        }}>
          <div
            style={{
              height:       'clamp(340px, 45vw, 520px)',
              borderRadius: '22px',
              background:   'rgba(108,59,156,0.03)',
              border:       '1px solid rgba(108,59,156,0.18)',
              position:     'relative' as const,
              overflow:     'hidden',
            }}
          >
            {/* Strict Mailer Logic Engine */}
            <GlobalDispatchAnimation />

            {/* Bottom label */}
            <div style={{ position:'absolute', bottom:'14px', left:0, right:0, display:'flex', justifyContent:'center' }}>
              <div style={{ padding:'5px 13px', borderRadius:'100px', background:'rgba(108,59,156,0.20)', border:'1px solid rgba(108,59,156,0.32)', fontSize:'10.5px', fontFamily:'Syne,sans-serif', color:'#9b5de5', letterSpacing:'0.1em', textTransform:'uppercase' as const }}>
                Global Dispatch Engine
              </div>
            </div>

            {/* Top-right status indicator */}
            <div style={{ position:'absolute', top:'14px', right:'14px', display:'flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'100px', background:'rgba(16,185,129,0.10)', border:'1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', display:'inline-block', boxShadow:'0 0 6px #10b981', animation:'pulse-dot 2.2s ease-in-out infinite' }} />
              <span style={{ fontSize:'9.5px', fontFamily:'Syne,sans-serif', fontWeight:600, color:'#10b981', letterSpacing:'0.08em' }}>SECURED</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .fortress-grid {
            grid-template-columns: 1fr !important;
            padding: 52px 18px !important;
            gap: 28px !important;
          }
          .fortress-grid > div:first-child { order: 2; }
          .fortress-grid > div:last-child  { order: 1; height: 320px !important; border-radius: 16px !important; }
        }
        @media (max-width: 480px) {
          .fortress-grid { padding: 44px 14px !important; gap: 22px !important; }
          .fortress-grid > div:last-child { height: 260px !important; }
        }
      `}</style>
    </section>
  )
}