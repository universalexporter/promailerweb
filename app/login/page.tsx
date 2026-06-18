'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import TermsModal from '@/components/TermsModal'

const NeuralBrainScene = dynamic(() => import('@/components/3d/NeuralBrainScene'), { ssr: false })

export default function LoginPage() {
  const router = useRouter()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')

  // Terms & Conditions acceptance
  const [showTerms, setShowTerms] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [signature, setSignature] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  const routeByRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', userId).single()
    if (profile?.role === 'admin' || profile?.role === 'support') {
      router.replace('/support-desk')
    } else {
      // If they came from the footer "Support" link, open the dashboard chat.
      const wantsSupport = typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('next') === 'support'
      router.replace(wantsSupport ? '/dashboard?support=1' : '/dashboard')
    }
    router.refresh()
  }

  useEffect(() => {
    let active = true
    const safety = setTimeout(() => { if (active) setChecking(false) }, 2500)
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!active) return
        if (session?.user) {
          routeByRole(session.user.id)
        } else {
          setChecking(false)
        }
      } catch {
        if (active) setChecking(false)
      } finally {
        clearTimeout(safety)
      }
    }
    check()
    return () => { active = false; clearTimeout(safety) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Basic but solid email format check.
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    // ── SIGN-UP validations (email format, terms, signature) ──
    if (!isLogin) {
      if (!isValidEmail(email)) {
        setError('Please enter a valid email address (e.g. name@company.com).')
        return
      }
      if (!acceptedTerms) {
        setError('You must read and accept the Terms & Conditions to continue.')
        return
      }
      if (!signature.trim() || signature.trim().length < 3) {
        setError('Please type your full name as your signature to accept the Terms.')
        return
      }
    }

    setLoading(true)
    try {
      if (isLogin) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(authError.message || 'Invalid email or password.')
        } else if (authData.user) {
          await routeByRole(authData.user.id)
        } else {
          setError('Invalid email or password.')
        }
      } else {
        const { data: signData, error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || null,
              company_name: companyName || null,
              mobile_phone: mobilePhone || null,
            }
          }
        })

        if (signError) {
          setError(signError.message)
        } else if (signData.user) {
          // Record the Terms acceptance (name + signature + timestamp).
          try {
            await supabase.from('terms_acceptances').insert({
              user_id: signData.user.id,
              email: email.trim(),
              full_name: fullName || signature.trim(),
              signature: signature.trim(),
            })
          } catch { /* non-blocking: never stop signup over the audit row */ }

          if (signData.session) {
            await routeByRole(signData.user.id)
          } else {
            // Fallback: confirm-email may be ON → try immediate sign-in.
            const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
            if (loginErr) {
              setError('Account created. Please sign in.')
              setIsLogin(true)
            } else if (loginData.user) {
              await routeByRole(loginData.user.id)
            }
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRecover = async () => {
    if (!email) {
      setError('Please enter your Email Address first.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) setError(error.message)
    else setMessage('Password reset instructions sent to your email.')
    setLoading(false)
  }

  if (checking) {
    return (
      <main className="relative min-h-screen flex items-center justify-center bg-[#030208]">
        <div className="w-10 h-10 border-4 border-[#9b5de5]/20 border-t-[#9b5de5] rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#030208] p-4 sm:p-8 overflow-hidden font-['DM_Sans',sans-serif]">

      <div className="absolute inset-0 z-0 w-full h-full opacity-80 mix-blend-screen pointer-events-none">
         <NeuralBrainScene />
      </div>
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030208_100%)] pointer-events-none" />

      {/* ── BACK TO HOME ── */}
      <Link
        href="/"
        className="absolute top-5 left-5 sm:top-8 sm:left-8 z-30 group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#070512]/70 backdrop-blur-md border border-white/[0.08] text-[#8a80a0] hover:text-white hover:border-[#9b5de5]/40 transition-all"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Back to Home</span>
      </Link>

      <div className="relative z-20 w-full max-w-[480px]">

        <div className="relative rounded-3xl sm:rounded-[2rem] bg-[#070512]/60 backdrop-blur-[40px] border border-white/[0.06] p-6 sm:p-12 shadow-[0_20px_80px_-20px_rgba(108,59,156,0.5),inset_0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden transition-all duration-500">

          <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#9b5de5] to-transparent opacity-60" />

          <div className="text-center mb-8 sm:mb-10 relative z-10">
            <h1 className="font-['Syne',sans-serif] text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 text-white">
              {isLogin ? 'Welcome Back.' : 'Create Account.'}
            </h1>

            {error && (
              <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs tracking-wide">
                {error}
              </div>
            )}
            {message && (
              <div className="mt-4 px-4 py-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl text-[#10b981] text-xs tracking-wide">
                {message}
              </div>
            )}
            {!error && !message && (
              <p className="text-[#8a80a0] text-sm font-light mt-2">
                {isLogin ? 'Sign in to access your dashboard.' : 'Start sending with enterprise reliability.'}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">

            {!isLogin && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="flex justify-between text-[11px] font-bold text-[#8a80a0] uppercase tracking-wider mb-2 ml-1">
                      <span>Full Name</span>
                      <span className="text-[#4a4060]">Optional</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#04030a]/80 border border-white/[0.04] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 focus:bg-black/60 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] placeholder:text-[#3a3050]"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-[11px] font-bold text-[#8a80a0] uppercase tracking-wider mb-2 ml-1">
                      <span>Company</span>
                      <span className="text-[#4a4060]">Optional</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#04030a]/80 border border-white/[0.04] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 focus:bg-black/60 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] placeholder:text-[#3a3050]"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex justify-between text-[11px] font-bold text-[#8a80a0] uppercase tracking-wider mb-2 ml-1">
                    <span>Phone Number</span>
                    <span className="text-[#4a4060]">Optional</span>
                  </label>
                  <input
                    type="tel"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    className="w-full bg-[#04030a]/80 border border-white/[0.04] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 focus:bg-black/60 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] placeholder:text-[#3a3050]"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#8a80a0] uppercase tracking-wider mb-2 ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#04030a]/80 border border-white/[0.04] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 focus:bg-black/60 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] placeholder:text-[#3a3050]"
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[11px] font-bold text-[#8a80a0] uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={handleRecover}
                    className="text-[11px] font-bold text-[#9b5de5] hover:text-white transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#04030a]/80 border border-white/[0.04] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 focus:bg-black/60 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] placeholder:text-[#3a3050] tracking-widest"
                placeholder="••••••••••••"
                required
              />
            </div>

            {/* ── TERMS & CONDITIONS (sign-up only) ── */}
            {!isLogin && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#8a80a0] uppercase tracking-wider mb-2 ml-1">
                    Signature — Type Your Full Name
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="w-full bg-[#04030a]/80 border border-white/[0.04] rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 focus:bg-black/60 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] placeholder:text-[#3a3050] font-['Syne',sans-serif] italic"
                    placeholder="Your full legal name"
                  />
                </div>

                <div className="flex items-start gap-3 bg-[#04030a]/60 border border-white/[0.05] rounded-xl p-3.5">
                  <button
                    type="button"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`shrink-0 mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${acceptedTerms ? 'bg-[#9b5de5] border-[#9b5de5]' : 'bg-transparent border-white/20 hover:border-[#9b5de5]/60'}`}
                  >
                    {acceptedTerms && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <p className="text-[11.5px] leading-relaxed text-[#8a80a0]">
                    I confirm I have read and accept the{' '}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-[#9b5de5] hover:text-white font-bold underline underline-offset-2 transition-colors">
                      Terms &amp; Conditions
                    </button>
                    , and I take full responsibility for my account and all actions taken through it.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9b5de5] hover:bg-[#8040cd] text-white font-['Syne',sans-serif] font-bold py-4 rounded-xl transition-all duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(155,93,229,0.3)]"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/[0.04] pt-6 relative z-10">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError(null)
                setMessage(null)
              }}
              className="text-xs text-[#7a7090] hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

        </div>
      </div>

      {showTerms && (
        <TermsModal
          onClose={() => setShowTerms(false)}
          onAccept={() => setAcceptedTerms(true)}
        />
      )}
    </main>
  )
}