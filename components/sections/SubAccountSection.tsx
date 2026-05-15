'use client'

import { useRef, useState, useEffect } from 'react'

// ═══════════════════════════════════════════════════════════════
//  1. HIGH-CLASS MARKETING SCHEMATIC ANIMATION (Untouched)
// ═══════════════════════════════════════════════════════════════
function SubAccountAnimation() {
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

    // Particles for Shared Cloud (Red) and Private DB (Green)
    const badTraffic = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * 300,
      y: Math.random() * 1000,
      speedX: 1 + Math.random() * 2,
      speedY: (Math.random() - 0.5) * 2
    }))

    const cleanTraffic = Array.from({ length: 15 }).map((_, i) => ({
      offset: i * 40,
      speed: 3 + Math.random()
    }))

    // Floating Threat Labels in the Shared Zone
    const threats = [
      { text: "SPAM TRAPS", yOffset: -80, speed: 0.5 },
      { text: "IP BLACKLIST", yOffset: 20, speed: 0.3 },
      { text: "THROTTLING", yOffset: 120, speed: 0.7 }
    ]

    // Marketing Terminal Sequences
    const terminalLines = [
      "> INITIALIZING HERMETIC SEAL...",
      "> BLOCKING SHARED POOL NOISE...",
      "> SECURING PRIVATE DATABASE...",
      "> ROUTING VIA DEDICATED IP...",
      "> REPUTATION SCORE: 100% SECURE"
    ]

    const render = () => {
      const time = Date.now()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const w = canvas.width
      const h = canvas.height
      const centerY = h / 2

      // Helper function for high-visibility text labels
      const drawLabel = (text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left') => {
        ctx.font = '700 13px "Syne", sans-serif'
        ctx.textAlign = align
        const metrics = ctx.measureText(text)
        const paddingX = 10
        const paddingY = 8
        
        ctx.fillStyle = 'rgba(3, 2, 8, 0.8)' // Dark glass background
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`
        ctx.lineWidth = 1
        
        const rectX = align === 'center' ? x - metrics.width/2 - paddingX : align === 'right' ? x - metrics.width - paddingX : x - paddingX
        const rectY = y - 10 - paddingY
        const rectW = metrics.width + paddingX * 2
        const rectH = 14 + paddingY * 2
        
        ctx.fillRect(rectX, rectY, rectW, rectH)
        ctx.strokeRect(rectX, rectY, rectW, rectH)
        
        ctx.fillStyle = color
        ctx.shadowBlur = 10
        ctx.shadowColor = color
        ctx.fillText(text, x, y)
        ctx.shadowBlur = 0
      }

      // ── 1. BACKGROUND ZONES ──
      const partitionX = w * 0.4
      
      // Shared Zone Gradient
      const sharedGrad = ctx.createLinearGradient(0, 0, partitionX, 0)
      sharedGrad.addColorStop(0, 'rgba(239, 68, 68, 0.05)')
      sharedGrad.addColorStop(1, 'rgba(239, 68, 68, 0.01)')
      ctx.fillStyle = sharedGrad
      ctx.fillRect(0, 0, partitionX, h)
      
      // Private Zone Gradient
      const privateGrad = ctx.createLinearGradient(partitionX, 0, w, 0)
      privateGrad.addColorStop(0, 'rgba(16, 185, 129, 0.01)')
      privateGrad.addColorStop(1, 'rgba(16, 185, 129, 0.05)')
      ctx.fillStyle = privateGrad
      ctx.fillRect(partitionX, 0, w - partitionX, h)

      // ── 2. THE HARD PARTITION (Firewall Scanner) ──
      ctx.beginPath()
      ctx.moveTo(partitionX, 0)
      ctx.lineTo(partitionX, h)
      ctx.strokeStyle = '#9b5de5'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 15])
      ctx.lineDashOffset = -time * 0.05
      ctx.stroke()
      ctx.setLineDash([])

      // Glowing scanner moving up and down the partition
      const scannerY = centerY + Math.sin(time * 0.001) * (h / 2.5)
      ctx.beginPath()
      ctx.arc(partitionX, scannerY, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowBlur = 20
      ctx.shadowColor = '#9b5de5'
      ctx.fill()
      ctx.shadowBlur = 0

      // ── 3. ANIMATE BAD TRAFFIC & THREAT LABELS ──
      badTraffic.forEach(p => {
        p.x += p.speedX
        p.y += p.speedY
        if (p.x > partitionX - 15) {
          p.x = Math.random() * -50 
          p.y = Math.random() * h
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(239, 68, 68, ${Math.random() * 0.6 + 0.1})`
        ctx.fill()
      })

      // Floating Threat Text in Red Zone
      threats.forEach((t, i) => {
        const floatY = centerY + t.yOffset + Math.sin(time * 0.001 * t.speed) * 15
        ctx.font = '600 10px monospace'
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'
        ctx.textAlign = 'center'
        ctx.fillText(`[WARNING: ${t.text}]`, partitionX / 2, floatY)
      })

      // ── 4. DRAW SCHEMATIC NODES & CONNECTORS ──
      const nodeDbX = w * 0.65
      const nodeIpX = w * 0.88

      // Connector Line (DB to IP)
      ctx.beginPath()
      ctx.moveTo(nodeDbX, centerY)
      ctx.lineTo(nodeIpX, centerY)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Node: Private Network DB
      ctx.beginPath()
      ctx.arc(nodeDbX, centerY, 40, 0, Math.PI * 2)
      ctx.fillStyle = '#070512'
      ctx.fill()
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 3
      ctx.shadowBlur = 25
      ctx.shadowColor = '#10b981'
      ctx.stroke()
      ctx.shadowBlur = 0

      // Inner pulse for DB
      ctx.beginPath()
      ctx.arc(nodeDbX, centerY, 18 + Math.sin(time * 0.004) * 6, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)'
      ctx.fill()

      // Node: Dedicated IP
      ctx.beginPath()
      ctx.rect(nodeIpX - 25, centerY - 25, 50, 50)
      ctx.fillStyle = '#070512'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.shadowBlur = 20
      ctx.shadowColor = '#ffffff'
      ctx.stroke()
      ctx.shadowBlur = 0

      // ── 5. ANIMATE CLEAN TRAFFIC (DB -> IP -> Out) ──
      cleanTraffic.forEach(p => {
        const routeTime = (time * 0.15 * p.speed + p.offset) % 500
        
        if (routeTime > 0 && routeTime < (nodeIpX - nodeDbX)) {
          ctx.beginPath()
          ctx.arc(nodeDbX + routeTime, centerY, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#10b981'
          ctx.shadowBlur = 12
          ctx.shadowColor = '#10b981'
          ctx.fill()
        } else if (routeTime > (nodeIpX - nodeDbX)) {
          const outDist = routeTime - (nodeIpX - nodeDbX)
          ctx.beginPath()
          ctx.arc(nodeIpX + outDist, centerY, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.shadowBlur = 12
          ctx.shadowColor = '#ffffff'
          ctx.fill()
        }
      })
      ctx.shadowBlur = 0

      // ── 6. HIGH-VISIBILITY SCHEMATIC LABELS ──
      
      // Shared Cloud
      drawLabel('SHARED CLOUD', 40, 50, '#ef4444', 'left')
      ctx.font = '400 11px monospace'
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'
      ctx.textAlign = 'left'
      ctx.fillText(`THREATS BLOCKED: ${Math.floor(time / 80)}`, 40, 75)

      // Hard Partition
      drawLabel('HARD PARTITION', partitionX, 50, '#9b5de5', 'center')

      // Private DB
      drawLabel('PRIVATE DB', nodeDbX, centerY - 65, '#10b981', 'center')
      
      // Dedicated IP
      drawLabel('DEDICATED IP', nodeIpX, centerY - 65, '#ffffff', 'center')

      // ── 7. MARKETING EXPLANATION TERMINAL ──
      // Calculate which marketing line to show based on time loop (5 seconds per line)
      const lineIndex = Math.floor((time / 4000) % terminalLines.length)
      const currentLine = terminalLines[lineIndex]
      // Typewriter effect logic
      const charCount = Math.floor((time % 4000) / 50)
      const visibleText = currentLine.substring(0, charCount)
      const showCursor = Math.floor(time / 400) % 2 === 0 ? '_' : ''

      const termX = w - 40
      const termY = h - 40

      ctx.textAlign = 'right'
      ctx.font = '700 11px monospace'
      ctx.fillStyle = '#8a80a0'
      ctx.fillText('PROMAIL ISOLATION PROTOCOL V2.0', termX, termY - 20)
      
      ctx.font = '700 13px monospace'
      ctx.fillStyle = '#10b981'
      ctx.shadowBlur = 10
      ctx.shadowColor = '#10b981'
      ctx.fillText(visibleText + showCursor, termX, termY)
      ctx.shadowBlur = 0

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
    icon:  '🌐',
    title: 'Bring Your Own Domain',
    body:  'Full SPF, DKIM, and DMARC provisioning under your domain. You own the reputation. We supply pristine, warmed IP pools.',
    tag:   'Custom domain',
  },
  {
    icon:  '🔗',
    title: 'Hard Network Partitioning',
    body:  'Your traffic never shares a queue, pool, or feedback loop with any other account. Neighbor-immunity is architectural, not a promise.',
    tag:   'Zero bleed',
  },
  {
    icon:  '📊',
    title: 'Real-Time Reputation Dashboard',
    body:  'Monitor sender score, bounce rates, and inbox placement per domain, per campaign, per individual send.',
    tag:   'Live metrics',
  },
  {
    icon:  '🛡️',
    title: 'Isolated IP Warm-Up Pools',
    body:  'Every client gets a dedicated IP warm-up schedule. Your delivery ramp never shares lanes with any other sender on the platform.',
    tag:   'Dedicated IPs',
  },
]

