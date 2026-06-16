'use client'

import { useRef, useState, useEffect } from 'react'

type MailEvent = {
  id: string; to: string; subject: string
  status: 'delivered' | 'bounced' | 'deferred'
  timestamp: string; cost: number
}

const MOCK_EMAILS = [
  { to: 'cto@techcorp.io',       subject: 'Q4 Infrastructure Brief'          },
  { to: 'sarah@digitalfirm.com', subject: 'Platform Access Confirmation'     },
  { to: 'team@startupx.co',      subject: 'Your Campaign Results Are Ready'  },
  { to: 'alex@growthco.com',     subject: 'Outbound Sequence #4 — Follow Up' },
  { to: 'hello@fintech.dev',     subject: 'Weekly Digest: Market Signals'    },
  { to: 'ops@enterprise.io',     subject: 'System Alert: Dispatch Confirmed' },
  { to: 'founder@scalehq.com',   subject: 'ProMail Campaign Performance'     },
  { to: 'info@cloudnative.dev',  subject: 'Onboarding Step 3 of 5'           },
]

// ── Ambient value-stream behind the terminal (depth layer) ──
function ValueStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let id: number; let t = 0
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => { const p = canvas.parentElement; if (p) { canvas.width = p.clientWidth * DPR; canvas.height = p.clientHeight * DPR } }
    window.addEventListener('resize', resize); resize()
    // drifting credits that fade as they "spend"
    const credits = Array.from({ length: 26 }).map(() => ({
      x: Math.random(), y: Math.random(), v: 0.0008 + Math.random() * 0.0016,
      r: 1.5 + Math.random() * 2.5, ph: Math.random() * Math.PI * 2,
    }))
    const render = () => {
      t += 1
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      credits.forEach(c => {
        c.y -= c.v
        if (c.y < -0.05) { c.y = 1.05; c.x = Math.random() }
        const px = c.x * w + Math.sin(t * 0.01 + c.ph) * 8 * DPR
        const py = c.y * h
        const fade = c.y < 0.25 ? c.y / 0.25 : 1
        const col = c.y < 0.4 ? '16,185,129' : '155,93,229'
        ctx.beginPath(); ctx.arc(px, py, c.r * DPR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${col},${0.18 * fade})`
        ctx.shadowBlur = 8 * DPR; ctx.shadowColor = `rgba(${col},0.4)`
        ctx.fill(); ctx.shadowBlur = 0
      })
      id = requestAnimationFrame(render)
    }
    render()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(id) }
  }, [])
  return <canvas ref={canvasRef} className="w-full h-full" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6 }} />
}

function LiveTerminal() {
  const [balance, setBalance] = useState<number>(2184.60)
  const [sent, setSent] = useState<number>(0)
  const [deducted, setDeducted] = useState<number>(0)
  const [events, setEvents] = useState<MailEvent[]>([])
  const [running, setRunning] = useState<boolean>(false)
  const [cost, setCost] = useState<number>(0.0035) // live overage rate (mirrors Support Desk pricing)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const counterRef = useRef(0)
  const totalCostRef = useRef(0)
  const costRef = useRef(0.0035)

  // Pull the real overage rate from the public pricing endpoint so this mirrors
  // whatever you set in the Support Desk → Pricing tab. Falls back to 0.0035.
  useEffect(() => {
    let active = true
    fetch('/api/admin/system-pricing')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!active || !d?.pricing?.length) return
        // use the first plan's overage_cost as the representative rate
        const rate = Number(d.pricing[0]?.overage_cost)
        if (rate && rate > 0) { setCost(rate); costRef.current = rate }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const statusColor: Record<string, string> = { delivered: '#10b981', bounced: '#ef4444', deferred: '#f97316' }

  function startSending() {
    if (running) return
    setRunning(true)
    window.dispatchEvent(new CustomEvent('promail:sending', { detail: { active: true } }))
    intervalRef.current = setInterval(() => {
      const batch = Math.floor(Math.random() * 3) + 1
      const newEvents: MailEvent[] = []
      const c = costRef.current
      for (let b = 0; b < batch; b++) {
        counterRef.current++
        const tmpl = MOCK_EMAILS[counterRef.current % MOCK_EMAILS.length]
        const rand = Math.random()
        const status: MailEvent['status'] = rand > 0.94 ? 'bounced' : rand > 0.89 ? 'deferred' : 'delivered'
        totalCostRef.current += c
        newEvents.push({ id: `msg_${Date.now()}_${b}`, to: tmpl.to, subject: tmpl.subject, status, timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), cost: c })
      }
      setSent(cc => cc + batch)
      setDeducted(parseFloat(totalCostRef.current.toFixed(6)))
      setBalance(bb => parseFloat((bb - batch * c).toFixed(4)))
      setEvents(prev => [...newEvents, ...prev].slice(0, 12))
    }, 750)
  }

  function stopSending() {
    if (intervalRef.current !== undefined) { clearInterval(intervalRef.current); intervalRef.current = undefined }
    setRunning(false)
    window.dispatchEvent(new CustomEvent('promail:sending', { detail: { active: false } }))
  }

  function resetSim() {
    stopSending()
    setBalance(2184.60); setSent(0); setDeducted(0); setEvents([])
    counterRef.current = 0; totalCostRef.current = 0
  }

  useEffect(() => () => { if (intervalRef.current !== undefined) clearInterval(intervalRef.current) }, [])

  return (
    <div className="terminal-wrap" style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${running ? 'rgba(16,185,129,0.38)' : 'rgba(16,185,129,0.18)'}`, background: '#020109', transition: 'border-color 0.4s', boxShadow: running ? '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.15)' : '0 20px 50px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderBottom: '1px solid rgba(16,185,129,0.09)', background: 'rgba(16,185,129,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
          <span style={{ marginLeft: '7px', fontSize: '10.5px', fontFamily: 'monospace', color: '#7a7090' }}>promail — live ledger</span>
        </div>
        {running && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#10b981' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }} />
            LIVE
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(16,185,129,0.07)' }}>
        {[
          { label: 'WALLET (USDT)', val: `${balance.toFixed(2)}`, color: '#10b981' },
          { label: 'SENT', val: sent.toLocaleString(), color: '#ffffff' },
          { label: 'DEDUCTED', val: `-${deducted.toFixed(4)}`, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 10px', textAlign: 'center', background: 'rgba(16,185,129,0.02)' }}>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#7a7090', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>{s.label}</div>
            <div className="term-stat-val" style={{ fontFamily: 'monospace', fontWeight: 600, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '7px', padding: '10px 12px 7px' }}>
        <button onClick={startSending} disabled={running} className="term-btn-start" style={{ flex: 1, borderRadius: '7px', fontFamily: 'Syne,sans-serif', fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', background: running ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.18)', color: running ? '#7a7090' : '#10b981', border: `1px solid ${running ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.35)'}`, transition: 'all 0.2s' }}>
          {running ? '▶ Dispatching…' : '▶ Start Dispatch'}
        </button>
        <button onClick={stopSending} className="term-btn-stop" style={{ flex: 1, borderRadius: '7px', fontFamily: 'Syne,sans-serif', fontWeight: 600, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          ■ Stop
        </button>
        <button onClick={resetSim} className="term-btn-reset" style={{ borderRadius: '7px', fontFamily: 'Syne,sans-serif', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#7a7090', border: '1px solid rgba(255,255,255,0.06)' }}>
          ↺
        </button>
      </div>

      <div className="term-stream" style={{ padding: '3px 9px 9px', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#6c3b9c transparent' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', fontFamily: 'monospace', color: '#7a7090' }} className="term-empty">
            <span style={{ display: 'inline-block', width: '6px', height: '12px', background: '#10b981', marginRight: '5px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
            Press Start — watch your balance move only as mail leaves.
          </div>
        ) : events.map(ev => (
          <div key={ev.id} className="term-row" style={{ display: 'flex', alignItems: 'center', gap: '7px', borderRadius: '7px', background: 'rgba(255,255,255,0.014)', marginBottom: '2px', fontFamily: 'monospace' }}>
            <span style={{ color: statusColor[ev.status], fontSize: '6px', flexShrink: 0 }}>●</span>
            <span className="term-ts" style={{ color: '#7a7090', flexShrink: 0 }}>{ev.timestamp}</span>
            <span className="term-to" style={{ color: 'rgba(255,255,255,0.72)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.to}</span>
            <span style={{ color: statusColor[ev.status], flexShrink: 0, fontWeight: 600 }} className="term-status">{ev.status}</span>
            <span style={{ color: '#ef4444', flexShrink: 0 }} className="term-cost">-{ev.cost.toFixed(5)} USDT</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '7px 12px', borderTop: '1px solid rgba(16,185,129,0.07)', background: 'rgba(16,185,129,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="term-foot-l" style={{ fontFamily: 'monospace', color: 'rgba(122,112,144,0.55)' }}>acct_isolated_847 · shield active</span>
        <span className="term-foot-r" style={{ fontFamily: 'monospace', color: '#10b981' }}>{cost} USDT / email</span>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: '🪙', title: 'Top Up With Crypto', body: 'Fund your wallet instantly in USDT. No bank holds, no monthly lock-in, global access.', green: true },
  { icon: '⚡', title: 'Charged Per Email Sent', body: 'A tiny amount deducts in real time only as mail leaves. Stop sending, and spending stops.', green: true },
  { icon: '🔄', title: 'Synced To Your Desktop App', body: 'Your balance mirrors instantly between the web portal and the desktop app.', green: false },
]

export default function LedgerSection() {
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
      id="ledger"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(4,3,10,0.88) 0%, rgba(2,8,6,0.85) 100%)',
        borderTop: '1px solid rgba(16,185,129,0.15)', borderBottom: '1px solid rgba(16,185,129,0.10)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'linear-gradient(to bottom, transparent, #10b981, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '45%', height: '70%', background: 'radial-gradient(ellipse at right, rgba(16,185,129,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div className="ledger-grid" style={{ maxWidth: '1240px', margin: '0 auto', padding: 'clamp(52px,7vw,100px) clamp(18px,4vw,48px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(28px,5vw,72px)', alignItems: 'start', perspective: '1200px' }}>

        {/* LEFT COPY */}
        <div style={{ opacity: p, transform: `translateX(${(1 - p) * -100}px) scale(${0.95 + p * 0.05})`, transition: 'transform 0.1s ease-out, opacity 0.1s ease-out', willChange: 'transform, opacity' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontFamily: 'Syne,sans-serif', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#10b981', marginBottom: '18px' }}>
            <span style={{ width: '26px', height: '1px', background: 'linear-gradient(to right,#10b981,transparent)', display: 'inline-block' }} />
            Pay As You Send
          </div>

          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '18px', fontSize: 'clamp(24px,3vw,46px)' }}>
            Pay Only For<br />Mail That<br /><span style={{ background: 'linear-gradient(120deg,#10b981,#9b5de5)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Actually Sends.</span>
          </h2>

          <p style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 300, lineHeight: 1.76, color: '#9a90b0', marginBottom: '10px', fontSize: 'clamp(12.5px,1.2vw,15px)' }}>
            Pick a plan for your monthly volume. When you go over, your USDT wallet takes over automatically — charging a tiny amount per email, in real time.
          </p>
          <p style={{ fontFamily: 'DM Sans,sans-serif', fontWeight: 300, lineHeight: 1.76, color: '#9a90b0', marginBottom: '28px', fontSize: 'clamp(12.5px,1.2vw,15px)' }}>
            Send 10,000 or 10,000,000. The moment you stop, the cost stops. Try the live meter on the right →
          </p>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {FEATURES.map((f, i) => {
              const ip = Math.max(0, Math.min(1, p * 1.3 - i * 0.15))
              return (
                <li key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', padding: 'clamp(10px,1.1vw,14px) clamp(12px,1.3vw,16px)', borderRadius: '12px', background: f.green ? 'rgba(16,185,129,0.055)' : 'rgba(108,59,156,0.065)', border: `1px solid ${f.green ? 'rgba(16,185,129,0.14)' : 'rgba(108,59,156,0.16)'}`, opacity: ip, transform: `translateX(${(1 - ip) * -40}px)`, transition: 'transform 0.1s ease-out, opacity 0.1s ease-out', willChange: 'transform, opacity' }}>
                  <div style={{ width: '33px', height: '33px', flexShrink: 0, borderRadius: '9px', background: f.green ? 'rgba(16,185,129,0.14)' : 'rgba(108,59,156,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontFamily: 'Syne,sans-serif', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{f.title}</div>
                    <div style={{ fontSize: '11.5px', fontFamily: 'DM Sans,sans-serif', color: '#7a7090', lineHeight: 1.6 }}>{f.body}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* RIGHT TERMINAL + ambient stream */}
        <div style={{ opacity: p, transform: `translateX(${(1 - p) * 120}px) rotateY(${(1 - p) * 20}deg) scale(${0.9 + p * 0.1})`, transition: 'transform 0.1s ease-out, opacity 0.1s ease-out', willChange: 'transform, opacity', transformOrigin: 'left center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '-30px', pointerEvents: 'none' }}><ValueStream /></div>
          <div style={{ position: 'relative' }}><LiveTerminal /></div>
        </div>
      </div>

      <style>{`
        .term-stat-val  { font-size: clamp(12px, 1.3vw, 15px); }
        .term-btn-start, .term-btn-stop { font-size: clamp(10.5px, 1vw, 12px); padding: clamp(6px,0.8vw,8px) 8px; }
        .term-btn-reset { font-size: clamp(10.5px, 1vw, 12px); padding: clamp(6px,0.8vw,8px) clamp(8px,1vw,14px); }
        .term-stream    { max-height: clamp(140px, 18vw, 240px); }
        .term-row       { padding: clamp(3px,0.4vw,5px) clamp(5px,0.6vw,8px); font-size: clamp(9px, 0.85vw, 11px); }
        .term-ts        { width: clamp(44px, 5vw, 60px); }
        .term-status    { display: none; }
        .term-cost      { font-size: clamp(8.5px, 0.8vw, 11px); }
        .term-empty     { padding: clamp(16px, 2vw, 28px) 0; font-size: clamp(10px, 1vw, 12px); }
        .term-foot-l    { font-size: clamp(8.5px, 0.8vw, 10.5px); }
        .term-foot-r    { font-size: clamp(8.5px, 0.8vw, 10.5px); }

        @media (max-width: 900px) {
          .ledger-grid { padding: 60px 24px !important; gap: 36px !important; }
        }
        @media (max-width: 680px) {
          .ledger-grid { grid-template-columns: 1fr !important; padding: 48px 16px !important; gap: 24px !important; perspective: none !important; }
          .ledger-grid > div:first-child { order: 2; }
          .ledger-grid > div:last-child  { order: 1; }
          .terminal-wrap { border-radius: 12px !important; }
          .term-stream   { max-height: 150px !important; }
          .term-row      { font-size: 9.5px !important; padding: 3px 6px !important; }
          .term-ts       { width: 42px !important; }
          .term-stat-val { font-size: 13px !important; }
          .term-btn-start, .term-btn-stop { font-size: 10.5px !important; padding: 7px 6px !important; }
          .term-foot-l   { display: none; }
        }
        @media (max-width: 400px) {
          .ledger-grid   { padding: 40px 13px !important; }
          .terminal-wrap { border-radius: 10px !important; }
          .term-stream   { max-height: 120px !important; }
          .term-row      { font-size: 8.5px !important; }
        }
      `}</style>
    </section>
  )
}