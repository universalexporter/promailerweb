'use client'

import { useRef, useEffect, useState } from 'react'

// ═══════════════════════════════════════════════════════════════
//  SOVEREIGN VAULT — high-class encrypted dispatch animation
//  Layers: parallax starfield · pulsing vault core · orbiting shield
//  ring · encrypted packets that travel along glowing tunnels and
//  "decrypt" into inbox nodes with success ripples.
// ═══════════════════════════════════════════════════════════════
function SovereignVaultAnimation() {
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
      if (parent) {
        canvas.width = parent.clientWidth * DPR
        canvas.height = parent.clientHeight * DPR
      }
    }
    window.addEventListener('resize', resize)
    resize()

    // ── Parallax starfield (depth) ──
    const stars = Array.from({ length: 90 }).map(() => ({
      x: Math.random(), y: Math.random(),
      z: Math.random() * 0.8 + 0.2,           // depth factor
      tw: Math.random() * Math.PI * 2,         // twinkle phase
    }))

    // ── Inbox destinations in a clean arc above the vault ──
    const numDests = 6
    const destinations = Array.from({ length: numDests }).map((_, i) => {
      const spread = Math.PI * 0.86
      const start = Math.PI + (Math.PI - spread) / 2
      const angle = start + spread * (i / (numDests - 1))
      return { angle, ripples: [] as number[], landGlow: 0 }
    })

    // ── Encrypted packets ──
    const packets = Array.from({ length: 10 }).map((_, i) => ({
      destIndex: Math.floor(Math.random() * numDests),
      progress: -(i * 0.18),
      speed: 0.0055 + Math.random() * 0.003,
      trail: [] as { x: number; y: number }[],
    }))

    const lerp = (a: number, b: number, n: number) => a + (b - a) * n

    const render = () => {
      t += 1
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      const engineX = w / 2
      const engineY = h - 70 * DPR
      const radius = Math.min(w * 0.42, h * 0.62)

      // ── 1. Parallax starfield ──
      stars.forEach(s => {
        const px = s.x * w
        const py = s.y * h
        const tw = 0.4 + Math.abs(Math.sin(t * 0.01 + s.tw)) * 0.6
        ctx.beginPath()
        ctx.arc(px, py, s.z * 1.6 * DPR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,176,224,${0.10 + s.z * 0.22 * tw})`
        ctx.fill()
      })

      // ── 2. Tunnels + inbox nodes ──
      destinations.forEach(dest => {
        const dx = engineX + Math.cos(dest.angle) * radius
        const dy = engineY + Math.sin(dest.angle) * radius

        // gradient tunnel
        const g = ctx.createLinearGradient(engineX, engineY, dx, dy)
        g.addColorStop(0, 'rgba(16,185,129,0.10)')
        g.addColorStop(1, 'rgba(155,93,229,0.10)')
        ctx.beginPath()
        ctx.moveTo(engineX, engineY)
        ctx.lineTo(dx, dy)
        ctx.strokeStyle = g
        ctx.lineWidth = 1 * DPR
        ctx.stroke()

        // inbox node (rounded)
        dest.landGlow = Math.max(0, dest.landGlow - 0.02)
        const nodeR = 14 * DPR
        ctx.beginPath()
        ctx.roundRect(dx - nodeR * 1.4, dy - nodeR, nodeR * 2.8, nodeR * 2, 6 * DPR)
        ctx.fillStyle = '#070512'
        ctx.fill()
        ctx.strokeStyle = `rgba(155,93,229,${0.35 + dest.landGlow})`
        ctx.lineWidth = 1.5 * DPR
        ctx.shadowBlur = dest.landGlow * 20
        ctx.shadowColor = '#10b981'
        ctx.stroke()
        ctx.shadowBlur = 0

        // envelope glyph
        ctx.strokeStyle = `rgba(200,176,224,${0.5 + dest.landGlow})`
        ctx.lineWidth = 1 * DPR
        ctx.beginPath()
        ctx.rect(dx - 8 * DPR, dy - 5 * DPR, 16 * DPR, 10 * DPR)
        ctx.moveTo(dx - 8 * DPR, dy - 5 * DPR)
        ctx.lineTo(dx, dy + 1 * DPR)
        ctx.lineTo(dx + 8 * DPR, dy - 5 * DPR)
        ctx.stroke()

        // ripples
        for (let i = dest.ripples.length - 1; i >= 0; i--) {
          dest.ripples[i] += 0.022
          const r = dest.ripples[i]
          if (r > 1) { dest.ripples.splice(i, 1); continue }
          ctx.beginPath()
          ctx.arc(dx, dy, r * 44 * DPR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(16,185,129,${1 - r})`
          ctx.lineWidth = 2 * DPR * (1 - r)
          ctx.stroke()
        }
      })

      // ── 3. Packets with trails ──
      packets.forEach(p => {
        p.progress += p.speed
        if (p.progress >= 1) {
          const d = destinations[p.destIndex]
          d.ripples.push(0); d.landGlow = 1
          p.progress = -Math.random() * 0.4
          p.destIndex = Math.floor(Math.random() * numDests)
          p.trail = []
        }
        if (p.progress > 0) {
          const dest = destinations[p.destIndex]
          const dx = engineX + Math.cos(dest.angle) * radius
          const dy = engineY + Math.sin(dest.angle) * radius
          const x = lerp(engineX, dx, p.progress)
          const y = lerp(engineY, dy, p.progress)

          p.trail.push({ x, y })
          if (p.trail.length > 14) p.trail.shift()

          // trail
          p.trail.forEach((pt, i) => {
            const a = (i / p.trail.length) * 0.5
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, 1.6 * DPR, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(155,93,229,${a})`
            ctx.fill()
          })

          let alpha = 1
          if (p.progress < 0.12) alpha = p.progress / 0.12
          if (p.progress > 0.88) alpha = (1 - p.progress) / 0.12

          // packet core — shifts purple→green as it nears inbox (decrypts)
          const decrypt = p.progress
          const cr = Math.round(lerp(155, 16, decrypt))
          const cg = Math.round(lerp(93, 185, decrypt))
          const cb = Math.round(lerp(229, 129, decrypt))
          ctx.beginPath()
          ctx.arc(x, y, 4 * DPR, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`
          ctx.shadowBlur = 12 * DPR
          ctx.shadowColor = `rgba(${cr},${cg},${cb},${alpha})`
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      // ── 4. Orbiting shield ring around the vault ──
      const ringR = 64 * DPR
      for (let i = 0; i < 3; i++) {
        const a = t * 0.012 + (i * Math.PI * 2) / 3
        const ox = engineX + Math.cos(a) * ringR
        const oy = engineY + Math.sin(a) * ringR * 0.4   // elliptical = pseudo-3D
        ctx.beginPath()
        ctx.arc(ox, oy, 3 * DPR, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(155,93,229,0.8)'
        ctx.shadowBlur = 10 * DPR
        ctx.shadowColor = '#9b5de5'
        ctx.fill()
        ctx.shadowBlur = 0
      }
      ctx.beginPath()
      ctx.ellipse(engineX, engineY, ringR, ringR * 0.4, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(155,93,229,0.18)'
      ctx.lineWidth = 1 * DPR
      ctx.stroke()

      // ── 5. The vault core ──
      const pulse = 1 + Math.sin(t * 0.04) * 0.05
      const coreR = 46 * DPR * pulse
      const grad = ctx.createRadialGradient(engineX, engineY, 4 * DPR, engineX, engineY, coreR)
      grad.addColorStop(0, 'rgba(16,185,129,0.35)')
      grad.addColorStop(0.6, 'rgba(7,5,18,0.95)')
      grad.addColorStop(1, 'rgba(7,5,18,1)')
      ctx.beginPath()
      ctx.arc(engineX, engineY, coreR, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 3 * DPR
      ctx.shadowBlur = 28 * DPR
      ctx.shadowColor = '#10b981'
      ctx.stroke()
      ctx.shadowBlur = 0

      // lock glyph
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 2.4 * DPR
      const lx = engineX, ly = engineY
      ctx.beginPath()
      ctx.roundRect(lx - 9 * DPR, ly - 2 * DPR, 18 * DPR, 14 * DPR, 2 * DPR)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(lx, ly - 2 * DPR, 6 * DPR, Math.PI, 0)
      ctx.stroke()

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
  { icon: '🔒', title: 'Encrypted On Your Hardware', body: 'Contacts, templates and campaigns are AES-256 encrypted at rest on your own machine. We never receive them.', tag: 'AES-256', color: 'purple' },
  { icon: '🛰️', title: 'Build Fully Offline', body: 'Compose campaigns of any size with zero internet. Only the send signal ever leaves your device.', tag: 'Air-gapped', color: 'purple' },
  { icon: '👁️', title: 'We Are Blind By Design', body: 'Our cloud sees a stripped payload — no lists, no recipients, no metadata you did not choose to share.', tag: 'Zero exposure', color: 'green' },
  { icon: '🔑', title: 'You Hold The Keys', body: 'Encryption keys never leave your computer. Nothing can be unlocked without you — not even by us.', tag: 'Your keys', color: 'green' },
]

const TRUST_STATS = [
  { val: '256-bit', label: 'Encryption' },
  { val: '0', label: 'Data we can see' },
  { val: '100%', label: 'Stored locally' },
]

export default function FortressSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [p, setP] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const dist = Math.abs(window.innerHeight / 2 - (rect.top + rect.height / 2))
      const max = window.innerHeight * 0.72
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
      id="security"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(4,3,10,0.4) 0%, rgba(10,5,22,0.3) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(108,59,156,0.22)', borderBottom: '1px solid rgba(108,59,156,0.16)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(to bottom, transparent, #6c3b9c 40%, #6c3b9c 60%, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(108,59,156,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div className="fortress-grid" style={{ maxWidth: '1240px', margin: '0 auto', padding: 'clamp(60px,8vw,110px) clamp(20px,4vw,48px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'center' }}>

        {/* LEFT COPY */}
        <div style={{ opacity: p, transform: `translateX(${(1 - p) * -120}px)`, transition: 'transform 0.1s ease-out, opacity 0.1s ease-out', willChange: 'transform, opacity' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontFamily: 'Syne,sans-serif', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9b5de5', marginBottom: '20px' }}>
            <span style={{ width: '28px', height: '1px', background: 'linear-gradient(to right,#9b5de5,transparent)', display: 'inline-block' }} />
            Data Sovereignty
          </div>

          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '20px', fontSize: 'clamp(26px,3.2vw,50px)' }}>
            Your Data<br />Never Leaves<br /><span style={{ background: 'linear-gradient(120deg,#10b981,#9b5de5)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Your Machine.</span>
          </h2>

          <p style={{ fontSize: 'clamp(13.5px,1.3vw,16px)', fontFamily: 'DM Sans,sans-serif', fontWeight: 300, lineHeight: 1.78, color: '#9a90b0', marginBottom: '28px' }}>
            Every contact and campaign lives encrypted inside the desktop app — offline, on your hardware. Only an anonymous send signal ever reaches our cloud. Total privacy, by design.
          </p>

          <div style={{ display: 'flex', gap: 'clamp(16px,3vw,32px)', padding: '14px 18px', borderRadius: '12px', background: 'rgba(108,59,156,0.07)', border: '1px solid rgba(108,59,156,0.14)', marginBottom: '28px', flexWrap: 'wrap' }}>
            {TRUST_STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(16px,1.8vw,22px)', color: '#c084fc', letterSpacing: '-0.03em' }}>{s.val}</div>
                <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '10.5px', color: '#7a7090', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FEATURES.map((f, i) => {
              const ip = Math.max(0, Math.min(1, p * 1.2 - i * 0.1))
              return (
                <li key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: 'clamp(10px,1.2vw,14px) clamp(12px,1.5vw,16px)', borderRadius: '13px', background: f.color === 'purple' ? 'rgba(108,59,156,0.07)' : 'rgba(16,185,129,0.05)', border: f.color === 'purple' ? '1px solid rgba(108,59,156,0.16)' : '1px solid rgba(16,185,129,0.12)', opacity: ip, transform: `translateY(${(1 - ip) * 30}px)`, transition: 'transform 0.1s ease-out, opacity 0.1s ease-out', willChange: 'transform, opacity' }}>
                  <div style={{ width: '34px', height: '34px', flexShrink: 0, borderRadius: '9px', background: f.color === 'purple' ? 'rgba(108,59,156,0.22)' : 'rgba(16,185,129,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{f.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontFamily: 'Syne,sans-serif', fontWeight: 600, color: '#fff' }}>{f.title}</span>
                      <span style={{ fontSize: '9.5px', fontFamily: 'Syne,sans-serif', fontWeight: 600, padding: '2px 7px', borderRadius: '100px', letterSpacing: '0.08em', background: f.color === 'purple' ? 'rgba(108,59,156,0.25)' : 'rgba(16,185,129,0.18)', color: f.color === 'purple' ? '#c084fc' : '#10b981' }}>{f.tag}</span>
                    </div>
                    <div style={{ fontSize: '12px', fontFamily: 'DM Sans,sans-serif', color: '#7a7090', lineHeight: 1.6 }}>{f.body}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* RIGHT ANIMATION */}
        <div style={{ opacity: p, transform: `translateX(${(1 - p) * 120}px)`, transition: 'transform 0.1s ease-out, opacity 0.1s ease-out', willChange: 'transform, opacity' }}>
          <div className="fortress-viz" style={{ borderRadius: '22px', background: 'rgba(108,59,156,0.03)', border: '1px solid rgba(108,59,156,0.18)', position: 'relative', overflow: 'hidden' }}>
            <SovereignVaultAnimation />
            <div style={{ position: 'absolute', bottom: '14px', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <div style={{ padding: '5px 13px', borderRadius: '100px', background: 'rgba(108,59,156,0.20)', border: '1px solid rgba(108,59,156,0.32)', fontSize: '10.5px', fontFamily: 'Syne,sans-serif', color: '#9b5de5', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sovereign Dispatch</div>
            </div>
            <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981', animation: 'pulse-dot 2.2s ease-in-out infinite' }} />
              <span style={{ fontSize: '9.5px', fontFamily: 'Syne,sans-serif', fontWeight: 600, color: '#10b981', letterSpacing: '0.08em' }}>ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fortress-viz { height: clamp(340px, 45vw, 520px); }
        @media (max-width: 768px) {
          .fortress-grid { grid-template-columns: 1fr !important; padding: 52px 18px !important; gap: 28px !important; }
          .fortress-grid > div:first-child { order: 2; }
          .fortress-grid > div:last-child  { order: 1; }
          .fortress-viz { height: 300px !important; border-radius: 16px !important; }
        }
        @media (max-width: 480px) {
          .fortress-grid { padding: 44px 14px !important; gap: 22px !important; }
          .fortress-viz { height: 260px !important; }
        }
      `}</style>
    </section>
  )
}