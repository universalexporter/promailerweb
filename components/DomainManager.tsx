'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const Icons = {
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
  Refresh: () => <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Play: () => <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Globe: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  Close: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
}

export default function DomainManager({ apiKey }: { apiKey: string }) {
  const [domainInput, setDomainInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [domains, setDomains] = useState<any[]>([])
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    fetchDomains()
  }, [])

  const fetchDomains = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('client_domains')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setDomains(data)
  }

  const handleAddDomain = async () => {
    if (!domainInput || domains.length > 0) return
    setLoading(true)
    setError('')
    
    try {
      // 1. Fetch the user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Unauthorized: Please log in again.")

      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey: apiKey, 
          domainName: domainInput.toLowerCase().trim(),
          userId: session.user.id // <-- THIS FIXES THE REGISTRATION ERROR
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate domain identity.')
      }

      setDomainInput('')
      fetchDomains()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (domainId: string) => {
    setVerifyingId(domainId)
    try {
        const res = await fetch('/api/domains/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domainId: domainId }) // <-- MATCHES YOUR BACKEND
        })
        
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || data.message)
        
        setShowTutorial(true)
        fetchDomains()
    } catch (err: any) {
        alert(`Verification Error: ${err.message}`)
    } finally {
        setVerifyingId(null)
    }
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const isDomainLocked = domains.length > 0;

  return (
    <section className="bg-gradient-to-b from-[#0a0614]/80 to-[#04020a]/80 border border-white/[0.08] backdrop-blur-[50px] rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden mt-10">
      
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#9b5de5]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl">
        
        <div className="flex justify-between items-start mb-8">
            <div>
                <h2 className="font-['Syne',sans-serif] text-white font-extrabold text-2xl mb-2 tracking-tight">Sender Identity</h2>
                <p className="text-sm text-[#8a80a0] leading-relaxed tracking-wide">
                Connect your custom domain to securely route emails without affecting the master network reputation.
                </p>
            </div>
            {domains.length > 0 && (
                <button 
                    onClick={() => setShowTutorial(!showTutorial)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 text-[#8a80a0] hover:text-white border border-white/10 rounded-lg text-xs font-bold transition-colors"
                >
                    <Icons.Play /> {showTutorial ? 'Hide Tutorial' : 'Tutorial'}
                </button>
            )}
        </div>

        {/* Input Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#8a80a0]">
                <Icons.Globe />
            </div>
            <input 
                type="text" 
                placeholder={isDomainLocked ? "Domain Identity Locked" : "e.g. your-startup.com"}
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                disabled={loading || isDomainLocked}
                className={`w-full flex-1 bg-black/40 rounded-xl px-6 py-4 pl-12 text-white font-mono text-sm transition-all outline-none ${isDomainLocked ? 'border border-transparent opacity-50 cursor-not-allowed' : 'border border-white/[0.08] focus:border-[#9b5de5]/50 focus:ring-1 focus:ring-[#9b5de5]/50 shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)]'}`}
            />
          </div>
          
          <button 
            onClick={handleAddDomain}
            disabled={loading || !domainInput || isDomainLocked}
            className={`relative group overflow-hidden rounded-xl p-[1px] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 border ${isDomainLocked ? 'bg-white/5 border-transparent text-[#8a80a0]' : 'border-transparent'}`}
          >
            {!isDomainLocked && <span className="absolute inset-0 bg-gradient-to-r from-[#9b5de5] via-[#6c3b9c] to-[#9b5de5] opacity-80 group-hover:opacity-100 transition-opacity duration-300" />}
            <div className={`relative flex items-center justify-center rounded-xl px-8 py-4 transition-all duration-300 h-full ${isDomainLocked ? 'bg-transparent' : 'bg-[#070512] group-hover:bg-transparent'}`}>
              <span className={`font-['Syne',sans-serif] font-bold text-xs uppercase tracking-[0.15em] ${isDomainLocked ? 'text-[#8a80a0]' : 'text-white'}`}>
                {loading ? 'Processing...' : isDomainLocked ? 'Registered' : 'Register Domain'}
              </span>
            </div>
          </button>
        </div>

        {error && (
          <div className="p-4 mb-8 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        {/* DNS Records Display Section */}
        {domains.length > 0 && (
          <div className="animate-[fadeUp_0.5s_ease-out] space-y-6">
            
            {domains.map((domain) => (
                <div key={domain.id} className="border border-[#10b981]/30 rounded-2xl overflow-hidden bg-black/40 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                <div className="bg-[#10b981]/10 p-6 border-b border-[#10b981]/20 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h3 className="font-['Syne',sans-serif] font-bold text-[#10b981] text-lg mb-1">{domain.domain_name} Generated</h3>
                        <p className="text-xs text-[#10b981]/70 tracking-wide">Copy and paste these exact records into your domain registrar to verify ownership.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-widest border flex items-center gap-2 ${
                            domain.status === 'active' || domain.status === 'verified' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 
                            domain.status === 'pending_verification' || domain.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                            'bg-white/5 text-[#8a80a0] border-white/10'
                        }`}>
                            {(domain.status === 'pending_verification' || domain.status === 'pending') && <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>}
                            {domain.status === 'active' || domain.status === 'verified' ? 'Verified' : domain.status === 'pending_verification' || domain.status === 'pending' ? 'Checking DNS...' : 'Unverified'}
                        </span>
                        
                        {domain.status !== 'active' && domain.status !== 'verified' && (
                            <button 
                            onClick={() => handleVerify(domain.id)}
                            disabled={verifyingId === domain.id || domain.status === 'pending_verification'}
                            className="flex items-center gap-2 px-4 py-2 bg-[#9b5de5] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#8040cd] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(155,93,229,0.3)]"
                            >
                            {verifyingId === domain.id ? <><Icons.Refresh /> Pinging...</> : (domain.status === 'pending_verification' || domain.status === 'pending') ? 'Verify Records' : 'Verify Records'}
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                    <thead className="bg-black/60 border-b border-white/[0.04]">
                        <tr>
                        <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-[#8a80a0]">Type</th>
                        <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-[#8a80a0]">Name / Host</th>
                        <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-[#8a80a0]">Value</th>
                        <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-[#8a80a0]">Priority</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-gray-300 font-mono text-xs">
                        {domain.dns_records && Array.isArray(domain.dns_records) ? domain.dns_records.map((record: any, index: number) => (
                        <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-5 font-bold text-[#9b5de5]">{record.type || record.record}</td>
                            <td className="px-6 py-5">{record.name}</td>
                            <td className="px-6 py-5">
                            <div className="flex items-center justify-between gap-4">
                                <span className="break-all text-[#8a80a0]">{record.value}</span>
                                <button
                                onClick={() => copyToClipboard(record.value, index)}
                                className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] hover:border-[#9b5de5]/50 transition-all text-[#8a80a0] hover:text-white"
                                title="Copy value"
                                >
                                {copiedIndex === index ? (
                                    <Icons.Check />
                                ) : (
                                    <Icons.Copy />
                                )}
                                </button>
                            </div>
                            </td>
                            <td className="px-6 py-5">{record.priority || '-'}</td>
                        </tr>
                        )) : (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-[#8a80a0]">Waiting for records...</td></tr>
                        )}
                    </tbody>
                    </table>
                </div>
                </div>
            ))}

            {/* Simplified Guide (Toggled) */}
            {showTutorial && (
                <div className="bg-black/60 border border-white/[0.06] rounded-2xl p-6 shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] mt-8 animate-[fadeUp_0.3s_ease-out]">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-['Syne',sans-serif] text-white font-bold text-sm">How to verify your domain</h4>
                    <button onClick={() => setShowTutorial(false)} className="text-[#8a80a0] hover:text-white"><Icons.Close /></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#9b5de5]/20 text-[#9b5de5] font-bold text-[10px] border border-[#9b5de5]/30">1</span>
                        <span className="font-bold text-white text-xs">Log In</span>
                    </div>
                    <p className="text-[11px] text-[#8a80a0] leading-relaxed pl-7">Open GoDaddy, Namecheap, or wherever you bought your domain.</p>
                    </div>

                    <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#9b5de5]/20 text-[#9b5de5] font-bold text-[10px] border border-[#9b5de5]/30">2</span>
                        <span className="font-bold text-white text-xs">Find DNS</span>
                    </div>
                    <p className="text-[11px] text-[#8a80a0] leading-relaxed pl-7">Navigate to the <strong>DNS Settings</strong> or <strong>Advanced DNS</strong> page.</p>
                    </div>

                    <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#9b5de5]/20 text-[#9b5de5] font-bold text-[10px] border border-[#9b5de5]/30">3</span>
                        <span className="font-bold text-white text-xs">Add Records</span>
                    </div>
                    <p className="text-[11px] text-[#8a80a0] leading-relaxed pl-7">Click "Add New Record". Paste the Type, Name, and Value from the table above.</p>
                    </div>

                    <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#10b981]/20 text-[#10b981] font-bold text-[10px] border border-[#10b981]/30">4</span>
                        <span className="font-bold text-white text-xs">Wait</span>
                    </div>
                    <p className="text-[11px] text-[#8a80a0] leading-relaxed pl-7">Click Verify above. It takes about 15-30 minutes for the internet to update.</p>
                    </div>
                </div>
                </div>
            )}

          </div>
        )}
      </div>
    </section>
  )
}