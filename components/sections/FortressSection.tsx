'use client'

import { useRef, useEffect } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

// ═══════════════════════════════════════════════════════════════
//  1. THE PHOTO ANIMATION (Your 241 Generated Images)
// ═══════════════════════════════════════════════════════════════
function VaultPhotoAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    canvas.width = 800
    canvas.height = 800

    const frameCount = 241 // Your 8-second generation
    const currentFrame = (index: number) => 
      `/hero-sequence/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`

    const images: HTMLImageElement[] = []
    let loadedImages = 0

    // Preload all 241 photos
    for (let i = 0; i < frameCount; i++) {
      const img = new Image()
      img.src = currentFrame(i)
      img.onload = () => loadedImages++
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
      
      frame = (frame + 1) % frameCount // Loop endlessly
      
      setTimeout(() => {
        animationId = requestAnimationFrame(render)
      }, 1000 / 30) // Play at 30 FPS
    }

    render()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
      <canvas 
        ref={canvasRef} 
        // scale-[1.3] makes it fill the card nicely
        className="w-full h-full object-cover mix-blend-screen scale-[1.3]"
        style={{
          // Deletes the dark background from your generated photos
          filter: 'contrast(1.3) brightness(0.9)', 
          // Fades the edges so it looks like a glowing orb, not a square picture
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
  const ref = useRef<HTMLElement>(null!)
  useScrollReveal(ref)

  return (
    <section
      ref={ref}
      id="security"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(4,3,10,0.97) 0%, rgba(10,5,22,0.95) 100%)',
        borderTop:    '1px solid rgba(108,59,156,0.22)',
        borderBottom: '1px solid rgba(108,59,156,0.16)',
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
        {/* ── LEFT: COPY ─────────────────────────────────── */}
        <div data-reveal-left>
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
            {FEATURES.map((f, i) => (
              <li
                key={f.title}
                data-stagger={i}
                style={{
                  display:      'flex',
                  alignItems:   'flex-start',
                  gap:          '12px',
                  padding:      'clamp(10px, 1.2vw, 14px) clamp(12px, 1.5vw, 16px)',
                  borderRadius: '13px',
                  background:   f.color === 'purple' ? 'rgba(108,59,156,0.07)' : 'rgba(16,185,129,0.05)',
                  border:       f.color === 'purple' ? '1px solid rgba(108,59,156,0.16)' : '1px solid rgba(16,185,129,0.12)',
                  transition:   'all 0.3s ease',
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
            ))}
          </ul>
        </div>

        {/* ── RIGHT: THE PHOTO ANIMATION VAULT ───────────────── */}
        <div
          data-reveal-right
          style={{
            height:       'clamp(340px, 45vw, 520px)',
            borderRadius: '22px',
            background:   'rgba(108,59,156,0.03)',
            border:       '1px solid rgba(108,59,156,0.18)',
            position:     'relative' as const,
            overflow:     'hidden',
          }}
        >
          {/* Automatically plays your 241 generated photos! */}
          <VaultPhotoAnimation />

          {/* Bottom label */}
          <div style={{ position:'absolute', bottom:'14px', left:0, right:0, display:'flex', justifyContent:'center' }}>
            <div style={{ padding:'5px 13px', borderRadius:'100px', background:'rgba(108,59,156,0.20)', border:'1px solid rgba(108,59,156,0.32)', fontSize:'10.5px', fontFamily:'Syne,sans-serif', color:'#9b5de5', letterSpacing:'0.1em', textTransform:'uppercase' as const }}>
              Encrypted Local Vault
            </div>
          </div>

          {/* Top-right status indicator */}
          <div style={{ position:'absolute', top:'14px', right:'14px', display:'flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'100px', background:'rgba(16,185,129,0.10)', border:'1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', display:'inline-block', boxShadow:'0 0 6px #10b981', animation:'pulse-dot 2.2s ease-in-out infinite' }} />
            <span style={{ fontSize:'9.5px', fontFamily:'Syne,sans-serif', fontWeight:600, color:'#10b981', letterSpacing:'0.08em' }}>SECURED</span>
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