'use client'

import { useRef, useState, useEffect } from 'react'

type MailEvent = {
  id:        string
  to:        string
  subject:   string
  status:    'delivered' | 'bounced' | 'deferred'
  timestamp: string
  cost:      number
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

function LiveTerminal() {
  const [balance,   setBalance]   = useState<number>(2184.60)
  const [sent,      setSent]      = useState<number>(0)
  const [deducted,  setDeducted]  = useState<number>(0)
  const [events,    setEvents]    = useState<MailEvent[]>([])
  const [running,   setRunning]   = useState<boolean>(false)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const counterRef   = useRef(0)
  const totalCostRef = useRef(0)
  const COST = 0.00074

  const statusColor: Record<string, string> = {
    delivered: '#10b981', bounced: '#ef4444', deferred: '#f97316',
  }

  function startSending() {
    if (running) return
    setRunning(true)
    window.dispatchEvent(new CustomEvent('promail:sending', { detail: { active: true } }))
    intervalRef.current = setInterval(() => {
      const batch = Math.floor(Math.random() * 3) + 1
      const newEvents: MailEvent[] = []
      for (let b = 0; b < batch; b++) {
        counterRef.current++
        const tmpl = MOCK_EMAILS[counterRef.current % MOCK_EMAILS.length]
        const rand = Math.random()
        const status: MailEvent['status'] = rand > 0.94 ? 'bounced' : rand > 0.89 ? 'deferred' : 'delivered'
        totalCostRef.current += COST
        newEvents.push({
          id:        `msg_${Date.now()}_${b}`,
          to:        tmpl.to,
          subject:   tmpl.subject,
          status,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          cost:      COST,
        })
      }
      setSent(c        => c + batch)
      setDeducted(      parseFloat(totalCostRef.current.toFixed(6)))
      setBalance(b     => parseFloat((b - batch * COST).toFixed(4)))
      setEvents(prev   => [...newEvents, ...prev].slice(0, 12))
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
    <div
      className="terminal-wrap"
      style={{
        borderRadius: '16px',
        overflow:     'hidden',
        border:       `1px solid ${running ? 'rgba(16,185,129,0.38)' : 'rgba(16,185,129,0.18)'}`,
        background:   '#020109',
        transition:   'border-color 0.4s',
        // Added a subtle drop shadow to pop against the background
        boxShadow:    '0 20px 50px rgba(0,0,0,0.5)',
      }}
    >
      {/* Window chrome */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderBottom:'1px solid rgba(16,185,129,0.09)', background:'rgba(16,185,129,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#ff5f57', display:'inline-block' }} />
          <span style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#febc2e', display:'inline-block' }} />
          <span style={{ width:'9px', height:'9px', borderRadius:'50%', background:'#28c840', display:'inline-block' }} />
          <span style={{ marginLeft:'7px', fontSize:'10.5px', fontFamily:'monospace', color:'#7a7090' }}>promail — virtual ledger</span>
        </div>
        {running && (
          <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#10b981' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#10b981', animation:'pulse 1s ease-in-out infinite', display:'inline-block' }} />
            LIVE
          </span>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderBottom:'1px solid rgba(16,185,129,0.07)' }}>
        {[
          { label:'BALANCE',  val:`$${balance.toFixed(2)}`,   color:'#10b981' },
          { label:'SENT',     val:sent.toLocaleString(),       color:'#ffffff' },
          { label:'DEDUCTED', val:`-$${deducted.toFixed(4)}`,  color:'#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ padding:'10px 10px', textAlign:'center' as const, background:'rgba(16,185,129,0.02)' }}>
            <div style={{ fontSize:'9px', fontFamily:'monospace', color:'#7a7090', letterSpacing:'0.12em', textTransform:'uppercase' as const, marginBottom:'3px' }}>{s.label}</div>
            <div className="term-stat-val" style={{ fontFamily:'monospace', fontWeight:600, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:'7px', padding:'10px 12px 7px' }}>
        <button
          onClick={startSending}
          disabled={running}
          className="term-btn-start"
          style={{
            flex:1, borderRadius:'7px',
            fontFamily:'Syne,sans-serif', fontWeight:600,
            cursor: running ? 'not-allowed' : 'pointer',
            background: running ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.18)',
            color:      running ? '#7a7090' : '#10b981',
            border:     `1px solid ${running ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.35)'}`,
            transition: 'all 0.2s',
          }}
        >
          {running ? '▶ Dispatching…' : '▶ Start Dispatch'}
        </button>
        <button
          onClick={stopSending}
          className="term-btn-stop"
          style={{ flex:1, borderRadius:'7px', fontFamily:'Syne,sans-serif', fontWeight:600, cursor:'pointer', background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' }}
        >
          ■ Stop
        </button>
        <button
          onClick={resetSim}
          className="term-btn-reset"
          style={{ borderRadius:'7px', fontFamily:'Syne,sans-serif', fontWeight:600, cursor:'pointer', background:'transparent', color:'#7a7090', border:'1px solid rgba(255,255,255,0.06)' }}
        >
          ↺
        </button>
      </div>

      {/* Event stream */}
      <div
        className="term-stream"
        style={{ padding:'3px 9px 9px', overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'#6c3b9c transparent' }}
      >
        {events.length === 0 ? (
          <div style={{ textAlign:'center' as const, fontFamily:'monospace', color:'#7a7090' }} className="term-empty">
            <span style={{ display:'inline-block', width:'6px', height:'12px', background:'#10b981', marginRight:'5px', verticalAlign:'middle', animation:'blink 1s step-end infinite' }} />
            Awaiting dispatch signal…
          </div>
        ) : events.map(ev => (
          <div
            key={ev.id}
            className="term-row"
            style={{ display:'flex', alignItems:'center', gap:'7px', borderRadius:'7px', background:'rgba(255,255,255,0.014)', marginBottom:'2px', fontFamily:'monospace' }}
          >
            <span style={{ color: statusColor[ev.status], fontSize:'6px', flexShrink:0 }}>●</span>
            <span className="term-ts"  style={{ color:'#7a7090', flexShrink:0 }}>{ev.timestamp}</span>
            <span className="term-to"  style={{ color:'rgba(255,255,255,0.72)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{ev.to}</span>
            <span style={{ color: statusColor[ev.status], flexShrink:0, fontWeight:600 }} className="term-status">{ev.status}</span>
            <span style={{ color:'#ef4444', flexShrink:0 }} className="term-cost">-${ev.cost.toFixed(5)}</span>
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div style={{ padding:'7px 12px', borderTop:'1px solid rgba(16,185,129,0.07)', background:'rgba(16,185,129,0.02)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span className="term-foot-l" style={{ fontFamily:'monospace', color:'rgba(122,112,144,0.55)' }}>acct_isolated_847 · shield active</span>
        <span className="term-foot-r" style={{ fontFamily:'monospace', color:'#10b981' }}>$0.00074 / email</span>
      </div>
    </div>
  )
}

// ─── Features data ────────────────────────────────────────────
const FEATURES = [
  { icon:'₿', title:'Fiat & Crypto Deposits',  body:'Stripe (card, ACH, SEPA) or major cryptocurrencies. Instant ledger credit in your Desktop App.', green:true  },
  { icon:'⚡', title:'Micro-Deduction Engine',  body:'$0.00074 per email deducted in real time. Full immutable audit trail in your desktop client.',    green:true  },
  { icon:'🔄', title:'Sub-50ms Balance Sync',   body:'Web portal balance mirrors in Desktop App via encrypted persistent WebSocket tunnel.',             green:false },
]

// ─── Main section ─────────────────────────────────────────────
export default function LedgerSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Custom High-End Scroll Interpolation Engine
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      
      const rect = sectionRef.current.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const sectionCenter = rect.top + rect.height / 2
      
      const distanceToCenter = Math.abs(viewportCenter - sectionCenter)
      const maxDistance = window.innerHeight * 0.75 

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
      id="ledger"
      style={{
        position: 'relative',
        // Background kept exactly as requested
        background: 'linear-gradient(135deg, rgba(4,3,10,0.88) 0%, rgba(2,8,6,0.85) 100%)',
        borderTop:    '1px solid rgba(16,185,129,0.15)',
        borderBottom: '1px solid rgba(16,185,129,0.10)',
        overflow: 'hidden',
      }}
    >
      {/* Green left accent */}
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background:'linear-gradient(to bottom, transparent, #10b981, transparent)', pointerEvents:'none' }} />

      {/* Subtle right-side glow */}
      <div style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', width:'45%', height:'70%', background:'radial-gradient(ellipse at right, rgba(16,185,129,0.04) 0%, transparent 65%)', pointerEvents:'none' }} />

      <div
        className="ledger-grid"
        style={{
          maxWidth: '1240px',
          margin:   '0 auto',
          padding:  'clamp(52px, 7vw, 100px) clamp(18px, 4vw, 48px)',
          display:  'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:      'clamp(28px, 5vw, 72px)',
          alignItems: 'start',
          perspective: '1200px', // Adds 3D space for the Terminal swing
        }}
      >
        {/* ── LEFT: Copy (Slide & Subtle Scale-Up) ─────────────────────────────── */}
        <div style={{
          opacity: scrollProgress,
          transform: `translateX(${(1 - scrollProgress) * -100}px) scale(${0.95 + scrollProgress * 0.05})`,
          transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
          willChange: 'transform, opacity'
        }}>
          {/* Label */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'11px', fontFamily:'Syne,sans-serif', fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase' as const, color:'#10b981', marginBottom:'18px' }}>
            <span style={{ width:'26px', height:'1px', background:'linear-gradient(to right,#10b981,transparent)', display:'inline-block' }} />
            Virtual Ledger
          </div>

          <h2 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'#ffffff', lineHeight:1.1, letterSpacing:'-0.04em', marginBottom:'18px', fontSize:'clamp(24px, 3vw, 46px)' }}>
            Pay for exactly<br />what you send.<br />
            <span style={{ color:'#10b981', textShadow:'0 0 28px rgba(16,185,129,0.5)' }}>Not a byte more.</span>
          </h2>

          <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:300, lineHeight:1.76, color:'#9a90b0', marginBottom:'10px', fontSize:'clamp(12.5px, 1.2vw, 15px)' }}>
            Deposit funds once via Stripe or crypto on the secure web portal. Your balance mirrors instantly inside the Desktop App. Every email micro-deducts in real time—no rounding, no minimums, no monthly lock-in.
          </p>
          <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:300, lineHeight:1.76, color:'#9a90b0', marginBottom:'28px', fontSize:'clamp(12.5px, 1.2vw, 15px)' }}>
            Run 10,000 or 10,000,000. When you stop sending, costs stop. The only honest pricing model in bulk email.
          </p>

          {/* Feature list with unique slide-in-from-left stagger */}
          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column' as const, gap:'9px' }}>
            {FEATURES.map((f, i) => {
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
                    background:   f.green ? 'rgba(16,185,129,0.055)' : 'rgba(108,59,156,0.065)',
                    border:       `1px solid ${f.green ? 'rgba(16,185,129,0.14)' : 'rgba(108,59,156,0.16)'}`,
                    opacity: itemProgress,
                    transform: `translateX(${(1 - itemProgress) * -40}px)`,
                    transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
                    willChange: 'transform, opacity'
                  }}
                >
                  <div style={{ width:'33px', height:'33px', flexShrink:0, borderRadius:'9px', background: f.green ? 'rgba(16,185,129,0.14)' : 'rgba(108,59,156,0.20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:'12.5px', fontFamily:'Syne,sans-serif', fontWeight:600, color:'#ffffff', marginBottom:'2px' }}>{f.title}</div>
                    <div style={{ fontSize:'11.5px', fontFamily:'DM Sans,sans-serif', color:'#7a7090', lineHeight:1.6 }}>{f.body}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ── RIGHT: Terminal (Slide + 3D Perspective Swing) ─────────────────────────── */}
        <div style={{
          opacity: scrollProgress,
          transform: `translateX(${(1 - scrollProgress) * 120}px) rotateY(${(1 - scrollProgress) * 20}deg) scale(${0.9 + scrollProgress * 0.1})`,
          transition: 'transform 0.1s ease-out, opacity 0.1s ease-out',
          willChange: 'transform, opacity',
          transformOrigin: 'left center'
        }}>
          <LiveTerminal />
        </div>
      </div>

      {/* ── ALL RESPONSIVE STYLES ──────────────────────── */}
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
          .ledger-grid {
            padding: 60px 24px !important;
            gap:     36px !important;
          }
          .term-status { display: none !important; }
        }

        @media (max-width: 680px) {
          .ledger-grid {
            grid-template-columns: 1fr !important;
            padding: 48px 16px !important;
            gap:     24px !important;
            perspective: none !important; /* Disable 3D swing on mobile to prevent overflow */
          }
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