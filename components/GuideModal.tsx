'use client'

import { useState } from 'react'

interface GuideModalProps {
  onClose: () => void;
}

export default function GuideModal({ onClose }: GuideModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // ── BEGINNER-FRIENDLY ONBOARDING STEPS (no prices) ──
  const slides = [
    {
      title: "1. Create Your Account",
      description: "Welcome! Start by signing up with your email and a password — this is your main account that controls everything. Use a real email you check often, since important notices are sent there. Pick a strong password you don't reuse anywhere else.",
      warning: null,
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-[#9b5de5]/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(155,93,229,0.15)] flex flex-col gap-3">
            <div className="text-[10px] font-bold text-[#9b5de5] uppercase tracking-widest text-center">Your Account</div>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3">
              <div className="text-[#8a80a0] text-[9px] uppercase tracking-wider mb-1">Email</div>
              <div className="text-white font-mono text-xs">you@example.com</div>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3">
              <div className="text-[#8a80a0] text-[9px] uppercase tracking-wider mb-1">Password</div>
              <div className="text-white font-mono text-xs">••••••••••••</div>
            </div>
            <button disabled className="w-full bg-[#9b5de5] text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-[0_0_15px_rgba(155,93,229,0.3)]">
              Create Account
            </button>
          </div>
        </div>
      )
    },
    {
      title: "2. Choose How You'll Send",
      description: "In your dashboard, pick a plan that matches how many emails you expect to send. If you're just starting and unsure, begin small — you can always move up later. There's no long-term lock-in, and you can change plans whenever your needs grow.",
      warning: null,
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
            <div className="text-[10px] font-bold text-[#9b5de5] uppercase tracking-widest text-center">Pick Your Volume</div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                <span className="text-white text-xs font-bold">Lower Volume</span>
                <span className="text-[#8a80a0] text-[10px]">Getting started</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg border border-[#9b5de5]/40 bg-[#9b5de5]/10">
                <span className="text-white text-xs font-bold">Medium Volume</span>
                <span className="text-[#9b5de5] text-[10px]">Most popular</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                <span className="text-white text-xs font-bold">High Volume</span>
                <span className="text-[#8a80a0] text-[10px]">Scaling up</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "3. Install the Desktop App",
      description: "Download and install the ProMail desktop app using the Download button. This is where you build and send your campaigns. Your contact lists stay saved on your own computer — never uploaded to us — keeping your data fully private. On Windows, if you see a 'Windows protected your PC' pop-up, click 'More info' then 'Run anyway' — that's normal for new apps.",
      warning: null,
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
          <div className="flex gap-3 w-full max-w-[280px]">
            <div className="flex-1 bg-[#9b5de5]/10 border border-[#9b5de5]/30 rounded-xl p-3 flex flex-col items-center justify-center text-[#9b5de5] shadow-[inset_0_0_15px_rgba(155,93,229,0.1)]">
              <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/></svg>
              <span className="text-[9px] font-bold uppercase tracking-wider">Windows</span>
            </div>
            <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col items-center justify-center text-[#8a80a0] opacity-50">
              <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.189 14.86c-.347.05-1.503-.687-2.748-.687-1.391 0-2.457.77-3.693.77-1.637 0-3.37-1.28-4.444-2.846-1.583-2.316-2.073-5.326-.818-7.25 1.002-1.53 2.656-2.518 4.417-2.518 1.488 0 2.593.687 3.655.687 1.026 0 2.308-.748 3.864-.748.593 0 2.298.064 3.394 1.139-3.082 1.62-2.564 5.679.526 6.945-.63 1.624-1.666 3.094-3.153 4.508zM14.545 4.5c-.752 1.025-2.091 1.64-3.12 1.554.168-1.218.824-2.375 1.627-3.094 1.008-.9 2.264-1.442 3.235-1.42-.164 1.258-.87 2.102-1.742 2.96z"/></svg>
              <span className="text-[9px] font-bold uppercase tracking-wider">Mac (Soon)</span>
            </div>
          </div>
          <div className="w-full max-w-[280px] bg-[#030208] border border-white/10 rounded-xl p-3 flex justify-between items-center shadow-xl">
            <span className="text-[10px] font-bold text-[#8a80a0] uppercase tracking-wider">Your API Key</span>
            <code className="text-xs text-[#10b981] font-mono">pk_live_8f...</code>
          </div>
        </div>
      )
    },
    {
      title: "4. Get a Domain for Sending",
      description: "A domain is your own web address, like yourcompany.com. You need one to send professional email. Use one you already own, or buy a fresh one from a registrar like Namecheap, GoDaddy, or Cloudflare. Many people buy a separate domain just for outreach so their main company domain stays protected.",
      warning: "Never send cold or bulk email from your main company domain. If deliverability problems happen, they can hurt your normal business email too. Always use a separate domain dedicated to outreach.",
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <div className="text-[10px] font-bold text-[#9b5de5] uppercase tracking-widest text-center">Your Sending Domain</div>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 text-center">
              <code className="text-white font-mono text-sm">mail.yourbrand.com</code>
            </div>
            <div className="text-[#8a80a0] text-[10px] text-center leading-relaxed">A dedicated domain keeps your<br/>main business email safe.</div>
          </div>
        </div>
      )
    },
    {
      title: "5. Connect Your Domain (DNS)",
      description: "This step proves you own the domain so email providers trust you. ProMail gives you a few text records (SPF, DKIM, DMARC). Copy each one into your domain provider's DNS settings — the same place you bought the domain — then click Verify. ProMail shows you exactly what to copy and where.",
      warning: "DNS changes can take a few minutes up to 24–48 hours to take effect. If verification fails at first, wait a bit and try again — it's usually just the records still spreading. Copy them exactly, with no extra spaces.",
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white/[0.02] p-3 border-b border-white/[0.05] flex justify-between items-center">
              <span className="text-white font-mono font-bold text-xs">mail.yourbrand.com</span>
              <span className="text-[9px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded uppercase tracking-wider font-bold">Pending</span>
            </div>
            <div className="p-3 bg-[#030208]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#9b5de5] text-[10px] font-bold px-2 py-0.5 bg-[#9b5de5]/10 rounded border border-[#9b5de5]/20">TXT</span>
                <span className="text-[#8a80a0] text-[10px] font-mono">_dmarc</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded p-2 text-[#8a80a0] text-[9px] font-mono break-all">
                v=DMARC1; p=none;
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "6. Create Your Sending Email",
      description: "Once your domain is verified, create the email address you'll send from — like hello@yourbrand.com or news@yourbrand.com. This is the 'from' address recipients see. Choose something clean and trustworthy that matches your brand. Avoid spammy-looking names like 'noreply2847@'.",
      warning: null,
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <div className="text-[10px] font-bold text-[#9b5de5] uppercase tracking-widest text-center">Your Sender Address</div>
            <div className="bg-[#10b981]/5 border border-[#10b981]/30 rounded-xl p-3 text-center">
              <code className="text-[#10b981] font-mono text-sm">hello@yourbrand.com</code>
            </div>
            <div className="text-[#8a80a0] text-[10px] text-center">Clean and trustworthy ✓</div>
          </div>
        </div>
      )
    },
    {
      title: "7. Log In & Connect Your Sender",
      description: "Open the desktop app and log in with the same account from Step 1. Go to Settings and enter the sending email you just created. This links your verified domain to the app so it's allowed to send for you. Now you're ready to build your first campaign.",
      warning: null,
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#030208] border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#8a80a0] uppercase tracking-wider">Sender Email</span>
              <span className="text-[9px] bg-[#10b981]/10 text-[#10b981] px-2 py-1 rounded uppercase tracking-wider font-bold">Linked</span>
            </div>
            <code className="text-xs text-white font-mono">hello@yourbrand.com</code>
            <div className="h-px bg-white/10" />
            <div className="text-[#8a80a0] text-[10px] text-center">Connected to your verified domain</div>
          </div>
        </div>
      )
    },
    {
      title: "8. Warm Up & Protect Your Reputation",
      description: "If your domain is brand new, do NOT blast thousands of emails on day one — that's the fastest way to get blocked. Start with a small number of emails per day and slowly increase over a couple of weeks. This 'warming up' teaches email providers you're trustworthy. Use the in-app Advisor for a guided schedule.",
      warning: "Sending too much, too fast from a new domain is the #1 reason new senders land in spam or get blacklisted. Go slow at the start — patience here protects your delivery long-term.",
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <div className="text-[10px] font-bold text-[#9b5de5] uppercase tracking-widest text-center">Gradual Warm-Up</div>
            <div className="flex items-end justify-between gap-1.5 h-20">
              <div className="flex-1 bg-gradient-to-t from-[#6c3b9c] to-[#9b5de5] rounded-t" style={{ height: '20%' }} />
              <div className="flex-1 bg-gradient-to-t from-[#6c3b9c] to-[#9b5de5] rounded-t" style={{ height: '35%' }} />
              <div className="flex-1 bg-gradient-to-t from-[#6c3b9c] to-[#9b5de5] rounded-t" style={{ height: '50%' }} />
              <div className="flex-1 bg-gradient-to-t from-[#6c3b9c] to-[#9b5de5] rounded-t" style={{ height: '70%' }} />
              <div className="flex-1 bg-gradient-to-t from-[#6c3b9c] to-[#9b5de5] rounded-t" style={{ height: '100%' }} />
            </div>
            <div className="text-[#8a80a0] text-[10px] text-center">Slowly increase volume over time</div>
          </div>
        </div>
      )
    },
    {
      title: "9. We're Here to Help",
      description: "Stuck on any step? Our team is online. Click the purple chat bubble in the bottom-right corner of your dashboard to start a live conversation. If you'd like us to set everything up for you from start to finish, just ask about our private setup service.",
      warning: null,
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(155,93,229,0.1)_0%,transparent_70%)]" />
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#020106] to-[#1a0b2e] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_25px_rgba(155,93,229,0.4)] border border-[#9b5de5]/30 mb-4 z-10">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#10b981] rounded-full border-2 border-[#020106] animate-pulse"></div>
            </div>
            <div className="bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span> We reply fast
            </div>
          </div>
        </div>
      )
    }
  ]

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">

      <div className="relative w-full max-w-[650px] bg-[#070512] border border-white/[0.08] rounded-[2rem] shadow-[0_30px_100px_-20px_rgba(108,59,156,0.3)] overflow-hidden flex flex-col">

        <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#9b5de5] to-transparent opacity-80" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6a6080] hover:text-white transition-colors z-20 bg-white/5 hover:bg-white/10 p-2 rounded-xl"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* VISUAL DISPLAY AREA */}
        <div className="h-[260px] w-full bg-[#030208] border-b border-white/[0.04] relative overflow-hidden flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
          <div className="relative z-10 w-full h-full" key={currentSlide}>
            <div className="w-full h-full animate-[fadeUp_0.4s_ease-out]">
              {slides[currentSlide].visual}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="p-8 sm:p-10 flex flex-col min-h-[240px]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#9b5de5] mb-3">
            Installation Step {currentSlide + 1} of {slides.length}
          </div>
          <h2 className="font-['Syne',sans-serif] text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            {slides[currentSlide].title}
          </h2>
          <p className="text-[13px] md:text-sm text-[#8a80a0] leading-relaxed flex-1 font-medium">
            {slides[currentSlide].description}
          </p>

          {slides[currentSlide].warning && (
            <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-[#f59e0b]/[0.08] border border-[#f59e0b]/25">
              <span className="text-sm shrink-0">⚠️</span>
              <span className="text-[12px] text-[#f5c97a] leading-relaxed">{slides[currentSlide].warning}</span>
            </div>
          )}

          {/* NAVIGATION CONTROLS */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.04]">
            <div className="flex gap-2 flex-wrap">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-[#9b5de5] shadow-[0_0_10px_rgba(155,93,229,0.5)]' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>

            <div className="flex gap-3 shrink-0">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Back
              </button>

              {currentSlide === slides.length - 1 ? (
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#10b981] hover:bg-[#0ea5e9] shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
                >
                  Start Setup
                </button>
              ) : (
                <button
                  onClick={nextSlide}
                  className="px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#9b5de5] hover:bg-[#8040cd] shadow-[0_0_20px_rgba(155,93,229,0.4)] transition-all"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(12px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}