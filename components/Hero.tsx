'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import DownloadButton from '@/components/DownloadButton'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current || !sectionRef.current) return

    const ctx = gsap.context(() => {

      // Entrance: stagger items in
      gsap.fromTo('[data-hero]',
        { opacity: 0, y: 40, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power4.out', stagger: 0.1, delay: 0.2 }
      )

      // Scroll-out: content slides left + fades as user scrolls
      // This progressively reveals the 3D scene on the right
      gsap.to(contentRef.current, {
        x: '-22%',
        opacity: 0.12,
        scale: 0.92,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '65% top',
          scrub: 1.4,
        },
      })

    }, contentRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="hero"
      style={{ minHeight:'100vh', display:'flex', alignItems:'center', position:'relative', overflow:'hidden' }}
    >
      {/* Background glows */}
      <div style={{ position:'absolute', top:'50%', left:'-5%', transform:'translateY(-50%)', width:'55vw', height:'55vw', background:'radial-gradient(ellipse, rgba(108,59,156,0.13) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:0, left:'5%', width:'40vw', height:'30vw', background:'radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 65%)', pointerEvents:'none' }} />

      {/* ── CONTENT — left side only, 3D visible right ── */}
      <div ref={contentRef} className="hc">

        <div data-hero className="hc-badge">
          <span className="hc-dot" />
          Enterprise Hybrid Mail Infrastructure
        </div>

        <h1 data-hero className="hc-h1">
          The Ultimate<br />
          Desktop-to-Cloud<br />
          <span className="hc-green">Sending Engine.</span>
        </h1>

        <p data-hero className="hc-sub">
          Prepare offline. Dispatch in the cloud. Total privacy meets enterprise
          delivery—engineered for operators who cannot afford a single point of failure.
        </p>

        <div data-hero className="hc-btns">
          <DownloadButton className="hc-btn-p" align="left"
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-2px)';el.style.boxShadow='0 0 48px rgba(108,59,156,0.68),0 6px 22px rgba(0,0,0,0.5)'}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(0)';el.style.boxShadow='0 0 22px rgba(108,59,156,0.5),0 4px 18px rgba(0,0,0,0.4)'}}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download the App
          </DownloadButton>
          <Link href="/dashboard" className="hc-btn-s" style={{ textDecoration: 'none' }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(255,255,255,0.1)';el.style.borderColor='rgba(255,255,255,0.2)';el.style.color='#fff'}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(255,255,255,0.05)';el.style.borderColor='rgba(255,255,255,0.1)';el.style.color='#d4cfe8'}}
          >
            Fund Your Account
          </Link>
        </div>

        <div data-hero className="hc-stats">
          {[
            { val:'100%', label:'Data Stays Local',      color:'#10b981', glow:'0 0 18px rgba(16,185,129,0.55)'  },
            { val:'∞',    label:'Isolated Sub-Accounts', color:'#9b5de5', glow:'0 0 18px rgba(155,93,229,0.55)'  },
            { val:'$0',   label:'Monthly Subscription',  color:'#ffffff', glow:'none'                             },
          ].map(({ val, label, color, glow }) => (
            <div key={label}>
              <div className="hc-stat-val" style={{ color, textShadow:glow }}>{val}</div>
              <div className="hc-stat-lbl">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SCROLL INDICATOR — glowing, letter-by-letter, animated line ── */}
      <div className="si" aria-hidden="true">
        {/* "SCROLL" letters with staggered white+purple glow */}
        <div className="si-label">
          {'SCROLL'.split('').map((ch, i) => (
            <span key={i} className="si-ch" style={{ animationDelay: `${i * 0.1}s` }}>{ch}</span>
          ))}
        </div>

        {/* Animated gradient line: purple → green fill slides down */}
        <div className="si-track">
          <div className="si-fill" />
        </div>

        {/* Green glowing arrow */}
        <span className="si-arrow">↓</span>
      </div>

      <style>{`

        /* ══════ CONTENT COLUMN ══════ */
        .hc {
          /* 46% max on desktop so 3D fills the right side */
          width: 46%;
          max-width: 560px;
          position: relative;
          z-index: 2;
          padding: 100px 0 80px 48px;
          will-change: transform, opacity;
          text-align: left;
        }

        /* ══════ BADGE ══════ */
        .hc-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 13px; margin-bottom: 20px; border-radius: 100px;
          background: rgba(108,59,156,0.12); border: 1px solid rgba(108,59,156,0.3);
          font-size: 10px; font-family: 'Syne',sans-serif; font-weight: 600;
          color: #9b5de5; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .hc-dot {
          width:6px; height:6px; border-radius:50%; background:#10b981;
          flex-shrink:0; box-shadow:0 0 8px #10b981;
          animation: pulse-dot 2.2s ease-in-out infinite; display:inline-block;
        }

        /* ══════ H1 ══════ */
        .hc-h1 {
          font-family: 'Syne', sans-serif; font-weight: 800;
          color: #fff; line-height: 1.08; letter-spacing: -0.035em;
          margin-bottom: 16px;
          font-size: clamp(24px, 3.2vw, 46px);
        }
        .hc-green { color:#10b981; text-shadow:0 0 40px rgba(16,185,129,0.6); }

        /* ══════ SUB ══════ */
        .hc-sub {
          font-size: clamp(12.5px, 1.1vw, 15px);
          font-family: 'DM Sans',sans-serif; font-weight:300;
          line-height:1.8; color:#9080a8; margin-bottom:28px; max-width:400px;
        }

        /* ══════ BUTTONS ══════ */
        .hc-btns { display:flex; gap:10px; flex-wrap:wrap; }
        .hc-btn-p, .hc-btn-s {
          display:flex; align-items:center; gap:7px; border-radius:9px;
          font-family:'Syne',sans-serif; font-weight:700; cursor:pointer; white-space:nowrap;
          transition: transform .2s, box-shadow .2s, background .2s, border-color .2s, color .2s;
          padding: clamp(9px,1vw,11px) clamp(14px,1.6vw,24px);
          font-size: clamp(11px,0.95vw,13px);
        }
        .hc-btn-p {
          color:#fff; background:linear-gradient(135deg,#6c3b9c,#8b4fcc); border:none;
          box-shadow:0 0 22px rgba(108,59,156,0.5),0 4px 18px rgba(0,0,0,0.4);
        }
        .hc-btn-s {
          color:#d4cfe8; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
        }

        /* ══════ STATS ══════ */
        .hc-stats {
          display:flex; flex-wrap:wrap; gap:clamp(16px,2.5vw,38px);
          margin-top:36px; padding-top:22px; border-top:1px solid rgba(255,255,255,0.06);
        }
        .hc-stat-val {
          font-family:'Syne',sans-serif; font-weight:800; letter-spacing:-0.04em;
          font-size:clamp(17px,1.7vw,24px);
        }
        .hc-stat-lbl {
          font-family:'DM Sans',sans-serif; font-size:9.5px; color:#7a7090;
          text-transform:uppercase; letter-spacing:0.1em; margin-top:3px;
        }

        /* ══════ SCROLL INDICATOR ══════ */
        .si {
          position: absolute;
          bottom: 26px;
          left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          z-index: 5;
        }

        /* Letters — white glow pulsing into purple */
        .si-label {
          display: flex; gap: 2px;
          font-family: 'Syne', sans-serif;
          font-size: 8.5px; font-weight: 700; letter-spacing: 0.25em;
        }
        .si-ch {
          color: #ffffff;
          text-shadow:
            0 0 6px #fff,
            0 0 14px rgba(255,255,255,0.8),
            0 0 28px rgba(155,93,229,0.7),
            0 0 50px rgba(155,93,229,0.35);
          animation: si-letter 2.6s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes si-letter {
          0%,100% {
            color: #fff;
            text-shadow: 0 0 6px #fff, 0 0 14px rgba(255,255,255,0.8), 0 0 28px rgba(155,93,229,0.7);
          }
          50% {
            color: #c084fc;
            text-shadow: 0 0 10px #c084fc, 0 0 24px rgba(192,132,252,0.9), 0 0 48px rgba(155,93,229,0.6), 0 0 80px rgba(108,59,156,0.3);
          }
        }

        /* Animated line: gradient fill slides downward */
        .si-track {
          width: 1.5px; height: 48px;
          background: rgba(155,93,229,0.15);
          border-radius: 2px;
          position: relative; overflow: hidden;
        }
        .si-fill {
          position: absolute; top: 0; left: 0; right: 0;
          height: 60%;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            #9b5de5 20%,
            #c084fc 50%,
            #10b981 80%,
            transparent 100%
          );
          box-shadow: 0 0 6px #9b5de5, 0 0 14px rgba(155,93,229,0.5);
          animation: si-slide 1.9s ease-in-out infinite;
        }
        @keyframes si-slide {
          0%   { transform: translateY(-100%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(200%); opacity: 0; }
        }

        /* Green glowing arrow */
        .si-arrow {
          font-size: 11px; font-family: 'DM Sans',sans-serif;
          color: #10b981;
          text-shadow: 0 0 10px #10b981, 0 0 24px rgba(16,185,129,0.7), 0 0 44px rgba(16,185,129,0.35);
          animation: si-arrow 1.9s ease-in-out infinite;
        }
        @keyframes si-arrow {
          0%,100% { transform: translateY(0); text-shadow: 0 0 10px #10b981, 0 0 24px rgba(16,185,129,0.7); }
          50%      { transform: translateY(5px); text-shadow: 0 0 16px #10b981, 0 0 40px rgba(16,185,129,0.9), 0 0 64px rgba(16,185,129,0.4); }
        }

        /* ══════ TABLET ≤900px ══════ */
        @media (max-width: 900px) {
          .hc { width:55%; padding:88px 0 70px 28px; }
          .hc-h1  { font-size: 26px !important; }
          .hc-sub { font-size: 13px !important; max-width: 320px; }
          .hc-stat-val { font-size: 19px !important; }
        }

        /* ══════ MOBILE ≤680px ══════
           Text stays on LEFT, max 68% width
           so 3D is visible on the right 32%     */
        @media (max-width: 680px) {
          .hc {
            width: 68%;
            max-width: none;
            padding: 80px 0 56px 18px;
          }
          .hc-h1   { font-size: 20px !important; line-height:1.12!important; letter-spacing:-0.025em!important; }
          .hc-sub  { font-size: 11.5px !important; max-width: 260px; margin-bottom: 20px; }
          .hc-badge { font-size: 8px !important; padding: 4px 9px !important; margin-bottom:12px; letter-spacing:.08em!important; }
          .hc-btns  { gap: 7px; }
          .hc-btn-p, .hc-btn-s { font-size: 10.5px !important; padding: 7px 13px !important; gap:5px; }
          .hc-stats { gap:12px; margin-top:24px; padding-top:16px; }
          .hc-stat-val { font-size: 16px !important; }
          .hc-stat-lbl { font-size: 8.5px !important; }
          .si-label { font-size: 7.5px; }
          .si-track { height: 32px; }
          .si-arrow { font-size: 9px; }
        }

        /* ══════ SMALL MOBILE ≤420px ══════ */
        @media (max-width: 420px) {
          .hc { width:70%; padding:76px 0 50px 14px; }
          .hc-h1  { font-size: 18px !important; }
          .hc-sub { font-size: 11px !important; max-width: 220px; }
          .hc-btn-p, .hc-btn-s { font-size: 10px !important; padding: 7px 11px !important; }
          .hc-stat-val { font-size: 15px !important; }
        }
      `}</style>
    </section>
  )
}