'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@supabase/supabase-js'

// Import your interactive Guide component
import GuideModal from '@/components/GuideModal'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 3D Neural Brain Engine
const NeuralBrainScene = dynamic(() => import('@/components/3d/NeuralBrainScene'), { ssr: false })

export default function DashboardPage() {
  const router = useRouter()
  
  // State
  const [userEmail, setUserEmail] = useState<string | null>('Loading...')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  // ── ENTERPRISE ACTIVATION STATE ──
  // For testing, we set this to false so you can see the $50 lock.
  const [isActivated, setIsActivated] = useState(false)
  
  // ── NEW PRICING MATH ──
  // $20 per 3,000 emails = ~$0.00666 per email
  const [emailVolume, setEmailVolume] = useState(3000)
  const depositAmount = ((emailVolume / 3000) * 20).toFixed(2)

  // Authentication Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUserEmail(session.user.email ?? 'Unknown User')
        setIsCheckingAuth(false) 
      }
    }
    checkUser()
  }, [router])

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Gatekeeper
  if (isCheckingAuth) return <div className="min-h-screen bg-[#020106]" />

  return (
    <main className="relative min-h-screen bg-[#020106] text-white font-['DM_Sans',sans-serif] overflow-y-auto selection:bg-[#9b5de5]/30">
      
      {/* ── 3D BACKGROUND ENGINE ── */}
      <div className="fixed inset-0 z-0 w-full h-full opacity-30 mix-blend-screen pointer-events-none">
         <NeuralBrainScene />
      </div>
      
      {/* Depth Gradient Map */}
      <div className="fixed inset-0 z-10 bg-[radial-gradient(circle_at_top,#1a0b2e_0%,#020106_60%)] opacity-40 pointer-events-none" />

      {/* ── DASHBOARD CONTENT ── */}
      <div className="relative z-20 max-w-7xl mx-auto p-6 md:p-12 animate-[fadeUp_0.8s_ease-out]">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-white/[0.04] pb-8 relative">
          {/* Subtle top ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#9b5de5]/50 to-transparent" />
          
          <div>
            <h1 className="font-['Syne',sans-serif] text-4xl font-extrabold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 drop-shadow-lg">
              Command Center
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-[#8a80a0] text-sm flex items-center gap-2 font-medium tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_10px_#10b981]" />
                {userEmail}
              </p>
              {/* Account Status Badge */}
              <div className="flex items-center">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-inner transition-all duration-500 ${isActivated ? 'border-[#10b981]/40 text-[#10b981] bg-[#10b981]/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-red-500/40 text-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]'}`}>
                  {isActivated ? 'Node Active' : 'Activation Required'}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8a80a0] hover:text-white transition-all border border-white/[0.08] px-6 py-3 rounded-xl bg-[#070512]/80 hover:bg-white/[0.05] disabled:opacity-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.5)]"
          >
            {isLoggingOut ? 'Terminating...' : 'Sign Out'}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-20">
          
          {/* ── LEFT COLUMN: Funding & Balance ── */}
          <div className="lg:col-span-7 space-y-10">
            
            <section className="bg-gradient-to-b from-[#0a0614]/80 to-[#04020a]/80 border border-white/[0.08] backdrop-blur-[50px] rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden group hover:border-white/[0.12] transition-colors duration-500">
              
              {/* Internal volumetric light */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#9b5de5]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[#9b5de5]/20 transition-all duration-700" />
              
              <h2 className="font-['Syne',sans-serif] text-[#8a80a0] font-bold text-[11px] uppercase tracking-[0.2em] mb-3 relative z-10">Available Balance</h2>
              <div className="text-6xl sm:text-7xl font-extrabold tracking-tighter mb-4 font-['Syne',sans-serif] text-transparent bg-clip-text bg-gradient-to-b from-white to-[#8a80a0] relative z-10">
                $0.00
              </div>
              <p className="text-sm text-[#10b981] font-medium mb-10 relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Ready to dispatch 0 emails.
              </p>

              {/* Deposit Interface */}
              <div className={`bg-black/60 border border-white/[0.04] rounded-3xl p-8 sm:p-10 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)] relative z-10 transition-all duration-500 ${!isActivated ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="font-['Syne',sans-serif] font-bold text-xl text-white mb-2 tracking-tight">Fund Your Node</h3>
                    <p className="text-xs text-[#8a80a0] tracking-wide">Pay as you send ($20 per 3k emails).</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold font-['Syne',sans-serif] text-[#9b5de5] drop-shadow-[0_0_15px_rgba(155,93,229,0.4)]">
                      ${depositAmount}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#6a6080] mt-1 font-bold">Deposit Amount</div>
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex justify-between items-center text-[11px] font-bold text-white mb-5">
                    <span className="uppercase tracking-widest text-[#8a80a0]">Target Volume</span>
                    <span className="text-[#9b5de5] bg-[#9b5de5]/10 px-4 py-1.5 rounded-lg border border-[#9b5de5]/20 shadow-inner tracking-wider">
                      {emailVolume.toLocaleString()} emails
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-[#020106] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,1)] border border-white/[0.02]">
                    <input 
                      type="range" 
                      min="3000" 
                      max="300000" 
                      step="3000"
                      value={emailVolume}
                      onChange={(e) => setEmailVolume(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#9b5de5] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_20px_#9b5de5]"
                    />
                    {/* Visual fill bar for slider */}
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#6c3b9c] to-[#9b5de5] rounded-full pointer-events-none" 
                      style={{ width: `${((emailVolume - 3000) / (300000 - 3000)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#4a4060] mt-4 font-mono font-bold tracking-wider">
                    <span>MIN: 3k ($20)</span>
                    <span>MAX: 300k ($2,000)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/[0.04] pt-8">
                  <p className="text-[10px] text-[#6a6080] max-w-[280px] leading-relaxed uppercase tracking-wider font-bold">
                    {!isActivated ? "You must activate your node before adding funds." : "By proceeding, you agree to our TOS. Taxes may apply."}
                  </p>
                  <button className="w-full sm:w-auto relative group overflow-hidden rounded-xl p-[1px]">
                    <span className="absolute inset-0 bg-gradient-to-r from-[#9b5de5] via-[#6c3b9c] to-[#9b5de5] opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center bg-[#070512] rounded-xl px-12 py-4 transition-all duration-300 group-hover:bg-transparent">
                      <span className="font-['Syne',sans-serif] font-bold text-white text-xs uppercase tracking-[0.2em]">
                        Add Funds
                      </span>
                    </div>
                  </button>
                </div>

              </div>
            </section>

          </div>

          {/* ── RIGHT COLUMN: Instructions & API ── */}
          <div className="lg:col-span-5 space-y-10">
            
            <section className="bg-gradient-to-b from-[#0a0614]/80 to-[#04020a]/80 border border-white/[0.08] backdrop-blur-[50px] rounded-[2.5rem] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden">
              <h2 className="font-['Syne',sans-serif] text-white font-extrabold text-xl mb-4 tracking-tight">System Access</h2>
              <p className="text-xs text-[#8a80a0] leading-relaxed mb-8 tracking-wide">Your unique API key securely connects your local desktop engine to your cloud balance.</p>
              
              {/* ── HIGH-CLASS ACTIVATION VAULT ── */}
              {isActivated ? (
                <div className="bg-black/60 border border-white/[0.06] rounded-2xl p-5 flex justify-between items-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] mb-10 animate-[fadeUp_0.5s_ease-out] relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#9b5de5]/0 via-[#9b5de5]/5 to-[#9b5de5]/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                  <div className="flex flex-col relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8a80a0] mb-1 font-bold">Cryptographic Key</span>
                    <code className={`font-mono text-sm tracking-widest ${showApiKey ? 'text-[#9b5de5] drop-shadow-[0_0_8px_rgba(155,93,229,0.5)]' : 'text-transparent text-shadow-blur blur-[5px]'}`}>
                      pk_live_8f92j...4k9x
                    </code>
                  </div>
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="relative z-10 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a80a0] hover:text-white transition-all bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.15] px-4 py-2 rounded-lg shadow-sm"
                  >
                    {showApiKey ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-b from-red-500/10 to-[#020106] border border-red-500/30 rounded-2xl p-8 text-center shadow-[inset_0_2px_30px_rgba(239,68,68,0.15),0_10px_40px_rgba(239,68,68,0.1)] mb-10 relative overflow-hidden group">
                  {/* Warning scanline effect */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                      <svg className="w-6 h-6 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="font-['Syne',sans-serif] text-white font-extrabold text-lg mb-3 tracking-tight">Activation Required</h3>
                    <p className="text-[11px] text-[#8a80a0] mb-8 leading-relaxed font-bold tracking-wide uppercase">
                      Pay the one-time $50 setup fee to generate your API key and unlock network dispatching.
                    </p>
                    <button 
                      onClick={() => setIsActivated(true)} // TEMPORARY
                      className="w-full relative group/btn overflow-hidden rounded-xl p-[1px]"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 opacity-80 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      <div className="relative flex items-center justify-center bg-[#070512] rounded-xl px-8 py-4 transition-all duration-300 group-hover/btn:bg-transparent">
                        <span className="font-['Syne',sans-serif] font-bold text-white text-xs uppercase tracking-[0.2em]">
                          Pay $50 Activation Fee
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-8 mb-10">
                <div className="relative pl-12 group">
                  <div className="absolute left-0 top-0.5 w-7 h-7 rounded-lg bg-black border border-[#10b981]/50 text-[#10b981] flex items-center justify-center font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">1</div>
                  <h4 className="text-sm font-bold text-white mb-2 tracking-wide">Add Funds</h4>
                  <p className="text-xs text-[#8a80a0] leading-relaxed">Use the volume slider on the left to select how many emails you want to send, and click 'Add Funds'.</p>
                </div>

                <div className="relative pl-12 group">
                  <div className="absolute left-0 top-0.5 w-7 h-7 rounded-lg bg-black border border-white/20 text-white flex items-center justify-center font-bold text-xs shadow-inner group-hover:scale-110 transition-transform">2</div>
                  <h4 className="text-sm font-bold text-white mb-2 tracking-wide">Download Engine</h4>
                  <p className="text-xs text-[#8a80a0] leading-relaxed mb-5">To guarantee the highest possible inbox delivery rates, the sending engine runs directly on your local computer.</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] bg-[#070512] hover:bg-white/[0.05] text-white px-5 py-3 rounded-xl transition-all border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/></svg>
                      Windows
                    </button>
                    <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] bg-[#070512] hover:bg-white/[0.05] text-white px-5 py-3 rounded-xl transition-all border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.189 14.86c-.347.05-1.503-.687-2.748-.687-1.391 0-2.457.77-3.693.77-1.637 0-3.37-1.28-4.444-2.846-1.583-2.316-2.073-5.326-.818-7.25 1.002-1.53 2.656-2.518 4.417-2.518 1.488 0 2.593.687 3.655.687 1.026 0 2.308-.748 3.864-.748.593 0 2.298.064 3.394 1.139-3.082 1.62-2.564 5.679.526 6.945-.63 1.624-1.666 3.094-3.153 4.508zM14.545 4.5c-.752 1.025-2.091 1.64-3.12 1.554.168-1.218.824-2.375 1.627-3.094 1.008-.9 2.264-1.442 3.235-1.42-.164 1.258-.87 2.102-1.742 2.96z"/></svg>
                      Mac / iOS
                    </button>
                  </div>
                </div>

                <div className="relative pl-12 group">
                  <div className="absolute left-0 top-0.5 w-7 h-7 rounded-lg bg-black border border-white/20 text-white flex items-center justify-center font-bold text-xs shadow-inner group-hover:scale-110 transition-transform">3</div>
                  <h4 className="text-sm font-bold text-white mb-2 tracking-wide">Connect Key</h4>
                  <p className="text-xs text-[#8a80a0] leading-relaxed">Copy your API key from the vault above, and paste it into the Settings page of the desktop app.</p>
                </div>
              </div>

              {/* The Tutorial Launcher */}
              <div className="border-t border-white/[0.04] pt-8 mt-8">
                <div className="bg-black/40 border border-[#9b5de5]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1.5 tracking-wide">Need a visual walkthrough?</h4>
                    <p className="text-[11px] text-[#8a80a0] font-bold uppercase tracking-wider">Open the interactive tutorial.</p>
                  </div>
                  <button 
                    onClick={() => setShowGuide(true)}
                    className="w-full sm:w-auto shrink-0 bg-[#9b5de5]/10 hover:bg-[#9b5de5]/20 border border-[#9b5de5]/30 text-[#9b5de5] hover:text-white font-bold uppercase tracking-[0.15em] text-[10px] px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(155,93,229,0.1)] hover:shadow-[0_0_20px_rgba(155,93,229,0.3)]"
                  >
                    View Guide
                  </button>
                </div>
              </div>

            </section>

          </div>
        </div>
      </div>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      
    </main>
  )
}