'use client'

import { useState } from 'react'

interface GuideModalProps {
  onClose: () => void;
}

export default function GuideModal({ onClose }: GuideModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // ── CLEAR, FAMILIAR ONBOARDING STEPS ──
  const slides = [
    {
      title: "1. Add Funds to Your Balance",
      description: "ProMail operates on a simple pay-as-you-go model. Use the volume slider on your dashboard to select how many emails you want to send, and click 'Add Funds'.",
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="w-full max-w-[280px] bg-[#070512] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center text-white font-bold text-lg">
              <span>Balance</span>
              <span className="text-[#10b981] animate-pulse">$50.00</span>
            </div>
            <div className="h-2 w-full bg-black rounded-full overflow-hidden">
              <div className="h-full bg-[#9b5de5] w-1/2 rounded-full" />
            </div>
            <button disabled className="w-full bg-[#9b5de5]/20 text-[#9b5de5] font-bold text-xs py-2 rounded-lg">Add Funds</button>
          </div>
        </div>
      )
    },
    {
      title: "2. Download the Desktop App",
      description: "To guarantee the highest possible inbox delivery rates, the sending engine runs directly on your local computer. Download the app for your operating system.",
      visual: (
        <div className="w-full h-full flex items-center justify-center p-6 gap-4">
          <div className="w-24 h-24 bg-[#070512] border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/>
            </svg>
            <span className="text-[10px] font-bold uppercase text-[#8a80a0]">Windows</span>
          </div>
          <div className="w-24 h-24 bg-[#070512] border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-2xl">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.189 14.86c-.347.05-1.503-.687-2.748-.687-1.391 0-2.457.77-3.693.77-1.637 0-3.37-1.28-4.444-2.846-1.583-2.316-2.073-5.326-.818-7.25 1.002-1.53 2.656-2.518 4.417-2.518 1.488 0 2.593.687 3.655.687 1.026 0 2.308-.748 3.864-.748.593 0 2.298.064 3.394 1.139-3.082 1.62-2.564 5.679.526 6.945-.63 1.624-1.666 3.094-3.153 4.508zM14.545 4.5c-.752 1.025-2.091 1.64-3.12 1.554.168-1.218.824-2.375 1.627-3.094 1.008-.9 2.264-1.442 3.235-1.42-.164 1.258-.87 2.102-1.742 2.96z"/>
            </svg>
            <span className="text-[10px] font-bold uppercase text-[#8a80a0]">Mac / iOS</span>
          </div>
        </div>
      )
    },
    {
      title: "3. Connect Your API Key",
      description: "Your API Key links your desktop app to your account balance. Reveal it on your dashboard, copy it, and paste it into the Settings page of the desktop app.",
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-4">
          {/* Mock Dashboard Copy */}
          <div className="w-full max-w-[280px] bg-[#070512] border border-white/10 rounded-lg p-3 flex justify-between items-center relative overflow-hidden shadow-xl">
            <span className="text-[10px] font-bold text-[#8a80a0]">Dashboard</span>
            <code className="text-xs text-[#9b5de5] ml-4">pk_live_8f...</code>
            <span className="text-[9px] font-bold text-white bg-[#10b981] px-2 py-1 rounded ml-2">Copied!</span>
          </div>
          
          {/* Arrow */}
          <svg className="w-4 h-4 text-[#8a80a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>

          {/* Mock App Paste */}
          <div className="w-full max-w-[280px] bg-[#030208] border border-white/20 rounded-lg p-3 flex flex-col gap-2 shadow-xl">
            <span className="text-[10px] font-bold text-white">Desktop App Settings</span>
            <input disabled value="pk_live_8f92j..." className="bg-black border border-[#10b981] rounded px-2 py-1.5 text-xs text-white" />
          </div>
        </div>
      )
    }
  ]

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
      
      <div className="relative w-full max-w-[600px] bg-[#070512] border border-white/[0.08] rounded-[2rem] shadow-[0_30px_100px_-20px_rgba(108,59,156,0.3)] overflow-hidden flex flex-col">
        
        <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#9b5de5] to-transparent opacity-80" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6a6080] hover:text-white transition-colors z-20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* VISUAL DISPLAY AREA */}
        <div className="h-[240px] w-full bg-[#030208] border-b border-white/[0.04] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
          <div className="relative z-10 w-full h-full" key={currentSlide}>
            <div className="w-full h-full animate-[fadeUp_0.4s_ease-out]">
              {slides[currentSlide].visual}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="p-8 sm:p-10 flex flex-col min-h-[220px]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#9b5de5] mb-2">
            Step {currentSlide + 1} of {slides.length}
          </div>
          <h2 className="font-['Syne',sans-serif] text-2xl font-bold text-white mb-3">
            {slides[currentSlide].title}
          </h2>
          <p className="text-sm text-[#8a80a0] leading-relaxed flex-1">
            {slides[currentSlide].description}
          </p>

          {/* NAVIGATION CONTROLS */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.04]">
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-6 bg-[#9b5de5]' : 'w-1.5 bg-white/20'}`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Back
              </button>
              
              {currentSlide === slides.length - 1 ? (
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#10b981] hover:bg-[#0ea5e9] shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
                >
                  Start Sending
                </button>
              ) : (
                <button 
                  onClick={nextSlide}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#9b5de5] hover:bg-[#8040cd] shadow-[0_0_15px_rgba(155,93,229,0.3)] transition-all"
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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}