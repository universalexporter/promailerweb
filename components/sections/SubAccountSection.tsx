'use client'

import { useRef, useEffect } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

// ═══════════════════════════════════════════════════════════════
//  1. UNBREAKABLE PHOTO ANIMATION LOOP
// ═══════════════════════════════════════════════════════════════
function SubAccountAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    canvas.width = 800
    canvas.height = 800

    const frameCount = 151 
    const images: HTMLImageElement[] = []
    let loadedImages = 0

    // UNBREAKABLE LOADER: Tries both normal and nested folder paths
    for (let i = 0; i < frameCount; i++) {
      const img = new Image()
      const paddedNumber = String(i + 1).padStart(3, '0')
      
      const correctPath = `/new-hero-sequence/ezgif-frame-${paddedNumber}.jpg`
      const fallbackNestedPath = `/public/new-hero-sequence/ezgif-frame-${paddedNumber}.jpg`

      img.onload = () => loadedImages++
      img.onerror = () => {
        // If it fails to find it normally, it automatically checks your nested folder!
        if (img.src.includes(correctPath)) {
          img.src = fallbackNestedPath
        }
      }
      
      img.src = correctPath
      images.push(img)
    }

    let frame = 0
    let animationId: number

    // Automatic 30fps loop
    const render = () => {
      if (loadedImages > 0 && images[frame]) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        
        const img = images[frame]
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width / 2) - (img.width / 2) * scale
        const y = (canvas.height / 2) - (img.height / 2) * scale
        
        context.drawImage(img, x, y, img.width * scale, img.height * scale)
      }
      
      frame = (frame + 1) % frameCount 
      
      setTimeout(() => {
        animationId = requestAnimationFrame(render)
      }, 1000 / 30) 
    }

    render()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-cover mix-blend-screen scale-[1.3]"
        style={{
          filter: 'contrast(1.3) brightness(0.9)', 
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 75%)',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 75%)',
        }}
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
  const ref = useRef<HTMLElement>(null!)
  useScrollReveal(ref)

  return (
    <section
      ref={ref}
      id="features"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(4,3,10,0.88) 0%, rgba(6,3,16,0.85) 100%)',
        borderTop:    '1px solid rgba(16,185,129,0.12)',
        borderBottom: '1px solid rgba(16,185,129,0.10)',
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
        {/* ── LEFT: THE NEW ANIMATION VAULT ─────────────────────────── */}
        <div
          data-reveal-left
          className="sub-viz"
          style={{
            borderRadius: '22px',
            border:       '1px solid rgba(16,185,129,0.18)',
            background:   'rgba(16,185,129,0.025)',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            position:     'relative' as const,
            overflow:     'hidden',
          }}
        >
          {/* Unbreakable Loop runs here */}
          <SubAccountAnimation />

          <div style={{ position:'absolute', bottom:'12px', left:0, right:0, display:'flex', justifyContent:'center' }}>
            <div style={{ padding:'5px 12px', borderRadius:'100px', background:'rgba(16,185,129,0.10)', border:'1px solid rgba(16,185,129,0.24)', fontSize:'10px', fontFamily:'Syne,sans-serif', color:'#10b981', letterSpacing:'0.1em', textTransform:'uppercase' as const }}>
              Hermetically Isolated Nodes
            </div>
          </div>

          <div style={{ position:'absolute', top:'12px', right:'12px', display:'flex', alignItems:'center', gap:'5px', padding:'3px 9px', borderRadius:'100px', background:'rgba(16,185,129,0.10)', border:'1px solid rgba(16,185,129,0.20)' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#10b981', display:'inline-block', boxShadow:'0 0 6px #10b981', animation:'pulse-dot 2.2s ease-in-out infinite' }} />
            <span style={{ fontSize:'9px', fontFamily:'Syne,sans-serif', fontWeight:600, color:'#10b981', letterSpacing:'0.08em' }}>LIVE</span>
          </div>
        </div>

        {/* ── RIGHT: COPY ─────────────────────────────── */}
        <div data-reveal-right>
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
            {FEATURES.map((f, i) => (
              <li
                key={f.title}
                data-stagger={i}
                style={{
                  display:      'flex',
                  alignItems:   'flex-start',
                  gap:          '11px',
                  padding:      'clamp(10px, 1.1vw, 14px) clamp(12px, 1.3vw, 16px)',
                  borderRadius: '12px',
                  background:   'rgba(16,185,129,0.055)',
                  border:       '1px solid rgba(16,185,129,0.13)',
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
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        .sub-viz { height: clamp(300px, 38vw, 480px); }
        @media (max-width: 900px) {
          .sub-grid { padding: 60px 24px !important; gap: 32px !important; }
          .sub-viz  { height: 340px !important; }
        }
        @media (max-width: 680px) {
          .sub-grid {
            grid-template-columns: 1fr !important;
            padding: 48px 16px !important;
            gap: 22px !important;
          }
          .sub-grid > div:first-child { order: 1; }
          .sub-grid > div:last-child  { order: 2; }
          .sub-viz { height: 260px !important; border-radius: 16px !important; }
        }
        @media (max-width: 400px) {
          .sub-grid { padding: 40px 13px !important; gap: 18px !important; }
          .sub-viz  { height: 220px !important; border-radius: 14px !important; }
        }
      `}</style>
    </section>
  )
}