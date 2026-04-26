'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing',  href: '#ledger'   },
    { label: 'Docs',     href: '#'          },
  ]

  return (
    <>
      <nav
        ref={navRef}
        className={`pm-nav ${scrolled ? 'pm-nav--scrolled' : ''}`}
      >
        {/* ── LOGO */}
        <Link href="/" className="pm-logo">
          <span className="pm-logo-dot" />
          <span className="pm-logo-pro">Pro</span>
          <span className="pm-logo-mail">Mail</span>
        </Link>

        {/* ── DESKTOP NAV LINKS */}
        <ul className="pm-links">
          {links.map(({ label, href }) => (
            <li key={label}>
              <Link href={href} className="pm-link">{label}</Link>
            </li>
          ))}
        </ul>

        {/* ── DESKTOP BUTTONS */}
        <div className="pm-actions">
          <button className="pm-btn-sec">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download App
          </button>
          <button className="pm-btn-pri">
            Client Portal
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>

          {/* ── HAMBURGER (mobile only) */}
          <button
            className="pm-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={menuOpen ? 'pm-bar pm-bar--open-1' : 'pm-bar'} />
            <span className={menuOpen ? 'pm-bar pm-bar--open-2' : 'pm-bar'} />
            <span className={menuOpen ? 'pm-bar pm-bar--open-3' : 'pm-bar'} />
          </button>
        </div>
      </nav>

      {/* ── MOBILE DROPDOWN MENU */}
      <div className={`pm-mobile-menu ${menuOpen ? 'pm-mobile-menu--open' : ''}`}>
        <div className="pm-mobile-inner">
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="pm-mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          {/* Mobile CTA buttons inside menu */}
          <div className="pm-mobile-btns">
            <button className="pm-mobile-btn-sec">Download App</button>
            <button className="pm-mobile-btn-pri">Client Portal →</button>
          </div>
        </div>
      </div>

      <style>{`
        /* ══════════════════════════════════════
           NAV BASE
        ══════════════════════════════════════ */
        .pm-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          background: rgba(4,3,10,0.35);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.4s, border-color 0.4s, box-shadow 0.4s;
        }
        .pm-nav--scrolled {
          background: rgba(4,3,10,0.92);
          border-bottom-color: rgba(108,59,156,0.22);
          box-shadow: 0 4px 40px rgba(0,0,0,0.6);
        }

        /* ══════════════════════════════════════
           LOGO
        ══════════════════════════════════════ */
        .pm-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .pm-logo-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981, 0 0 20px rgba(16,185,129,0.4);
          animation: pulse-dot 2.2s ease-in-out infinite;
          display: inline-block; flex-shrink: 0;
        }
        .pm-logo-pro {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 20px;
          letter-spacing: -0.04em;
          color: #9b5de5;
          text-shadow: 0 0 16px rgba(155,93,229,0.65);
          line-height: 1;
        }
        .pm-logo-mail {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 20px;
          letter-spacing: -0.04em;
          color: #ffffff;
          margin-left: -1px;
          line-height: 1;
        }

        /* ══════════════════════════════════════
           DESKTOP LINKS
        ══════════════════════════════════════ */
        .pm-links {
          display: flex;
          align-items: center;
          gap: 30px;
          list-style: none;
          margin: 0; padding: 0;
        }
        .pm-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 400;
          color: #8a8099;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: color 0.2s;
          position: relative;
        }
        .pm-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0; right: 0;
          height: 1px;
          background: #9b5de5;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s;
        }
        .pm-link:hover { color: #ffffff; }
        .pm-link:hover::after { transform: scaleX(1); }

        /* ══════════════════════════════════════
           DESKTOP BUTTONS
        ══════════════════════════════════════ */
        .pm-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .pm-btn-sec {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 9px;
          font-size: 12.5px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          color: #d4cfe8;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .pm-btn-sec:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.18);
          color: #fff;
        }
        .pm-btn-pri {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 9px;
          font-size: 12.5px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: #ffffff;
          background: linear-gradient(135deg, #6c3b9c 0%, #8b4fcc 100%);
          border: none;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 0 20px rgba(108,59,156,0.45), 0 4px 16px rgba(0,0,0,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pm-btn-pri:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(108,59,156,0.65), 0 6px 20px rgba(0,0,0,0.5);
        }

        /* ══════════════════════════════════════
           HAMBURGER (hidden on desktop)
        ══════════════════════════════════════ */
        .pm-hamburger {
          display: none;
          flex-direction: column;
          gap: 4px;
          padding: 6px;
          background: none;
          border: none;
          cursor: pointer;
          margin-left: 4px;
        }
        .pm-bar {
          width: 20px; height: 2px;
          background: #e8e4f0;
          border-radius: 2px;
          display: block;
          transition: transform 0.3s, opacity 0.3s;
        }
        .pm-bar--open-1 { transform: translateY(6px) rotate(45deg); }
        .pm-bar--open-2 { opacity: 0; transform: scaleX(0); }
        .pm-bar--open-3 { transform: translateY(-6px) rotate(-45deg); }

        /* ══════════════════════════════════════
           MOBILE DROPDOWN MENU
        ══════════════════════════════════════ */
        .pm-mobile-menu {
          position: fixed;
          top: 62px; left: 0; right: 0;
          z-index: 99;
          background: rgba(4,3,10,0.97);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(108,59,156,0.2);
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .pm-mobile-menu--open { max-height: 420px; }
        .pm-mobile-inner { padding: 16px 20px 24px; }
        .pm-mobile-link {
          display: block;
          padding: 12px 0;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #e8e4f0;
          text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: color 0.2s;
        }
        .pm-mobile-link:hover { color: #9b5de5; }
        .pm-mobile-btns {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }
        .pm-mobile-btn-sec {
          flex: 1;
          padding: 10px 0;
          border-radius: 9px;
          font-size: 12.5px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          color: #d4cfe8;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
        }
        .pm-mobile-btn-pri {
          flex: 1;
          padding: 10px 0;
          border-radius: 9px;
          font-size: 12.5px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #6c3b9c, #8b4fcc);
          border: none;
          cursor: pointer;
          box-shadow: 0 0 16px rgba(108,59,156,0.45);
        }

        /* ══════════════════════════════════════
           RESPONSIVE BREAKPOINTS
        ══════════════════════════════════════ */

        /* Tablet — hide download button, keep portal */
        @media (max-width: 960px) {
          .pm-nav { padding: 0 24px; }
          .pm-btn-sec { display: none; }
          .pm-links { gap: 22px; }
          .pm-link { font-size: 13px; }
        }

        /* Mobile — hide links + buttons, show hamburger */
        @media (max-width: 680px) {
          .pm-nav { padding: 0 18px; height: 56px; }
          .pm-mobile-menu { top: 56px; }
          .pm-links { display: none !important; }
          .pm-btn-sec { display: none !important; }
          .pm-btn-pri { display: none !important; }
          .pm-hamburger { display: flex !important; }
          .pm-logo-pro, .pm-logo-mail { font-size: 18px; }
          .pm-logo-dot { width: 6px; height: 6px; }
        }

        /* Very small */
        @media (max-width: 360px) {
          .pm-nav { padding: 0 14px; }
          .pm-logo-pro, .pm-logo-mail { font-size: 17px; }
        }
      `}</style>
    </>
  )
}