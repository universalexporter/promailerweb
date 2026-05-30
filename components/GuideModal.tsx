'use client'

import { useState } from 'react'

interface GuideModalProps {
  onClose: () => void;
}

export default function GuideModal({ onClose }: GuideModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // ── ENTERPRISE ONBOARDING STEPS ──
  const slides = [
    {
      title: "1. Select a Subscription Plan",
      description: "ProMail operates on a high-deliverability cloud infrastructure. Start by choosing a monthly base plan that fits your volume: Starter (20k), Pro (100k), or Scale (500k).",
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-[#9b5de5]/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(155,93,229,0.15)] flex flex-col gap-3">
            <div className="text-[10px] font-bold text-[#9b5de5] uppercase tracking-widest text-center">Most Popular</div>
            <div className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <div>
                <div className="text-white font-bold text-sm">Pro Plan</div>
                <div className="text-[#8a80a0] text-[10px]">100,000 emails/mo</div>
              </div>
              <div className="text-[#10b981] font-mono font-bold text-sm">600 USDT</div>
            </div>
            <button disabled className="w-full bg-[#9b5de5] text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-[0_0_15px_rgba(155,93,229,0.3)]">
              Subscribe Now
            </button>
          </div>
        </div>
      )
    },
    {
      title: "2. Pay-As-You-Send Overage",
      description: "If your campaigns exceed your monthly plan limit, your sending will not be interrupted. Excess emails are seamlessly billed from your Wallet Balance at a flat rate of 0.006 USDT per email.",
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center text-white font-bold text-lg">
              <span className="text-xs uppercase tracking-wider text-[#8a80a0]">Wallet Balance</span>
              <span className="text-[#10b981] animate-pulse text-sm font-mono">50.00 USDT</span>
            </div>
            <div className="h-2.5 w-full bg-[#020106] rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,1)] border border-white/[0.05]">
              <div className="h-full bg-gradient-to-r from-[#6c3b9c] to-[#9b5de5] w-3/4 rounded-full" />
            </div>
            <div className="flex justify-between text-[10px] text-[#8a80a0] font-mono font-bold">
               <span>Rate: 0.006 / email</span>
               <span className="text-[#9b5de5]">≈ 8,333 extra</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "3. Connect the Desktop Engine",
      description: "To guarantee maximum inbox placement, your sending engine runs securely on your local machine. Download the ProMail software, paste your API Key, and sync with your cloud account.",
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
          <div className="flex gap-3 w-full max-w-[280px]">
            <div className="flex-1 bg-[#9b5de5]/10 border border-[#9b5de5]/30 rounded-xl p-3 flex flex-col items-center justify-center text-[#9b5de5] shadow-[inset_0_0_15px_rgba(155,93,229,0.1)]">
              <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/></svg>
              <span className="text-[9px] font-bold uppercase tracking-wider">Windows</span>
            </div>
            <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col items-center justify-center text-[#8a80a0] opacity-50">
              <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.189 14.86c-.347.05-1.503-.687-2.748-.687-1.391 0-2.457.77-3.693.77-1.637 0-3.37-1.28-4.444-2.846-1.583-2.316-2.073-5.326-.818-7.25 1.002-1.53 2.656-2.518 4.417-2.518 1.488 0 2.593.687 3.655.687 1.026 0 2.308-.748 3.864-.748.593 0 2.298.064 3.394 1.139-3.082 1.62-2.564 5.679.526 6.945-.63 1.624-1.666 3.094-3.153 4.508zM14.545 4.5c-.752 1.025-2.091 1.64-3.12 1.554.168-1.218.824-2.375 1.627-3.094 1.008-.9 2.264-1.442 3.235-1.42-.164 1.258-.87 2.102-1.742 2.96z"/></svg>
              <span className="text-[9px] font-bold uppercase tracking-wider">Mac OS</span>
            </div>
          </div>
          
          <div className="w-full max-w-[280px] bg-[#030208] border border-white/10 rounded-xl p-3 flex justify-between items-center shadow-xl">
            <span className="text-[10px] font-bold text-[#8a80a0] uppercase tracking-wider">Paste API Key</span>
            <code className="text-xs text-[#10b981] font-mono">pk_live_8f...</code>
          </div>
        </div>
      )
    },
    {
      title: "4. Authenticate Your Domain",
      description: "Scroll down to the Domain Manager. Enter your sending domain (e.g., mail.yourcompany.com). We will provide specific DNS records for you to copy and paste into your domain registrar to verify your identity.",
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-white/[0.02] p-3 border-b border-white/[0.05] flex justify-between items-center">
              <span className="text-white font-mono font-bold text-xs">mail.acme.com</span>
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
      title: "5. 24/7 Technical Support",
      description: "If you need assistance configuring your domains or setting up your desktop engine, our engineers are online. Click the purple chat bubble in the bottom right corner of your dashboard to start a live session.",
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(155,93,229,0.1)_0%,transparent_70%)]" />
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#020106] to-[#1a0b2e] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_25px_rgba(155,93,229,0.4)] border border-[#9b5de5]/30 mb-4 z-10">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#10b981] rounded-full border-2 border-[#020106] animate-pulse"></div>
            </div>
            <div className="bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span> We reply in 5 mins
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
        <div className="h-[260px] w-full bg-[#030208] border-b border-white/[0.04] relative overflow-hidden flex items-center justify-center">
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

          {/* NAVIGATION CONTROLS */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.04]">
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-[#9b5de5] shadow-[0_0_10px_rgba(155,93,229,0.5)]' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>

            <div className="flex gap-3">
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