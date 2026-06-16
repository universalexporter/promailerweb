'use client'

import { useRef, useState, useEffect } from 'react'

// ═══════════════════════════════════════════════════════════════
//  THE HERMETIC SEAL — isolation animation
//  Left: chaotic infected shared-pool traffic slamming into a glowing
//  energy partition and bursting on impact. Right: your private network —
//  a calm orbiting core feeding a dedicated IP, clean packets flowing out,
//  with a live reputation gauge climbing to 100%.
// ═══════════════════════════════════════════════════════════════
function HermeticSealAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let animationId: number
    let t = 0
    const DPR = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) { canvas.width = parent.clientWidth * DPR; canvas.height = parent.clientHeight * DPR }
    }
    window.addEventListener('resize', resize)
    resize()

    // infected particles (left zone) heading for the barrier
    type Threat = { x: number; y: number; vx: number; vy: number; dead: number }
    let threats: Threat[] = []
    const spawnThreat = (w: number, h: number) => ({
      x: Math.random() * (w * 0.36),
      y: Math.random() * h,
      vx: (1.2 + Math.random() * 2.2) * DPR,
      vy: (Math.random() - 0.5) * 1.2 * DPR,
      dead: 0,
    })

    // burst flashes at impact
    type Burst = { x: number; y: number; r: number }
    let bursts: Burst[] = []

    // clean packets (right zone) flowing core -> IP -> out
    const cleanPackets = Array.from({ length: 14 }).map((_, i) => ({ offset: i * 36, speed: 2.4 + Math.random() * 1.2 }))

    const floatThreats = [
      { text: 'SPAM TRAPS', y: -90, s: 0.5 },
      { text: 'BLACKLIST', y: 10, s: 0.32 },
      { text: 'THROTTLING', y: 110, s: 0.7 },
    ]

    let reputation = 0

    const render = () => {
      t += 1
      const w = canvas.width, h = canvas.height, cy = h / 2
      ctx.clearRect(0, 0, w, h)
      const barrierX = w * 0.42

      // ── zone tints ──
      const lg = ctx.createLinearGradient(0, 0, barrierX, 0)
      lg.addColorStop(0, 'rgba(239,68,68,0.06)'); lg.addColorStop(1, 'rgba(239,68,68,0.01)')
      ctx.fillStyle = lg; ctx.fillRect(0, 0, barrierX, h)
      const rg = ctx.createLinearGradient(barrierX, 0, w, 0)
      rg.addColorStop(0, 'rgba(16,185,129,0.01)'); rg.addColorStop(1, 'rgba(16,185,129,0.07)')
      ctx.fillStyle = rg; ctx.fillRect(barrierX, 0, w - barrierX, h)

      // ── spawn + animate threats ──
      if (threats.length < 55 && t % 2 === 0) threats.push(spawnThreat(w, h))
      threats = threats.filter(p => p.dead < 1)
      threats.forEach(p => {
        if (p.dead > 0) { p.dead += 0.08; return }
        p.x += p.vx; p.y += p.vy
        if (p.x >= barrierX - 6 * DPR) {
          p.dead = 0.01
          bursts.push({ x: barrierX, y: p.y, r: 0 })
        }
        const a = 0.15 + Math.random() * 0.5
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.4 * DPR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(239,68,68,${a})`; ctx.fill()
      })

      // floating threat labels
      floatThreats.forEach(ft => {
        const fy = cy + ft.y * DPR + Math.sin(t * 0.01 * ft.s) * 12 * DPR
        ctx.font = `600 ${10 * DPR}px monospace`; ctx.fillStyle = 'rgba(239,68,68,0.45)'; ctx.textAlign = 'center'
        ctx.fillText(`[${ft.text}]`, barrierX * 0.5, fy)
      })

      // ── the energy barrier ──
      ctx.beginPath(); ctx.moveTo(barrierX, 0); ctx.lineTo(barrierX, h)
      ctx.strokeStyle = '#9b5de5'; ctx.lineWidth = 2 * DPR
      ctx.setLineDash([4 * DPR, 12 * DPR]); ctx.lineDashOffset = -t * 0.6 * DPR
      ctx.shadowBlur = 16 * DPR; ctx.shadowColor = '#9b5de5'; ctx.stroke()
      ctx.setLineDash([]); ctx.shadowBlur = 0
      // travelling scanner
      const scanY = cy + Math.sin(t * 0.018) * (h / 2.4)
      ctx.beginPath(); ctx.arc(barrierX, scanY, 5 * DPR, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 22 * DPR; ctx.shadowColor = '#9b5de5'; ctx.fill(); ctx.shadowBlur = 0

      // impact bursts
      bursts = bursts.filter(b => b.r < 1)
      bursts.forEach(b => {
        b.r += 0.06
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 26 * DPR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(155,93,229,${1 - b.r})`; ctx.lineWidth = 2 * DPR * (1 - b.r); ctx.stroke()
      })

      // ── private network: core -> IP ──
      const coreX = w * 0.64, ipX = w * 0.88
      ctx.beginPath(); ctx.moveTo(coreX, cy); ctx.lineTo(ipX, cy)
      ctx.strokeStyle = 'rgba(16,185,129,0.4)'; ctx.lineWidth = 2 * DPR; ctx.stroke()

      // core (breathing)
      const pulse = 18 * DPR + Math.sin(t * 0.05) * 6 * DPR
      ctx.beginPath(); ctx.arc(coreX, cy, 40 * DPR, 0, Math.PI * 2)
      ctx.fillStyle = '#070512'; ctx.fill()
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3 * DPR
      ctx.shadowBlur = 25 * DPR; ctx.shadowColor = '#10b981'; ctx.stroke(); ctx.shadowBlur = 0
      ctx.beginPath(); ctx.arc(coreX, cy, pulse, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(16,185,129,0.22)'; ctx.fill()

      // dedicated IP box
      ctx.beginPath(); ctx.roundRect(ipX - 24 * DPR, cy - 24 * DPR, 48 * DPR, 48 * DPR, 8 * DPR)
      ctx.fillStyle = '#070512'; ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * DPR
      ctx.shadowBlur = 18 * DPR; ctx.shadowColor = '#fff'; ctx.stroke(); ctx.shadowBlur = 0

      // clean packets flowing
      cleanPackets.forEach(p => {
        const route = (t * 0.15 * p.speed + p.offset) % 520
        if (route < ipX - coreX) {
          ctx.beginPath(); ctx.arc(coreX + route, cy, 4 * DPR, 0, Math.PI * 2)
          ctx.fillStyle = '#10b981'; ctx.shadowBlur = 12 * DPR; ctx.shadowColor = '#10b981'; ctx.fill(); ctx.shadowBlur = 0
        } else {
          const out = route - (ipX - coreX)
          ctx.beginPath(); ctx.arc(ipX + out, cy, 4 * DPR, 0, Math.PI * 2)
          ctx.fillStyle = '#fff'; ctx.shadowBlur = 12 * DPR; ctx.shadowColor = '#fff'; ctx.fill(); ctx.shadowBlur = 0
        }
      })

      // ── labels ──
      const label = (text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'center') => {
        ctx.font = `700 ${12 * DPR}px "Syne", sans-serif`; ctx.textAlign = align
        const m = ctx.measureText(text); const px = 9 * DPR, py = 7 * DPR
        const rx = align === 'center' ? x - m.width / 2 - px : x - px
        ctx.fillStyle = 'rgba(3,2,8,0.82)'; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1 * DPR
        ctx.fillRect(rx, y - 9 * DPR - py, m.width + px * 2, 13 * DPR + py * 2)
        ctx.strokeRect(rx, y - 9 * DPR - py, m.width + px * 2, 13 * DPR + py * 2)
        ctx.fillStyle = color; ctx.shadowBlur = 8 * DPR; ctx.shadowColor = color; ctx.fillText(text, x, y); ctx.shadowBlur = 0
      }
      label('SHARED POOL', barrierX * 0.5, 42 * DPR, '#ef4444')
      label('THE SEAL', barrierX, 42 * DPR, '#9b5de5')
      label('YOUR PRIVATE DB', coreX, cy - 58 * DPR, '#10b981')
      label('DEDICATED IP', ipX, cy - 58 * DPR, '#fff')

      // threats blocked counter
      ctx.font = `400 ${11 * DPR}px monospace`; ctx.fillStyle = 'rgba(239,68,68,0.8)'; ctx.textAlign = 'left'
      ctx.fillText(`BLOCKED: ${Math.floor(t / 6)}`, 16 * DPR, 70 * DPR)

      // ── live reputation gauge (bottom-right) ──
      if (reputation < 100) reputation += 0.4
      const gx = w - 130 * DPR, gy = h - 30 * DPR, gw = 110 * DPR
      ctx.font = `700 ${10 * DPR}px monospace`; ctx.fillStyle = '#8a80a0'; ctx.textAlign = 'left'
      ctx.fillText('SENDER REPUTATION', gx, gy - 12 * DPR)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(gx, gy - 6 * DPR, gw, 6 * DPR)
      const rgrad = ctx.createLinearGradient(gx, 0, gx + gw, 0)
      rgrad.addColorStop(0, '#9b5de5'); rgrad.addColorStop(1, '#10b981')
      ctx.fillStyle = rgrad; ctx.fillRect(gx, gy - 6 * DPR, gw * (reputation / 100), 6 * DPR)
      ctx.fillStyle = '#10b981'; ctx.textAlign = 'right'
      ctx.fillText(`${Math.floor(reputation)}%`, w - 16 * DPR, gy - 12 * DPR)

      animationId = requestAnimationFrame(render)
    }
    render()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId) }
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  COPY
// ═══════════════════════════════════════════════════════════════
const FEATURES = [
  { icon: '🌐', title: 'Your Own Domain & Reputation', body: 'Full SPF, DKIM and DMARC under your domain. You own the sender reputation — nobody can spend it but you.', tag: 'Your domain' },
  { icon: '🔗', title: 'Never Share A Queue', body: 'Your sending never touches another account\'s pool or feedback loop. Isolation is built into the architecture.', tag: 'Zero bleed' },
  { icon: '📊', title: 'Live Reputation Dashboard', body: 'Watch sender score, bounce rate and inbox placement in real time — per domain, per campaign.', tag: 'Live metrics' },
  { icon: '🛡️', title: 'Your Own Dedicated IP', body: 'A private IP with its own warm-up schedule. Your delivery ramp never shares a lane with anyone else.', tag: 'Dedicated IP' },
]

