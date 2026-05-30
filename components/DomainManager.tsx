'use client'

import { useState } from 'react'

export default function DomainManager({ apiKey }: { apiKey: string }) {
  const [domainInput, setDomainInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dnsRecords, setDnsRecords] = useState<any[]>([])
  
  // State to track which row was just copied for the animation
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleAddDomain = async () => {
    if (!domainInput) return
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey: apiKey, 
          domainName: domainInput.toLowerCase().trim() 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate domain identity.')
      }

      const completeRecords = [
        ...data.records,
        {
          record: 'DMARC',
          type: 'TXT',
          name: '_dmarc',
          value: 'v=DMARC1; p=none;',
          priority: null
        }
      ]

      setDnsRecords(completeRecords)
      setDomainInput('')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // The one-click copy function
  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      // Reset the checkmark back to a copy icon after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <section className="bg-gradient-to-b from-[#0a0614]/80 to-[#04020a]/80 border border-white/[0.08] backdrop-blur-[50px] rounded-[2.5rem] p-8 sm:p-12 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden mt-10">
      
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#9b5de5]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl">
        <h2 className="font-['Syne',sans-serif] text-white font-extrabold text-2xl mb-2 tracking-tight">Sender Identity</h2>
        <p className="text-sm text-[#8a80a0] leading-relaxed mb-8 tracking-wide">
          Connect your custom domain to securely route emails without affecting the master network reputation.
        </p>

        {/* Input Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input 
            type="text" 
            placeholder="e.g. your-startup.com" 
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-6 py-4 text-white focus:outline-none focus:border-[#9b5de5]/50 focus:ring-1 focus:ring-[#9b5de5]/50 transition-all font-mono text-sm shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)]"
          />
          <button 
            onClick={handleAddDomain}
            disabled={loading || !domainInput}
            className="relative group overflow-hidden rounded-xl p-[1px] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#9b5de5] via-[#6c3b9c] to-[#9b5de5] opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center bg-[#070512] rounded-xl px-8 py-4 transition-all duration-300 group-hover:bg-transparent h-full">
              <span className="font-['Syne',sans-serif] font-bold text-white text-xs uppercase tracking-[0.15em]">
                {loading ? 'Processing...' : 'Register Domain'}
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
        {dnsRecords.length > 0 && (
          <div className="animate-[fadeUp_0.5s_ease-out] space-y-6">
            
            <div className="border border-[#10b981]/30 rounded-2xl overflow-hidden bg-black/40 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              <div className="bg-[#10b981]/10 p-6 border-b border-[#10b981]/20">
                <h3 className="font-['Syne',sans-serif] font-bold text-[#10b981] text-lg mb-1">Identity Generated</h3>
                <p className="text-xs text-[#10b981]/70 tracking-wide">Copy and paste these exact records into your domain registrar to verify ownership.</p>
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
                    {dnsRecords.map((record, index) => (
                      <tr key={index} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-5 font-bold text-[#9b5de5]">{record.type}</td>
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
                                <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-5">{record.priority || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Simplified Guide */}
            <div className="bg-black/60 border border-white/[0.06] rounded-2xl p-6 shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)]">
              <h4 className="font-['Syne',sans-serif] text-white font-bold text-sm mb-4">How to verify your domain</h4>
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
                  <p className="text-[11px] text-[#8a80a0] leading-relaxed pl-7">Save your changes. It takes about 15-30 minutes for the internet to update.</p>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </section>
  )
}