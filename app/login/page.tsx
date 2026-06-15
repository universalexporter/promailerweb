'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const NeuralBrainScene = dynamic(() => import('@/components/3d/NeuralBrainScene'), { ssr: false })

export default function LoginPage() {
  const router = useRouter()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // ── Route a signed-in user to the correct panel by role. ──
  const routeByRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', userId).single()
    if (profile?.role === 'admin' || profile?.role === 'support') {
      router.replace('/support-desk')
    } else {
      router.replace('/dashboard')
    }
    router.refresh()
  }

  // ── On load: if there's a REAL session, leave login. If the stored session
  //    is stale/invalid, just show the form (don't hang on the spinner). ──
  useEffect(() => {
    let active = true

    // Safety net: no matter what happens with the auth check (network hang,
    // SDK stall, etc.), never leave the user stuck on the spinner. After 2.5s
    // we show the login form regardless.
    const safety = setTimeout(() => { if (active) setChecking(false) }, 2500)

    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!active) return

        if (session?.user) {
          // Genuinely logged in → route to the right panel.
          // (Spinner stays until the route change happens — that's fine.)
          routeByRole(session.user.id)
        } else {
          // Not logged in → show the login form.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isLogin) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError(authError.message)
      } else if (authData.user) {
        await routeByRole(authData.user.id)
      }
    } else {
      // SIGN UP — no email verification. Requires "Confirm email" to be OFF in
      // Supabase Auth settings so a session is returned immediately.
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
      } else if (signData.session && signData.user) {
        // Confirm-email is OFF → we got a session → go straight in.
        await routeByRole(signData.user.id)
      } else if (signData.user) {
        // Fallback: if a session wasn't returned, try an immediate sign-in.
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
        if (loginErr) {
          setError('Account created. Please sign in.')
          setIsLogin(true)
        } else if (loginData.user) {
          await routeByRole(loginData.user.id)
        }
      }
    }
    setLoading(false)
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

  // While verifying an existing session, show a tiny loader (prevents the
  // form from flashing for already-logged-in users).
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

    </main>
  )
}