const TRUST_STATS = [
  { val: '100%', label: 'Isolated' },
  { val: '0', label: 'Shared queues' },
  { val: '1:1', label: 'IP per client' },
]

export default function SubAccountSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [p, setP] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const dist = Math.abs(window.innerHeight / 2 - (rect.top + rect.height / 2))
      const max = window.innerHeight * 0.75
      let raw = 1 - dist / max
      raw = Math.max(0, Math.min(1, raw))
      setP(raw * raw * (3 - 2 * raw))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(4,3,10,0.88) 0%, rgba(6,3,16,0.85) 100%)',
        borderTop: '1px solid rgba(16,185,129,0.12)', borderBottom: '1px solid rgba(16,185,129,0.10)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(to bottom, transparent, #10b981, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '45%', height: '70%', background: 'radial-gradient(ellipse at left, rgba(16,185,129,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div className="sub-grid" style={{ maxWidth: '1240px', margin: '0 auto', padding: 'clamp(52px,7vw,100px) clamp(18px,4vw,48px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(28px,5vw,72px)', alignItems: 'center' }}>

        {/* LEFT: ANIMATION (scale-in) */}
        <div style={{ opacity: p, transform: `scale(${0.85 + p * 0.15}) translateY(${(1 - p) * 40}px)`, transition: 'transform 0.1s ease-out, opacity 0.1s ease-out', willChange: 'transform, opacity' }}>
          <div className="sub-viz" style={{ borderRadius: '22px', border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(16,185,129,0.03) 0%, rgba(7,5,18,0.9) 100%)', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8)' }}>
            <HermeticSealAnimation />
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981', animation: 'pulse-dot 2.2s ease-in-out infinite' }} />
              <span style={{ fontSize: '9px', fontFamily: 'Syne,sans-serif', fontWeight: 800, color: '#fff', letterSpacing: '0.15em' }}>SEAL ACTIVE</span>
            </div>
          </div>
        </div>

        {/* RIGHT: COPY (slide up) */}
        <div style={{ opacity: p, transform: `translateY(${(1 - p) * 100}px)`, transition: 'transform 0.1s ease-out, opacity 0.1s ease-out', willChange: 'transform, opacity' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontFamily: 'Syne,sans-serif', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9b5de5', marginBottom: '18px' }}>
            <span style={{ width: '26px', height: '1px', background: 'linear-gradient(to right,#9b5de5,transparent)', display: 'inline-block' }} />
            Infrastructure Isolation
          </div>

          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '18px', fontSize: 'clamp(24px,3vw,46px)' }}>
            Nobody Else's Spam<br />Can Touch<br /><span style={{ background: 'linear-gradient(120deg,#9b5de5,#10b981)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your Reputation.</span>
          </h2>

          <p style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 300, lineHeight: 1.76, color: '#9a90b0', marginBottom: '28px', fontSize: 'clamp(12.5px,1.2vw,15px)' }}>
            Every client gets a sealed sub-account: your own domain, your own dedicated IP, your own reputation score. When another sender gets blacklisted, you never feel it. Isolation is architectural — not a promise.
          </p>

          <div style={{ display: 'flex', gap: 'clamp(14px,2.5vw,28px)', padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', marginBottom: '22px', flexWrap: 'wrap' }}>
            {TRUST_STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(15px,1.7vw,20px)', color: '#10b981', letterSpacing: '-0.03em' }}>{s.val}</div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '10px', color: '#7a7090', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {FEATURES.map((f, i) => {
              const ip = Math.max(0, Math.min(1, p * 1.3 - i * 0.15))
              return (
                <li key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', padding: 'clamp(10px,1.1vw,14px) clamp(12px,1.3vw,16px)', borderRadius: '12px', background: 'rgba(16,185,129,0.055)', border: '1px solid rgba(16,185,129,0.13)', opacity: ip, transform: `translateY(${(1 - ip) * 40}px)`, transition: 'transform 0.1s ease-out, opacity 0.1s ease-out', willChange: 'transform, opacity' }}>
                  <div style={{ width: '33px', height: '33px', flexShrink: 0, borderRadius: '9px', background: 'rgba(16,185,129,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{f.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12.5px', fontFamily: 'Syne,sans-serif', fontWeight: 600, color: '#fff' }}>{f.title}</span>
                      <span style={{ fontSize: '9px', fontFamily: 'Syne,sans-serif', fontWeight: 600, padding: '2px 7px', borderRadius: '100px', letterSpacing: '0.08em', background: 'rgba(16,185,129,0.18)', color: '#10b981' }}>{f.tag}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', fontFamily: 'DM Sans,sans-serif', color: '#7a7090', lineHeight: 1.6 }}>{f.body}</div>
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
          .sub-grid { grid-template-columns: 1fr !important; padding: 48px 16px !important; gap: 22px !important; }
          .sub-grid > div:first-child { order: 1; }
          .sub-grid > div:last-child  { order: 2; }
          .sub-viz { height: 340px !important; border-radius: 16px !important; }
        }
        @media (max-width: 400px) {
          .sub-grid { padding: 40px 13px !important; gap: 18px !important; }
          .sub-viz  { height: 300px !important; border-radius: 14px !important; }
        }
      `}</style>
    </section>
  )
}