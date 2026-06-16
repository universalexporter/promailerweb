'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabaseClient'
import GuideModal from '@/components/GuideModal'
import DomainManager from '@/components/DomainManager'
import DownloadButton from '@/components/DownloadButton'

// ─── 1. CORE SYSTEM INITIALIZATION ──────────────────────────────────────────
// The shared cookie-based client is imported from '@/lib/supabaseClient' so the
// browser and the server middleware read the same session (prevents login loops).

// Public download link for the Windows desktop installer (hosted on Supabase Storage).
const WINDOWS_INSTALLER_URL =
  'https://ijhmrmubqexpvwmnhlrm.supabase.co/storage/v1/object/public/downloads/ProMailSuite-Setup.exe'

const NeuralBrainScene = dynamic(() => import('@/components/3d/NeuralBrainScene'), { ssr: false })

// ─── 2. DYNAMIC PRICING TYPES ───────────────────────────────────────────────
type PricingData = {
  id: string
  name: string
  price: number
  email_limit: number
  overage_cost: number
  features: string[]
}

// ─── 3. ICONS LIBRARY (SVG) ─────────────────────────────────────────────────
const Icons = {
  ChatBubble: () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> ),
  Close: () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg> ),
  Paperclip: () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg> ),
  Send: () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> ),
  Bolt: () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> ),
  Terminal: () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> ),
  Copy: () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> ),
  Check: () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> ),
  Windows: () => ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/></svg> ),
  Apple: () => ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.189 14.86c-.347.05-1.503-.687-2.748-.687-1.391 0-2.457.77-3.693.77-1.637 0-3.37-1.28-4.444-2.846-1.583-2.316-2.073-5.326-.818-7.25 1.002-1.53 2.656-2.518 4.417-2.518 1.488 0 2.593.687 3.655.687 1.026 0 2.308-.748 3.864-.748.593 0 2.298.064 3.394 1.139-3.082 1.62-2.564 5.679.526 6.945-.63 1.624-1.666 3.094-3.153 4.508zM14.545 4.5c-.752 1.025-2.091 1.64-3.12 1.554.168-1.218.824-2.375 1.627-3.094 1.008-.9 2.264-1.442 3.235-1.42-.164 1.258-.87 2.102-1.742 2.96z"/></svg> ),
  Download: () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> )
}