const TRUST_STATS = [
  { val: '100%', label: 'Domain isolation' },
  { val: '0',    label: 'Shared queues'   },
  { val: '∞',    label: 'Sub-accounts'    },
]

// ═══════════════════════════════════════════════════════════════
//  MAIN SECTION
// ═══════════════════════════════════════════════════════════════
export default function SubAccountSection() {
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
      const maxDistance = window.innerHeight * 0.75 

      // Creates a number between 0 and 1
      let rawProgress = 1 - (distanceToCenter / maxDistance)
      rawProgress = Math.max(0, Math.min(1, rawProgress))

      // Smooth step easing
      const smoothProgress = rawProgress * rawProgress * (3 - 2 * rawProgress)
      
      setScrollProgress(smoothProgress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() 

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{
        position: 'relative',
        // Background kept exactly as requested!
        background: 'linear-gradient(135deg, rgba(4,3,10,0.88) 0%, rgba(6,3,16,0.85) 100%)',
        borderTop:    '1px solid rgba(16,185,129,0.12)',
        borderBottom: '1px solid rgba(16,185,129,0.10)',
        overflow: 'hidden'
      }}
    >
      <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'3px', background:'linear-gradient(to bottom, transparent, #10b981, transparent)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:'45%', height:'70%', background:'radial-gradient(ellipse at left, rgba(16,185,129,0.04) 0%, transparent 65%)', pointerEvents:'none' }} />

      <div
        className="sub-grid"
        style={{
          maxWidth: '1240px',
          margin:   '0 auto',
          padding:  'clamp(52px, 7vw, 100px) clamp(18px, 4vw, 48px)',
          display:  'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:      'clamp(28px, 5vw, 72px)',
          alignItems: 'center',
        }}
      >
        {/* ── LEFT: THE SCHEMATIC VAULT (Depth Scale In) ─────────────────────────── */}
        <div style={{
          opacity: scrollProgress,
          // Starts smaller (0.85) and scales up to full size as you scroll
          transform: `scale(${0.85 + scrollProgress * 0.15}) translateY(${(1 - scrollProgress) * 40}px)`,
          transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
          willChange: 'transform, opacity'
        }}>
          <div
            className="sub-viz"
            style={{
              borderRadius: '22px',
              border:       '1px solid rgba(255,255,255,0.08)',
              background:   'linear-gradient(180deg, rgba(16,185,129,0.03) 0%, rgba(7,5,18,0.9) 100%)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              position:     'relative' as const,
              overflow:     'hidden',
              boxShadow:    'inset 0 0 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Text-Driven Schematic Engine */}
            <SubAccountAnimation />

            <div style={{ position:'absolute', top:'16px', right:'16px', display:'flex', alignItems:'center', gap:'6px', padding:'4px 12px', borderRadius:'100px', background:'rgba(0,0,0,0.8)', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(10px)' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', display:'inline-block', boxShadow:'0 0 10px #10b981', animation:'pulse-dot 2.2s ease-in-out infinite' }} />
              <span style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', fontWeight:800, color:'#ffffff', letterSpacing:'0.15em' }}>ISOLATION LIVE</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: COPY (Vertical Slide Up) ─────────────────────────────── */}
        <div style={{
          opacity: scrollProgress,
          // Slides vertically up from the bottom instead of from the side
          transform: `translateY(${(1 - scrollProgress) * 100}px)`,
          transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
          willChange: 'transform, opacity'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'11px', fontFamily:'Syne,sans-serif', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase' as const, color:'#9b5de5', marginBottom:'18px' }}>
            <span style={{ width:'26px', height:'1px', background:'linear-gradient(to right,#9b5de5,transparent)', display:'inline-block' }} />
            Infrastructure Isolation
          </div>

          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'#ffffff', lineHeight:1.1, letterSpacing:'-0.04em', marginBottom:'18px', fontSize:'clamp(24px, 3vw, 46px)' }}>
            Your Reputation.<br />Hermetically<br />Sealed.
          </h2>

          <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:300, lineHeight:1.76, color:'#9a90b0', marginBottom:'10px', fontSize:'clamp(12.5px, 1.2vw, 15px)' }}>
            ProMail provisions every client with a completely isolated sub-account: dedicated sending domain, dedicated IP warm-up pool, and an independent reputation score. You are a universe of one.
          </p>
          <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:300, lineHeight:1.76, color:'#9a90b0', marginBottom:'22px', fontSize:'clamp(12.5px, 1.2vw, 15px)' }}>
            When another operator triggers a deliverability event, your infrastructure is entirely unaffected. Neighbor-immunity is architectural, not a promise.
          </p>

          <div style={{ display:'flex', gap:'clamp(14px, 2.5vw, 28px)', padding:'12px 16px', borderRadius:'12px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.12)', marginBottom:'22px', flexWrap:'wrap' as const }}>
            {TRUST_STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(15px, 1.7vw, 20px)', color:'#10b981', letterSpacing:'-0.03em' }}>{s.val}</div>
                <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:'10px', color:'#7a7090', textTransform:'uppercase' as const, letterSpacing:'0.1em', marginTop:'2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column' as const, gap:'9px' }}>
            {FEATURES.map((f, i) => {
              // Creating a vertical stagger for each feature card based on scroll
              const itemProgress = Math.max(0, Math.min(1, scrollProgress * 1.3 - (i * 0.15)))
              
              return (
                <li
                  key={f.title}
                  style={{
                    display:      'flex',
                    alignItems:   'flex-start',
                    gap:          '11px',
                    padding:      'clamp(10px, 1.1vw, 14px) clamp(12px, 1.3vw, 16px)',
                    borderRadius: '12px',
                    background:   'rgba(16,185,129,0.055)',
                    border:       '1px solid rgba(16,185,129,0.13)',
                    opacity:      itemProgress,
                    transform:    `translateY(${(1 - itemProgress) * 40}px)`,
                    transition:   'transform 0.1s ease-out, opacity 0.1s ease-out',
                    willChange:   'transform, opacity'
                  }}
                >
                  <div style={{ width:'33px', height:'33px', flexShrink:0, borderRadius:'9px', background:'rgba(16,185,129,0.14)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>
                    {f.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'2px', flexWrap:'wrap' as const }}>
                      <span style={{ fontSize:'12.5px', fontFamily:'Syne,sans-serif', fontWeight:600, color:'#ffffff' }}>{f.title}</span>
                      <span style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', fontWeight:600, padding:'2px 7px', borderRadius:'100px', letterSpacing:'0.08em', background:'rgba(16,185,129,0.18)', color:'#10b981' }}>
                        {f.tag}
                      </span>
                    </div>
                    <div style={{ fontSize:'11.5px', fontFamily:'DM Sans,sans-serif', color:'#7a7090', lineHeight:1.6 }}>{f.body}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <style>{`
        .sub-viz { height: clamp(400px, 45vw, 550px); }
        @media (max-width: 900px) {
          .sub-grid { padding: 60px 24px !important; gap: 32px !important; }
          .sub-viz  { height: 400px !important; }
        }
        @media (max-width: 680px) {
          .sub-grid {
            grid-template-columns: 1fr !important;
            padding: 48px 16px !important;
            gap: 22px !important;
          }
          .sub-grid > div:first-child { order: 1; }
          .sub-grid > div:last-child  { order: 2; }
          .sub-viz { height: 360px !important; border-radius: 16px !important; }
        }
        @media (max-width: 400px) {
          .sub-grid { padding: 40px 13px !important; gap: 18px !important; }
          .sub-viz  { height: 320px !important; border-radius: 14px !important; }
        }
      `}</style>
    </section>
  )
}