// ─── 4. MAIN DASHBOARD COMPONENT ────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()

  // Base State
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>('Loading...')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Dynamic Pricing State
  const [dynamicTiers, setDynamicTiers] = useState<PricingData[]>([])

  // Dashboard Data State
  const [walletBalance, setWalletBalance] = useState<number>(0.00)
  const [apiKey, setApiKey] = useState<string>('Loading...')
  const [isAccountActive, setIsAccountActive] = useState<boolean>(false)

  // Active Plan & Precise Countdown State
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [pays, setPays] = useState<{ enabled: boolean; total: number; daily: number; usedTotal: number; usedToday: number; expiresAt: string | null } | null>(null)
  const [expiresAtDate, setExpiresAtDate] = useState<Date | null>(null)
  const [preciseCountdown, setPreciseCountdown] = useState<string>('Calculating...')
  const [emailsSent, setEmailsSent] = useState<number>(0)

  // Checkout & Upgrade State
  const [depositAmount, setDepositAmount] = useState<number>(50)
  const [selectedTier, setSelectedTier] = useState<string>('pro')
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  // Support Chat State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatTicketId, setChatTicketId] = useState<string | null>(null)
  const [isChatUploading, setIsChatUploading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Notification sound — created lazily and guarded so a missing /tick.mp3
  // never throws a console error. We only attempt to load it on the client.
  const tickSoundRef = useRef<HTMLAudioElement | null>(null)
  const playTick = () => {
    try {
      if (typeof window === 'undefined') return
      if (!tickSoundRef.current) {
        const a = new Audio('/tick.mp3')
        a.preload = 'none'           // don't fetch until we actually play
        tickSoundRef.current = a
      }
      // play() returns a promise; swallow any error (missing file, autoplay block)
      tickSoundRef.current.play().catch(() => {})
    } catch {
      /* no-op: sound is a nice-to-have, never critical */
    }
  }

  // Safe sign-out + redirect, reused by the stale-session guard and the button.
  const forceLogout = async () => {
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    router.push('/login')
  }

  // ─── 5. INITIALIZATION, REALTIME & PRECISION TIMER ────────────────────────
  useEffect(() => {
    let planSubscription: any = null

    const checkUserAndFetchData = async () => {
      // Guard against a stale/invalid refresh token: if getSession errors or
      // there's no session, sign out cleanly and go to login instead of letting
      // an "Invalid Refresh Token" error surface in the console.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        await forceLogout()
        return
      }

      setUserId(session.user.id)
      setUserEmail(session.user.email ?? 'Unknown User')

      try {
        const [profileRes, walletRes, pricingRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          supabase.from('wallets').select('balance').eq('user_id', session.user.id).single(),
          fetch('/api/admin/system-pricing', { cache: 'no-store' }).then(res => res.ok ? res.json() : { pricing: [] })
        ])

        if (pricingRes.pricing && pricingRes.pricing.length > 0) {
          // Exclude the hidden 'ledger_rate' row — that is only for the homepage
          // animation, never a real client plan.
          setDynamicTiers(pricingRes.pricing.filter((p: any) => p.id !== 'ledger_rate'))
        } else {
          console.warn('No pricing data found in global table.')
        }

        if (profileRes.data) {
          setApiKey(profileRes.data.api_key)
          const dbPlan = profileRes.data.active_plan_id
          const dbExpires = profileRes.data.plan_expires_at
          const bal = Number(walletRes.data?.balance) || 0
          // Always reflect the profile's plan + usage, regardless of wallet state.
          setEmailsSent(profileRes.data.emails_sent || 0)

          // Pay-As-You-Send package (separate from subscriptions/wallet).
          const hasPays = !!profileRes.data.pays_enabled
          if (hasPays) {
            setPays({
              enabled: true,
              total: Number(profileRes.data.pays_total_quota) || 0,
              daily: Number(profileRes.data.pays_daily_cap) || 0,
              usedTotal: Number(profileRes.data.pays_used_total) || 0,
              usedToday: Number(profileRes.data.pays_used_today) || 0,
              expiresAt: profileRes.data.pays_expires_at || null,
            })
            setIsAccountActive(true) // a PAYS package counts as an active account
          }

          if (dbPlan) {
            setActivePlanId(dbPlan)
            setIsAccountActive(true)
            if (dbExpires) setExpiresAtDate(new Date(dbExpires))
          } else if (bal > 0 && !hasPays) {
            // No subscription but has wallet funds → active pay-as-you-go account.
            // (Skip this for PAYS clients — PAYS is already their plan.)
            setActivePlanId('starter')
            setIsAccountActive(true)
          }
        }

        if (walletRes.data) setWalletBalance(Number(walletRes.data.balance))

        planSubscription = supabase
          .channel('public:profiles_and_wallets')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
            async (payload) => {
              const newDbPlan = payload.new.active_plan_id
              const newDbExpires = payload.new.plan_expires_at
              if (newDbPlan) {
                setIsAccountActive(true)
                setActivePlanId(newDbPlan)
                setIsUpgrading(false)
                if (newDbExpires) setExpiresAtDate(new Date(newDbExpires))
              }
              // live PAYS updates (admin set/topped-up/disabled the package)
              if (payload.new.pays_enabled) {
                setPays({
                  enabled: true,
                  total: Number(payload.new.pays_total_quota) || 0,
                  daily: Number(payload.new.pays_daily_cap) || 0,
                  usedTotal: Number(payload.new.pays_used_total) || 0,
                  usedToday: Number(payload.new.pays_used_today) || 0,
                  expiresAt: payload.new.pays_expires_at || null,
                })
                setIsAccountActive(true)
              } else if (payload.new.pays_enabled === false) {
                setPays(null)
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${session.user.id}` },
            async (payload) => setWalletBalance(Number(payload.new.balance))
          )
          .subscribe()

      } catch (error) {
        console.error('Data fetch error:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkUserAndFetchData()
    return () => { if (planSubscription) supabase.removeChannel(planSubscription) }
  }, [router])

  // Precision Countdown Engine (Ticks every second)
  useEffect(() => {
    if (!expiresAtDate) return
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = expiresAtDate.getTime() - now
      if (distance < 0) {
        setPreciseCountdown('EXPIRED')
        clearInterval(interval)
        return
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      setPreciseCountdown(`${days}d ${hours}h ${minutes}m`)
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAtDate])

  // ─── 6. SUPPORT CHAT ENGINE ───────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return

    const initializeChat = async () => {
      let { data: ticket } = await supabase.from('support_tickets').select('id').eq('user_id', userId).single()
      if (!ticket) {
        const { data: newTicket } = await supabase.from('support_tickets').insert({ user_id: userId }).select().single()
        ticket = newTicket
      }
      if (!ticket) return
      setChatTicketId(ticket.id)
      const { data: msgs } = await supabase.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true })
      if (msgs) setChatMessages(msgs)
    }

    initializeChat()

    const channel = supabase
      .channel('client_support_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
        const newMsg = payload.new
        setChatMessages((prev) => [...prev, newMsg])
        if (newMsg.sender_id !== userId) {
          playTick()
          if (!isChatOpen) setIsChatOpen(true)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, isChatOpen])

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatOpen])

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !chatTicketId || !userId) return
    const msgToSend = chatInput
    setChatInput('')
    await supabase.from('support_messages').insert({ ticket_id: chatTicketId, sender_id: userId, message: msgToSend })
  }

  const [requestingSetup, setRequestingSetup] = useState(false)
  const handleRequestPrivateSetup = async () => {
    if (!userId || requestingSetup) return
    setRequestingSetup(true)
    try {
      // Make sure a ticket exists
      let ticketId = chatTicketId
      if (!ticketId) {
        let { data: ticket } = await supabase.from('support_tickets').select('id').eq('user_id', userId).single()
        if (!ticket) {
          const { data: nt } = await supabase.from('support_tickets').insert({ user_id: userId }).select().single()
          ticket = nt
        }
        ticketId = ticket?.id || null
        setChatTicketId(ticketId)
      }
      if (!ticketId) throw new Error('Could not open a support ticket.')

      // Open the chat and send the client's request message
      setIsChatOpen(true)
      await supabase.from('support_messages').insert({
        ticket_id: ticketId,
        sender_id: userId,
        message: "🚀 PRIVATE SETUP REQUEST\n\nHi! I'm new to email outreach and I'd like your team to set up my account for me from start to finish — domain, DNS, sending email, and warm-up. I've never done this before and would really appreciate full hands-on assistance. Please let me know how we can get started!"
      })
    } catch (err) {
      console.error('Private setup request failed:', err)
      alert('Could not start the request. Please try the chat directly.')
    } finally {
      setRequestingSetup(false)
    }
  }

  const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId || !chatTicketId) return
    setIsChatUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    try {
      const { error: uploadError } = await supabase.storage.from('chat_attachments').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(fileName)
      await supabase.from('support_messages').insert({ ticket_id: chatTicketId, sender_id: userId, image_url: publicUrl })
    } catch (error) {
      alert('Failed to securely upload attachment.')
    } finally {
      setIsChatUploading(false)
    }
  }

  // ─── 7. DASHBOARD ACTIONS ─────────────────────────────────────────────────
  const handleSignOut = async () => {
    setIsLoggingOut(true)
    await forceLogout()
  }

  const handleCopyApiKey = () => {
    if (!apiKey || apiKey === 'Loading...') return
    navigator.clipboard.writeText(apiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handleCheckout = async (amount: number, description: string, type: 'activation' | 'topup' | 'upgrade', planId: string = 'wallet') => {
    const paymentWindow = window.open('', '_blank')
    setIsProcessingCheckout(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // order_id format MUST match checkout + webhook: type|planId|userId|timestamp
        // (real userId, not email; "|" separator so emails never break the split)
        body: JSON.stringify({ amount, description, order_id: `${type}|${planId}|${userId}|${Date.now()}` })
      })
      const data = await response.json()
      if (data.checkout_url && paymentWindow) paymentWindow.location.href = data.checkout_url
      else {
        if (paymentWindow) paymentWindow.close()
        // Show the REAL reason from CoinPayments so issues are diagnosable.
        const reason = data?.error ? String(data.error) : 'Unknown gateway error'
        console.error('Checkout gateway error:', reason)
        alert(`Payment could not be started:\n\n${reason}\n\nIf this persists, contact support.`)
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      if (paymentWindow) paymentWindow.close()
      alert('Failed to establish secure payment connection.')
    } finally {
      setIsProcessingCheckout(false)
    }
  }

  if (isCheckingAuth) return <div className="min-h-screen bg-[#020106]" />

  const safeTiers = dynamicTiers.length > 0 ? dynamicTiers : []
  const currentPlanObj = safeTiers.find(t => t.id === activePlanId) || safeTiers[0] || { id: 'none', name: 'Loading', price: 0, email_limit: 0, overage_cost: 0.0035, features: [] }

  const activeOverageCost = currentPlanObj.overage_cost || 0.0035
  const availableOverageEmails = Math.floor(walletBalance / activeOverageCost)

  const hasPlanEmailsLeft = currentPlanObj.email_limit > 0 && emailsSent < currentPlanObj.email_limit
  const isOutOfFunds = isAccountActive && walletBalance <= 0 && !hasPlanEmailsLeft

  const isPlanExpired = preciseCountdown === 'EXPIRED'
  // A client whose only active plan is Pay-As-You-Send (no real subscription).
  const isPaysOnly = !!(pays && pays.enabled && !activePlanId)
  const usagePercentage = currentPlanObj.email_limit > 0 ? Math.min(100, (emailsSent / currentPlanObj.email_limit) * 100) : 0

  // ─── 9. MAIN UI RENDER ────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen bg-[#020106] text-white font-['DM_Sans',sans-serif] overflow-y-auto selection:bg-[#9b5de5]/30">

      {/* Background Engine */}
      <div className="fixed inset-0 z-0 w-full h-full opacity-30 mix-blend-screen pointer-events-none">
         <NeuralBrainScene />
      </div>
      <div className="fixed inset-0 z-10 bg-[radial-gradient(circle_at_top,#1a0b2e_0%,#020106_60%)] opacity-60 pointer-events-none" />

      {/* ── CSS INJECTIONS ── */}
      <style dangerouslySetInnerHTML={{__html: `
        .pro-scroll::-webkit-scrollbar { width: 4px; }
        .pro-scroll::-webkit-scrollbar-track { background: transparent; }
        .pro-scroll::-webkit-scrollbar-thumb { background: rgba(155, 93, 229, 0.3); border-radius: 10px; }
        .pro-scroll::-webkit-scrollbar-thumb:hover { background: rgba(155, 93, 229, 0.6); }
      `}} />

      <div className="relative z-20 max-w-7xl mx-auto p-4 sm:p-6 md:p-12 animate-[fadeUp_0.8s_ease-out]">

        {/* ── HEADER ── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 sm:mb-12 gap-5 sm:gap-6 border-b border-white/[0.04] pb-6 sm:pb-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#9b5de5]/50 to-transparent" />
          {/* ambient header glow */}
          <div className="absolute -top-20 left-1/4 w-72 h-40 bg-[#9b5de5]/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="w-full md:w-auto relative z-10">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-[#9b5de5]/[0.08] border border-[#9b5de5]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9b5de5] shadow-[0_0_8px_#9b5de5]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c8b0e0] font-['Syne',sans-serif]">ProMail Suite</span>
            </div>
            <h1 className="font-['Syne',sans-serif] text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white drop-shadow-[0_0_25px_rgba(155,93,229,0.2)]">
              Client <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#c8b0e0] to-[#9b5de5]">Portal</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <p className="text-[#8a80a0] text-xs md:text-sm flex items-center gap-2 font-medium tracking-wide break-all">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_10px_#10b981] shrink-0" />
                {userEmail}
              </p>
              <div className="flex items-center">
                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-inner transition-all duration-500 ${isAccountActive && !isPlanExpired ? 'border-[#10b981]/40 text-[#10b981] bg-[#10b981]/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-red-500/40 text-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]'}`}>
                  {isAccountActive && !isPlanExpired ? 'Active Plan' : 'Plan Inactive'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleSignOut} disabled={isLoggingOut} className="w-full md:w-auto relative z-10 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] text-[#8a80a0] hover:text-white transition-all border border-white/[0.08] px-6 py-3 rounded-xl bg-[#070512]/80 hover:bg-white/[0.05] hover:border-[#9b5de5]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.5)]">
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </header>

        {/* ── Request Private Setup banner ── */}
        <section className="mb-8 sm:mb-10 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#9b5de5]/25 bg-gradient-to-r from-[#9b5de5]/[0.08] via-[#0a0614]/60 to-[#10b981]/[0.06] backdrop-blur-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]">
          <div className="absolute -top-16 -left-10 w-56 h-32 bg-[#9b5de5]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h3 className="font-['Syne',sans-serif] font-bold text-white text-base sm:text-lg tracking-tight mb-1.5 flex items-center gap-2">
              <span className="text-lg">🚀</span> New here? Let us set it up for you.
            </h3>
            <p className="text-[#9888ad] text-xs sm:text-[13px] leading-relaxed max-w-xl">
              Never done email outreach before? Request private setup and our team can guide you from zero to your first send — domain, DNS, warm-up, everything.
            </p>
          </div>
          <button onClick={handleRequestPrivateSetup} disabled={requestingSetup} className="relative z-10 shrink-0 w-full sm:w-auto font-['Syne',sans-serif] font-bold text-white text-[11px] uppercase tracking-[0.15em] px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#6c3b9c] to-[#9b5de5] shadow-[0_0_30px_rgba(155,93,229,0.4)] hover:shadow-[0_0_50px_rgba(155,93,229,0.6)] hover:-translate-y-0.5 transition-all disabled:opacity-50">
            {requestingSetup ? 'Opening chat...' : 'Request Private Setup'}
          </button>
        </section>

        {pays && pays.enabled && (
          <section className="mb-8 sm:mb-10 relative overflow-hidden rounded-3xl sm:rounded-[2rem] border border-[#f59e0b]/25 bg-gradient-to-b from-[#0a0614]/80 to-[#04020a]/80 backdrop-blur-[50px] p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-20px_rgba(0,0,0,0.8)]">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#f59e0b]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="font-['Syne',sans-serif] text-[#f59e0b] font-bold text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b] animate-pulse" /> Test Plan Package
                </h2>
                <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#10b981]/30 text-[#10b981] bg-[#10b981]/10 self-start">● Active</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <div className="text-[9px] text-[#8a80a0] uppercase tracking-widest font-bold mb-1">Emails Remaining</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#10b981] font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{Math.max(0, pays.total - pays.usedTotal).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#8a80a0] uppercase tracking-widest font-bold mb-1">Total Package</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{pays.total.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#8a80a0] uppercase tracking-widest font-bold mb-1">Sent Today</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">{pays.usedToday.toLocaleString()}{pays.daily > 0 && <span className="text-sm text-[#8a80a0]"> / {pays.daily.toLocaleString()}</span>}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#8a80a0] uppercase tracking-widest font-bold mb-1">Expires</div>
                  <div className="text-lg sm:text-xl font-bold text-white font-mono">{pays.expiresAt ? new Date(pays.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Expiry'}</div>
                </div>
              </div>
              {pays.total - pays.usedTotal <= 0 && (
                <div className="mt-5 text-[11px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-4 py-3 rounded-xl">
                  Your email allowance is used up. Please contact support to top up.
                </div>
              )}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">

          {/* ── LEFT COLUMN: PAY AS YOU SEND (OVERAGE) ── */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-10">
            <section className={`bg-gradient-to-b from-[#0a0614]/80 to-[#04020a]/80 border ${isOutOfFunds ? 'border-red-500/30' : 'border-white/[0.08]'} backdrop-blur-[50px] rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden transition-colors duration-500`}>
              <div className={`absolute -top-32 -right-32 w-96 h-96 ${isOutOfFunds ? 'bg-red-500/10' : 'bg-[#9b5de5]/10'} blur-[100px] rounded-full pointer-events-none transition-all duration-700`} />

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 relative z-10">
                <h2 className="font-['Syne',sans-serif] text-[#8a80a0] font-bold text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Icons.Bolt /> Overage Balance (Pay-As-You-Send)
                </h2>
                {isOutOfFunds && (
                  <div className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)] self-start">
                    ⚠️ DEPOSIT FUNDS TO CONTINUE
                  </div>
                )}
              </div>

              <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 font-mono ${isOutOfFunds ? 'text-red-400' : 'text-white'} relative z-10 flex items-baseline gap-3 drop-shadow-md`}>
                {walletBalance.toFixed(2)} <span className={`text-lg sm:text-xl font-['DM_Sans',sans-serif] ${isOutOfFunds ? 'text-red-500' : 'text-[#8a80a0]'}`}>USDT</span>
              </div>

              <div className="bg-black/40 border border-white/[0.05] rounded-xl p-4 sm:p-5 mb-8 sm:mb-10 relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 shadow-inner">
                <span className="text-[11px] text-[#8a80a0] font-bold uppercase tracking-[0.2em]">Est. Overage Capacity:</span>
                <span className={`text-sm font-mono font-bold tracking-wider ${isOutOfFunds ? 'text-red-400' : 'text-[#10b981]'}`}>
                  ≈ {availableOverageEmails.toLocaleString()} extra emails
                </span>
              </div>

              <div className={`bg-black/60 border border-white/[0.04] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)] relative z-10 transition-all duration-500 ${!isAccountActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-8">
                  <div>
                    <h3 className="font-['Syne',sans-serif] font-bold text-lg sm:text-xl text-white mb-2 tracking-tight">Add Overage Funds</h3>
                    <p className="text-xs text-[#8a80a0] tracking-wide">Pre-fund your account for usage beyond your plan limits.</p>
                  </div>
                  <div className="text-left sm:text-right text-2xl font-bold font-mono text-[#9b5de5] drop-shadow-[0_0_15px_rgba(155,93,229,0.4)]">
                    {depositAmount} <span className="text-sm">USDT</span>
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex justify-between items-center text-[11px] font-bold text-white mb-5">
                    <span className="uppercase tracking-widest text-[#8a80a0]">Est. Capacity</span>
                    <span className="text-[#9b5de5] bg-[#9b5de5]/10 px-4 py-1.5 rounded-lg border border-[#9b5de5]/20 shadow-inner tracking-wider">
                      + {Math.floor(depositAmount / activeOverageCost).toLocaleString()} emails
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-[#020106] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,1)] border border-white/[0.02]">
                    <input
                      type="range" min="50" max="5000" step="50"
                      value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#9b5de5] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_20px_#9b5de5]"
                    />
                    <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#6c3b9c] to-[#9b5de5] rounded-full pointer-events-none" style={{ width: `${((depositAmount - 50) / (5000 - 50)) * 100}%` }} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 sm:gap-6 border-t border-white/[0.04] pt-8">
                  <p className="text-[10px] text-[#6a6080] sm:max-w-[280px] leading-relaxed uppercase tracking-[0.15em] font-bold">
                    {!isAccountActive ? 'Choose a primary plan before adding funds.' : 'Funds instantly credited to sending engine.'}
                  </p>
                  <button onClick={() => handleCheckout(depositAmount, 'Overage Balance Top-Up', 'topup', 'wallet')} disabled={!isAccountActive || isProcessingCheckout} className="w-full sm:w-auto relative group overflow-hidden rounded-xl p-[1px] disabled:opacity-50">
                    <span className="absolute inset-0 bg-gradient-to-r from-[#9b5de5] via-[#6c3b9c] to-[#9b5de5] opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center bg-[#070512] rounded-xl px-8 sm:px-12 py-4 transition-all duration-300 group-hover:bg-transparent">
                      <span className="font-['Syne',sans-serif] font-bold text-white text-[11px] uppercase tracking-[0.2em]">
                        {isProcessingCheckout ? 'Generating...' : `Add ${depositAmount} USDT`}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ── RIGHT COLUMN: HIGH-END PLAN ACTIVATION ── */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-10">
            <section className="bg-gradient-to-b from-[#0a0614]/80 to-[#04020a]/80 border border-white/[0.08] backdrop-blur-[50px] rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden h-full flex flex-col">

              <div className="flex justify-between items-start mb-8 gap-3">
                <div>
                  <h2 className="font-['Syne',sans-serif] text-white font-extrabold text-lg sm:text-xl tracking-tight">
                    {isAccountActive && !isUpgrading ? 'Subscription Data' : 'Network Access'}
                  </h2>
                  <p className="text-[11px] text-[#8a80a0] leading-relaxed mt-2 tracking-[0.1em] uppercase font-bold">
                    {isAccountActive && !isUpgrading ? 'Manage your active cloud node.' : 'Select a premium tier to unlock routing.'}
                  </p>
                </div>
                {isUpgrading && (
                  <button onClick={() => setIsUpgrading(false)} className="shrink-0 text-[10px] font-bold text-[#8a80a0] hover:text-white uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/10 transition-colors">Cancel</button>
                )}
              </div>

              {/* ── VIEW 1: ACTIVE SUBSCRIPTION ── */}
              {isAccountActive && !isUpgrading ? (
                <div className="animate-[fadeUp_0.4s_ease-out] flex-1 flex flex-col">

                  <div className="bg-black/60 border border-[#9b5de5]/20 rounded-2xl p-5 sm:p-6 shadow-[inset_0_2px_20px_rgba(155,93,229,0.05),0_10px_30px_rgba(0,0,0,0.5)] mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#9b5de5]/10 rounded-bl-full pointer-events-none"></div>

                    <div className="flex justify-between items-start mb-6 gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8a80a0] font-bold mb-1">Active Plan</div>
                        <div className="text-xl sm:text-2xl font-bold text-white font-['Syne',sans-serif]">{isPaysOnly ? 'Test Plan' : currentPlanObj.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8a80a0] font-bold mb-1">{isPaysOnly ? 'Package Expires' : 'Time Remaining'}</div>
                        {isPaysOnly ? (
                          <div className="text-[#f59e0b] font-mono font-bold text-sm bg-[#f59e0b]/10 px-3 py-1.5 rounded-lg border border-[#f59e0b]/30 shadow-inner tracking-wide">{pays?.expiresAt ? new Date(pays.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No Expiry'}</div>
                        ) : isPlanExpired ? (
                          <div className="text-red-400 font-bold text-sm bg-red-500/10 px-3 py-1 rounded border border-red-500/30">EXPIRED</div>
                        ) : (
                          <div className="text-[#9b5de5] font-mono font-bold text-sm bg-[#9b5de5]/10 px-3 py-1.5 rounded-lg border border-[#9b5de5]/30 shadow-inner tracking-widest">{preciseCountdown}</div>
                        )}
                      </div>
                    </div>

                    <div className="mb-2 flex justify-between text-[11px] font-bold text-white">
                      <span className="uppercase tracking-widest text-[#8a80a0]">{isPaysOnly ? 'Emails Used' : 'Monthly Usage'}</span>
                      <span className="font-mono text-[#9b5de5]">{isPaysOnly ? `${(pays?.usedTotal || 0).toLocaleString()} / ${(pays?.total || 0).toLocaleString()}` : `${emailsSent.toLocaleString()} / ${currentPlanObj.email_limit?.toLocaleString()}`}</span>
                    </div>
                    <div className="relative w-full h-2 bg-[#020106] rounded-full shadow-inner border border-white/[0.05] overflow-hidden">
                      <div className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${usagePercentage > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-[#6c3b9c] to-[#9b5de5]'}`} style={{ width: `${isPaysOnly ? (pays && pays.total > 0 ? Math.min(100, (pays.usedTotal / pays.total) * 100) : 0) : usagePercentage}%` }} />
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4 shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] mb-8">
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-4 gap-3">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#8a80a0] font-bold flex items-center gap-2">
                        <Icons.Terminal /> API Access Token
                      </span>
                      <button onClick={handleCopyApiKey} className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.15em] transition-all border px-4 py-2 rounded-lg flex items-center gap-1.5 ${copiedKey ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40' : 'bg-white/[0.05] text-[#8a80a0] hover:text-white border-white/[0.05]'}`}>
                        {copiedKey ? <><Icons.Check /> Copied</> : <><Icons.Copy /> Copy</>}
                      </button>
                    </div>
                    <div className="pt-2">
                      <code className="font-mono text-sm tracking-widest block break-all text-[#9b5de5] drop-shadow-[0_0_8px_rgba(155,93,229,0.3)]">pk_live_••••••••••••••••••••••••</code>
                    </div>
                  </div>

                  <button onClick={() => setIsUpgrading(true)} className="w-full relative group/btn overflow-hidden rounded-xl p-[1px] mt-auto shrink-0">
                    <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/30 to-white/10 opacity-80 group-hover/btn:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center bg-[#070512] rounded-xl px-8 py-4 transition-all duration-300 group-hover/btn:bg-transparent">
                      <span className="font-['Syne',sans-serif] font-bold text-white text-[11px] uppercase tracking-[0.2em]">{isPaysOnly ? 'Upgrade to a Full Plan' : 'Upgrade Plan'}</span>
                    </div>
                  </button>
                </div>
              ) : (

              /* ── VIEW 2: DYNAMIC PRICING MATRIX SELECTOR ── */
                <div className="flex-1 flex flex-col justify-between animate-[fadeUp_0.4s_ease-out]">

                  {dynamicTiers.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-12">
                        <div className="text-center text-[#8a80a0] font-mono animate-pulse">Syncing dynamic global pricing...</div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 mb-8">
                        {dynamicTiers.map((tier) => {
                        let displayPrice = tier.price
                        const isCurrentPlan = isAccountActive && currentPlanObj.id === tier.id
                        if (isUpgrading && !isCurrentPlan) displayPrice = Math.max(0, tier.price - currentPlanObj.price)
                        const isSelected = selectedTier === tier.id
                        const isPro = tier.id === 'pro'

                        return (
                            <div
                            key={tier.id} onClick={() => !isCurrentPlan && setSelectedTier(tier.id)}
                            className={`relative p-5 rounded-2xl transition-all duration-500 overflow-hidden cursor-pointer border ${
                                isCurrentPlan ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed' :
                                isSelected ? 'bg-gradient-to-b from-[#150a25] to-[#0a0512] border-[#9b5de5]/60 shadow-[0_0_30px_rgba(155,93,229,0.2),inset_0_2px_20px_rgba(155,93,229,0.1)] transform scale-[1.02]' :
                                'bg-black/60 border-white/[0.06] hover:border-white/20'
                            }`}
                            >
                            {isSelected && <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#9b5de5] to-transparent shadow-[0_0_10px_#9b5de5]" />}
                            {isPro && !isCurrentPlan && <div className="absolute top-3 right-3 bg-[#9b5de5]/20 border border-[#9b5de5]/40 text-[#9b5de5] text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-md shadow-[0_0_10px_rgba(155,93,229,0.2)]">Recommended</div>}

                            <div className="flex justify-between items-start mb-4 relative z-10 gap-3">
                                <div>
                                <div className={`font-['Syne',sans-serif] font-bold text-lg tracking-tight ${isSelected ? 'text-white' : 'text-[#8a80a0]'}`}>
                                    {tier.name} {isCurrentPlan && <span className="text-[10px] ml-2 font-mono text-[#8a80a0]">(Current)</span>}
                                </div>
                                </div>
                                <div className="text-right">
                                <div className={`font-mono font-black text-lg sm:text-xl tracking-tighter ${isSelected ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-[#6a6080]'}`}>
                                    {isUpgrading ? (isCurrentPlan ? '-' : `+${displayPrice}`) : tier.price} <span className="text-xs font-['DM_Sans',sans-serif] text-[#8a80a0]">USDT</span>
                                </div>
                                </div>
                            </div>

                            <ul className="space-y-2 mt-4 border-t border-white/[0.05] pt-4 relative z-10">
                                <li className={`text-[11px] uppercase tracking-wider flex items-center gap-2 font-bold ${isSelected ? 'text-[#c8b0e0]' : 'text-[#6a6080]'}`}>
                                   <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#9b5de5] shadow-[0_0_5px_#9b5de5]' : 'bg-[#4a4060]'}`} /> {tier.email_limit?.toLocaleString()} Monthly Limit
                                </li>
                                <li className={`text-[11px] uppercase tracking-wider flex items-center gap-2 font-bold ${isSelected ? 'text-[#c8b0e0]' : 'text-[#6a6080]'}`}>
                                   <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#9b5de5] shadow-[0_0_5px_#9b5de5]' : 'bg-[#4a4060]'}`} /> Overage: {tier.overage_cost} USDT/email
                                </li>
                                {tier.features && tier.features.filter((feat: string) => {
                                  // Hide stale feature text that duplicates the real
                                  // email_limit / overage_cost columns (e.g. old seeded
                                  // "Overage: 0.006 USDT/email" or "20k Monthly Limit").
                                  const f = (feat || '').toLowerCase()
                                  if (f.includes('overage')) return false
                                  if (f.includes('monthly limit')) return false
                                  return true
                                }).map((feat, i) => (
                                <li key={i} className={`text-[11px] uppercase tracking-wider flex items-center gap-2 font-bold ${isSelected ? 'text-[#c8b0e0]' : 'text-[#6a6080]'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#9b5de5] shadow-[0_0_5px_#9b5de5]' : 'bg-[#4a4060]'}`} /> {feat}
                                </li>
                                ))}
                            </ul>
                            </div>
                        )
                        })}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const selectedPlanObj = dynamicTiers.find(t => t.id === selectedTier) || dynamicTiers[0]
                      let checkoutPrice = isUpgrading ? Math.max(0, selectedPlanObj.price - currentPlanObj.price) : selectedPlanObj.price
                      handleCheckout(checkoutPrice, `${selectedPlanObj.name} ${isUpgrading ? 'Upgrade' : 'Subscription'}`, isUpgrading ? 'upgrade' : 'activation', selectedPlanObj.id)
                    }}
                    disabled={dynamicTiers.length === 0 || isProcessingCheckout || (isUpgrading && selectedTier === currentPlanObj.id)}
                    className="w-full relative group/btn overflow-hidden rounded-xl p-[1px] disabled:opacity-50 mt-auto shrink-0 shadow-[0_10px_40px_rgba(155,93,229,0.2)]"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#9b5de5] via-[#6c3b9c] to-[#9b5de5] opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center bg-[#070512] rounded-xl px-8 py-5 transition-all duration-300 group-hover/btn:bg-transparent text-center">
                      <span className="font-['Syne',sans-serif] font-bold text-white text-[12px] uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                        {isProcessingCheckout ? 'Initializing Crypto Pipeline...' : isUpgrading ? 'Confirm Secure Upgrade' : 'Initiate Subscription (USDT)'}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── GLOBAL DESKTOP ENGINE DOWNLOAD ── */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#070512] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#3b82f6]/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-center">
            <h3 className="font-['Syne',sans-serif] text-lg sm:text-xl font-bold text-white mb-2">Download Desktop Engine</h3>
            <p className="text-sm text-[#8a80a0] leading-relaxed max-w-md">Install our local software terminal to route emails securely through our network. You can configure your setup before activating a plan.</p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-center justify-start md:justify-end">
            {/* Single button → dropdown to choose Windows or Mac */}
            <DownloadButton
              align="right"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white/[0.03] hover:bg-[#3b82f6]/10 text-white rounded-xl border border-white/[0.08] hover:border-[#3b82f6]/50 transition-all font-bold text-[11px] uppercase tracking-widest shadow-sm"
            >
              <Icons.Download /> Download Desktop App
            </DownloadButton>
          </div>
        </div>

        {/* ── DOMAIN MANAGER ── */}
        {isAccountActive && (
          <div className="mt-8 sm:mt-10">
            <DomainManager apiKey={apiKey} />
          </div>
        )}

        {/* ── INSTALLATION GUIDE BANNER ── */}
        <div className="mt-8 sm:mt-10 bg-gradient-to-r from-[#9b5de5]/10 to-transparent border border-[#9b5de5]/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 backdrop-blur-md">
          <div>
            <h3 className="font-['Syne',sans-serif] text-lg sm:text-xl font-bold text-white mb-2">Need help setting up?</h3>
            <p className="text-sm text-[#8a80a0]">Read our complete step-by-step installation guide to properly configure your domains and desktop engine.</p>
          </div>
          <button onClick={() => setShowGuide(true)} className="w-full sm:w-auto shrink-0 bg-white text-black font-bold uppercase tracking-[0.15em] text-[11px] px-8 py-4 rounded-xl hover:bg-[#9b5de5] hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(155,93,229,0.4)]">
            Read Installation Guide
          </button>
        </div>

      </div>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {/* ─── LIVE SUPPORT CHAT WIDGET ──────────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end pointer-events-none">

        <div className={`transition-all duration-400 origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100 pointer-events-auto translate-y-0' : 'scale-95 opacity-0 pointer-events-none translate-y-4 hidden'}`}>
          {/* Responsive size: nearly full-width on phones, fixed 380px on larger screens */}
          <div className="w-[calc(100vw-2rem)] sm:w-[380px] h-[70vh] sm:h-[600px] max-h-[600px] mb-4 sm:mb-6 bg-[#070512]/95 border border-[#9b5de5]/30 backdrop-blur-2xl rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(155,93,229,0.15)] flex flex-col overflow-hidden">

            <div className="bg-gradient-to-r from-[#1a0b2e] to-[#070512] p-5 sm:p-6 border-b border-white/[0.05] flex justify-between items-center shrink-0 shadow-md">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#9b5de5] to-[#6c3b9c] flex items-center justify-center shadow-[0_0_20px_rgba(155,93,229,0.4)] text-white">
                    <Icons.ChatBubble />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10b981] rounded-full border-[3px] border-[#070512]"></div>
                </div>
                <div>
                  <h3 className="text-white text-base font-bold font-['Syne',sans-serif] tracking-tight">Technical Support</h3>
                  <p className="text-[10px] text-[#10b981] font-bold tracking-widest uppercase mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span> Engineers Online
                  </p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-[#8a80a0] hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2.5 rounded-xl"><Icons.Close /></button>
            </div>

            <div className="bg-gradient-to-r from-[#9b5de5]/10 via-[#9b5de5]/5 to-transparent border-b border-[#9b5de5]/20 py-3 px-5 text-center shrink-0 shadow-inner">
              <p className="text-[10px] text-[#9b5de5] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2"><Icons.Bolt />We typically reply in under 5 minutes.</p>
            </div>

            <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 pro-scroll bg-black/40">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-[#8a80a0]"><Icons.ChatBubble /></div>
                  <p className="text-xs text-[#8a80a0] font-mono leading-relaxed uppercase tracking-wider">Secure channel opened.<br /><br />Leave a message and we'll text you back shortly.</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.sender_id === userId
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl ${isMe ? 'bg-[#9b5de5]/20 border border-[#9b5de5]/30 text-white rounded-br-none shadow-[0_5px_15px_rgba(155,93,229,0.1)]' : 'bg-white/[0.05] border border-white/[0.08] text-gray-200 rounded-bl-none shadow-[0_5px_15px_rgba(0,0,0,0.2)]'}`}>
                        {msg.image_url && (
                          <div className="mb-3 relative rounded-xl overflow-hidden border border-white/10 group bg-black/50">
                            <img src={msg.image_url} alt="Secure Upload" className="w-full h-auto cursor-zoom-in transition-transform duration-500 group-hover:scale-105" onClick={() => window.open(msg.image_url, '_blank')} />
                          </div>
                        )}
                        {msg.message && <p className="leading-relaxed text-[13px] font-medium break-words">{msg.message}</p>}
                        <div className={`text-[9px] mt-2 opacity-50 font-mono tracking-widest uppercase ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChatMessage} className="p-4 sm:p-5 border-t border-white/[0.05] bg-[#070512] shrink-0">
              <div className="flex items-center gap-3 bg-black/60 border border-white/[0.1] p-2 rounded-2xl focus-within:border-[#9b5de5]/50 transition-colors shadow-inner">
                <label className="cursor-pointer shrink-0 p-2.5 text-[#8a80a0] hover:text-[#9b5de5] hover:bg-[#9b5de5]/10 rounded-xl transition-all relative">
                  <input type="file" accept="image/*" className="hidden" onChange={handleChatImageUpload} disabled={isChatUploading} />
                  <Icons.Paperclip />
                  {isChatUploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-xl">
                      <div className="w-4 h-4 border-2 border-[#9b5de5] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </label>
                <input
                  type="text" placeholder="Type a secure message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isChatUploading}
                  className="flex-1 min-w-0 bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-[#8a80a0]/50 font-mono"
                />
                <button type="submit" disabled={!chatInput.trim() || isChatUploading} className="shrink-0 p-3.5 bg-gradient-to-br from-[#9b5de5] to-[#6c3b9c] text-white rounded-xl disabled:opacity-50 hover:shadow-[0_0_20px_rgba(155,93,229,0.5)] transition-all flex items-center justify-center">
                  <Icons.Send />
                </button>
              </div>
            </form>
          </div>
        </div>

        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-[#020106] to-[#1a0b2e] rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(155,93,229,0.4)] hover:shadow-[0_0_50px_rgba(155,93,229,0.7)] hover:scale-105 transition-all duration-300 pointer-events-auto border border-white/10 group relative z-50 text-white">
          <div className="absolute inset-0 rounded-full border border-[#9b5de5]/30 group-hover:border-[#9b5de5]/80 transition-colors duration-300"></div>
          {isChatOpen ? <Icons.Close /> : (
            <div className="relative">
              <Icons.ChatBubble />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#10b981] rounded-full border-2 border-[#020106] animate-pulse"></div>
            </div>
          )}
        </button>

      </div>

    </main>
  )
}