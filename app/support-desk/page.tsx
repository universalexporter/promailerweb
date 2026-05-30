'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// ─── 1. CORE SYSTEM INITIALIZATION ──────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── 2. TYPE DEFINITIONS ────────────────────────────────────────────────────
type ClientData = {
  id: string
  email: string
  role: string
  api_key: string
  balance: number
}

type DomainData = {
  id: string
  domain_name: string
  status: string
  dns_records: any[]
}

type ModalState = {
  isOpen: boolean
  type: 'balance' | 'email' | 'password' | null
  title: string
  placeholder: string
  currentValue: string
}

// ─── 3. MAIN COMMAND CENTER COMPONENT ───────────────────────────────────────
export default function SupportDesk() {
  const router = useRouter()
  
  // Navigation & Selection State
  const [clients, setClients] = useState<ClientData[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [clientDomains, setClientDomains] = useState<DomainData[]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat')
  
  // Chat Engine State
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [ticketId, setTicketId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Security & Loading State
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Custom Override Modal State
  const [modal, setModal] = useState<ModalState>({
    isOpen: false, type: null, title: '', placeholder: '', currentValue: ''
  })
  const [modalInput, setModalInput] = useState('')

  // Hardware Audio Engine
  const tickSound = typeof window !== 'undefined' ? new Audio('/tick.mp3') : null

  // ─── 4. ABSOLUTE SECURITY PROTOCOL ────────────────────────────────────────
  useEffect(() => {
    const initializeAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return router.replace('/login') 

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'support')) {
        return router.replace('/dashboard') 
      }

      setIsAuthorized(true)
      fetchMasterDatabase()
    }
    initializeAdmin()
  }, [router])

  // ─── 5. DATA INGESTION ENGINE ─────────────────────────────────────────────
  const fetchMasterDatabase = async () => {
    try {
      const res = await fetch('/api/admin/clients')
      const data = await res.json()
      if (data.clients) {
        setClients(data.clients)
        setFilteredClients(data.clients)
      }
    } catch (error) {
      console.error('SYSTEM ERROR: Failed to fetch client network.', error)
    } finally {
      setLoading(false)
    }
  }

  // Client Search Filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients)
    } else {
      const lowerQuery = searchQuery.toLowerCase()
      setFilteredClients(clients.filter(c => c.email.toLowerCase().includes(lowerQuery)))
    }
  }, [searchQuery, clients])

  // ─── 6. REAL-TIME CHAT & DOMAIN SYNCHRONIZATION ───────────────────────────
  useEffect(() => {
    if (!selectedClient) return

    const loadClientSpecifics = async () => {
      let { data: ticket } = await supabase.from('support_tickets').select('id').eq('user_id', selectedClient.id).single()
      
      if (!ticket) {
        const { data: newTicket } = await supabase.from('support_tickets').insert({ user_id: selectedClient.id }).select().single()
        ticket = newTicket
      }
      
      if (ticket) {
        setTicketId(ticket.id)
        const { data: msgs } = await supabase.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true })
        if (msgs) setMessages(msgs)
      }

      const { data: domains } = await supabase.from('client_domains').select('*').eq('user_id', selectedClient.id)
      if (domains) setClientDomains(domains)
    }

    loadClientSpecifics()

    const channel = supabase
      .channel('admin_support_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
        const newMsg = payload.new
        setMessages((prev) => [...prev, newMsg])
        
        if (newMsg.sender_id === selectedClient.id) {
          tickSound?.play().catch(e => console.log('Hardware audio blocked by browser policy', e))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedClient])

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

  // ─── 7. MASTER CONTROL ACTIONS ────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !ticketId || !selectedClient) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const msgToSend = newMessage
    setNewMessage('') 

    await supabase.from('support_messages').insert({
      ticket_id: ticketId, sender_id: session.user.id, message: msgToSend
    })
  }

  const openOverrideModal = (type: ModalState['type']) => {
    if (!selectedClient) return
    let title = '', placeholder = '', currentValue = ''
    
    if (type === 'balance') {
      title = 'Execute Financial Override'
      placeholder = 'Enter new USDT balance'
      currentValue = selectedClient.balance.toString()
    } else if (type === 'email') {
      title = 'Change Account Email'
      placeholder = 'Type new email address...'
      currentValue = selectedClient.email
    } else if (type === 'password') {
      title = 'Change Account Password'
      placeholder = 'Type new password here...'
      currentValue = ''
    }

    setModalInput(currentValue)
    setModal({ isOpen: true, type, title, placeholder, currentValue })
  }

  const closeOverrideModal = () => {
    setModal({ isOpen: false, type: null, title: '', placeholder: '', currentValue: '' })
    setModalInput('')
  }

  const handleExecuteModalAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !modal.type) return

    setIsActionLoading(true)

    try {
      if (modal.type === 'balance') {
        const newBalance = parseFloat(modalInput)
        if (isNaN(newBalance)) throw new Error('Invalid numeric format for balance.')

        const res = await fetch('/api/admin/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedClient.id, newBalance })
        })

        if (!res.ok) throw new Error('Database rejection.')
        setClients(clients.map(c => c.id === selectedClient.id ? { ...c, balance: newBalance } : c))
        setSelectedClient({ ...selectedClient, balance: newBalance })

      } else if (modal.type === 'email' || modal.type === 'password') {
        const actionPayload = modal.type === 'email' ? 'update_email' : 'update_password'
        
        const res = await fetch('/api/admin/update-client', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedClient.id, action: actionPayload, value: modalInput })
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error)
        }

        if (modal.type === 'email') {
          setClients(clients.map(c => c.id === selectedClient.id ? { ...c, email: modalInput } : c))
          setSelectedClient({ ...selectedClient, email: modalInput })
        }
      }
      
      closeOverrideModal()

    } catch (error: any) {
      alert(`System Error: ${error.message}`)
    } finally {
      setIsActionLoading(false)
    }
  }

  // ─── 8. RENDER GUARDS ─────────────────────────────────────────────────────
  if (!isAuthorized || loading) {
    return (
      <div className="fixed inset-0 bg-[#020106] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#9b5de5]/20 border-t-[#9b5de5] rounded-full animate-spin"></div>
          <div className="text-[#8a80a0] font-mono text-xs uppercase tracking-widest">Authenticating Admin Clearance...</div>
        </div>
      </div>
    )
  }

  // ─── 9. MAIN UI RENDER ────────────────────────────────────────────────────
  return (
    // fixed inset-0 completely locks the outer wrapper to the screen edges, enabling safe inner scrolling
    <main className="fixed inset-0 bg-[#020106] text-white font-['DM_Sans',sans-serif] flex overflow-hidden selection:bg-[#9b5de5]/30">
      
      {/* ── HIGH-END CUSTOM SCROLLBAR CSS ── */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(155, 93, 229, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(155, 93, 229, 0.5); }
      `}} />

      {/* ── CUSTOM OVERRIDE MODAL ── */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#070512] border border-white/[0.1] rounded-2xl p-8 shadow-[0_0_100px_rgba(155,93,229,0.15)] animate-[fadeUp_0.2s_ease-out]">
            <h3 className="font-['Syne',sans-serif] text-xl font-bold mb-2 text-white">{modal.title}</h3>
            <p className="text-xs text-[#8a80a0] mb-6">Manually update the client's information. Changes are instantly saved to the secure database.</p>
            
            <form onSubmit={handleExecuteModalAction}>
              <div className="mb-6">
                <input
                  type={modal.type === 'password' ? 'text' : 'text'}
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder={modal.placeholder}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#9b5de5] focus:ring-1 focus:ring-[#9b5de5]/50 transition-all font-mono text-sm"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeOverrideModal}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#8a80a0] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading || !modalInput.trim() || modalInput === modal.currentValue}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-[#9b5de5] text-white hover:bg-[#8040cd] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(155,93,229,0.3)]"
                >
                  {isActionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LEFT PANEL: CLIENT NETWORK ── */}
      <div className="w-[380px] shrink-0 border-r border-white/[0.08] bg-[#070512] flex flex-col h-full z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        
        <div className="p-8 border-b border-white/[0.08] bg-black/40 shrink-0">
          <h1 className="font-['Syne',sans-serif] text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#9b5de5] to-[#10b981] tracking-tight">
            SUPPORT HQ
          </h1>
          <p className="text-[#8a80a0] text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
            Active Network: <span className="text-white">{clients.length} Nodes</span>
          </p>
          
          <div className="mt-6 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a80a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Locate client identity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#9b5de5]/50 transition-all placeholder:text-[#8a80a0]"
            />
          </div>
        </div>
        
        {/* Scrollable Client List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredClients.length === 0 ? (
            <div className="text-center text-[#8a80a0] text-xs font-mono mt-10">No matching identifiers found.</div>
          ) : (
            filteredClients.map(client => (
              <div 
                key={client.id} 
                onClick={() => setSelectedClient(client)}
                className={`p-4 rounded-xl cursor-pointer transition-all border group ${selectedClient?.id === client.id ? 'bg-[#9b5de5]/10 border-[#9b5de5]/50 shadow-[inset_0_0_20px_rgba(155,93,229,0.1)]' : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05]'}`}
              >
                <div className={`font-bold text-sm truncate transition-colors ${selectedClient?.id === client.id ? 'text-white' : 'text-[#8a80a0] group-hover:text-white'}`}>
                  {client.email}
                </div>
                <div className="flex justify-between items-center mt-3 text-xs">
                  <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-widest font-bold ${client.role === 'admin' ? 'bg-[#9b5de5]/20 text-[#9b5de5]' : 'bg-white/5 text-[#8a80a0]'}`}>
                    {client.role}
                  </span>
                  <span className="font-mono text-[#10b981] font-bold tracking-tight">
                    {client.balance.toFixed(2)} <span className="text-[10px] text-[#10b981]/50">USDT</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: MASTER CONTROL ── */}
      <div className="flex-1 flex flex-col h-full bg-[radial-gradient(circle_at_top,#1a0b2e_0%,#020106_60%)] relative min-w-0">
        {selectedClient ? (
          <>
            {/* Master Header (shrink-0 ensures it doesn't crush under flexbox pressure) */}
            <div className="p-8 border-b border-white/[0.08] bg-black/40 backdrop-blur-xl flex flex-col gap-6 z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-['Syne',sans-serif] font-bold text-3xl tracking-tight">{selectedClient.email}</h2>
                  <div className="text-[11px] font-mono text-[#8a80a0] mt-3 flex items-center gap-3">
                    <span className="uppercase tracking-widest font-bold opacity-50">API Identifier</span>
                    <code className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-[#9b5de5] select-all cursor-text transition-colors hover:bg-white/10">
                      {selectedClient.api_key || 'Awaiting Core Generation'}
                    </code>
                  </div>
                </div>
                
                <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/[0.05]">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className={`px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'chat' ? 'bg-gradient-to-r from-[#9b5de5] to-[#6c3b9c] text-white shadow-[0_0_20px_rgba(155,93,229,0.3)]' : 'text-[#8a80a0] hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    Live Chat Link
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className={`px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'settings' ? 'bg-[#10b981] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-[#8a80a0] hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    Deep Inspection
                  </button>
                </div>
              </div>
            </div>

            {/* ── TAB CONTENT: LIVE CHAT ENGINE ── */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 animate-[fadeIn_0.3s_ease-out]">
                {/* Scrollable Chat Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#8a80a0] opacity-50">
                      <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                      <span className="text-sm font-mono uppercase tracking-widest">Comm-Link Established. Awaiting Input.</span>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isClient = msg.sender_id === selectedClient.id
                      return (
                        <div key={i} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[65%] p-5 rounded-2xl ${isClient ? 'bg-white/[0.03] border border-white/[0.08] text-white rounded-tl-none shadow-[0_5px_15px_rgba(0,0,0,0.5)]' : 'bg-gradient-to-br from-[#6c3b9c] to-[#9b5de5] text-white rounded-tr-none shadow-[0_10px_30px_rgba(155,93,229,0.2)]'}`}>
                            {msg.image_url && (
                              <div className="mb-4 relative group rounded-xl overflow-hidden border border-white/20">
                                <img src={msg.image_url} alt="Secure Attachment" className="w-full max-h-[400px] object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in" onClick={() => window.open(msg.image_url, '_blank')} />
                              </div>
                            )}
                            {msg.message && <p className="leading-relaxed text-[15px] whitespace-pre-wrap">{msg.message}</p>}
                            <div className={`text-[10px] mt-3 opacity-60 font-mono tracking-widest uppercase flex items-center gap-2 ${isClient ? 'justify-start' : 'justify-end'}`}>
                              <span>{isClient ? 'Client Transmission' : 'Admin Response'}</span>
                              <span>•</span>
                              <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Fixed Input Form */}
                <form onSubmit={handleSendMessage} className="shrink-0 p-6 bg-black/80 border-t border-white/[0.08] backdrop-blur-xl z-20">
                  <div className="flex gap-4 max-w-6xl mx-auto items-center">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_10px_#10b981] animate-pulse"></div>
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Transmit encrypted directive..."
                      className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-6 py-4 text-white focus:outline-none focus:border-[#9b5de5] focus:ring-1 focus:ring-[#9b5de5]/50 transition-all text-sm font-mono shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-[#8a80a0]/50"
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim()} 
                      className="px-12 py-4 bg-white text-black font-extrabold uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-[#9b5de5] hover:text-white transition-all disabled:opacity-50 hover:shadow-[0_0_30px_rgba(155,93,229,0.4)]"
                    >
                      Transmit
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── TAB CONTENT: DEEP INSPECTION & OVERRIDES ── */}
            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-10 animate-[fadeIn_0.3s_ease-out] custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8 pb-20">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold mb-6 text-[#10b981] uppercase tracking-[0.2em] flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Financial Ledger Engine
                      </h3>
                      <div className="mb-8">
                        <div className="text-[10px] text-[#8a80a0] uppercase tracking-[0.2em] font-bold mb-2">Validated Cryptographic Balance</div>
                        <div className="text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                          {selectedClient.balance.toFixed(2)} <span className="text-xl text-[#10b981] opacity-80">USDT</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => openOverrideModal('balance')} 
                        disabled={isActionLoading} 
                        className="w-full py-4 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] hover:bg-[#10b981] hover:text-black transition-all shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] disabled:opacity-50"
                      >
                        Adjust Balance
                      </button>
                    </div>

                    <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#9b5de5]/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold mb-6 text-[#9b5de5] uppercase tracking-[0.2em] flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        Identity Access Protocols
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl flex justify-between items-center">
                          <div>
                            <div className="text-xs font-bold text-white mb-1">Authorization Email</div>
                            <div className="text-[10px] text-[#8a80a0] font-mono">{selectedClient.email}</div>
                          </div>
                          <button 
                            onClick={() => openOverrideModal('email')} 
                            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-white/10"
                          >
                            Change Email
                          </button>
                        </div>

                        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl flex justify-between items-center">
                          <div>
                            <div className="text-xs font-bold text-white mb-1">Account Password</div>
                            <div className="text-[10px] text-[#8a80a0] font-mono">Manually set a new password</div>
                          </div>
                          <button 
                            onClick={() => openOverrideModal('password')} 
                            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-white/10"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold text-[#9b5de5] uppercase tracking-[0.2em] flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                        Network Architecture (DNS Inspector)
                      </h3>
                      <div className="text-[10px] font-bold text-[#8a80a0] uppercase tracking-widest border border-white/[0.1] px-3 py-1.5 rounded-lg bg-white/[0.02]">
                        Total Registrations: {clientDomains.length}
                      </div>
                    </div>

                    {clientDomains.length === 0 ? (
                      <div className="py-12 border-2 border-dashed border-white/[0.05] rounded-2xl flex flex-col items-center justify-center text-center">
                        <svg className="w-8 h-8 text-[#8a80a0] opacity-50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-[#8a80a0] text-sm font-mono">No network domains have been routed for this identity.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {clientDomains.map((domain, i) => (
                          <div key={i} className="border border-white/[0.08] rounded-2xl overflow-hidden bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:border-[#9b5de5]/30">
                            <div className="bg-gradient-to-r from-white/[0.05] to-transparent p-5 flex flex-wrap gap-4 justify-between items-center border-b border-white/[0.08]">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#9b5de5]/20 border border-[#9b5de5]/50 flex items-center justify-center text-[#9b5de5]">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                </div>
                                <div>
                                  <span className="font-bold text-white font-mono text-lg">{domain.domain_name}</span>
                                  <div className="text-[10px] text-[#8a80a0] uppercase tracking-widest mt-1">Registry ID: {domain.id.split('-')[0]}</div>
                                </div>
                              </div>
                              <span className={`px-4 py-1.5 border rounded-lg text-[10px] uppercase font-bold tracking-widest ${domain.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>
                                {domain.status === 'active' ? 'Network Linked' : 'Awaiting Propagation'}
                              </span>
                            </div>

                            <div className="p-0 overflow-x-auto">
                              <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-[#070512]">
                                  <tr>
                                    <th className="px-6 py-4 text-[#8a80a0] uppercase tracking-widest font-bold">Record Type</th>
                                    <th className="px-6 py-4 text-[#8a80a0] uppercase tracking-widest font-bold">Host / Name</th>
                                    <th className="px-6 py-4 text-[#8a80a0] uppercase tracking-widest font-bold">Encrypted Value (Target)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                  {!domain.dns_records || domain.dns_records.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="px-6 py-8 text-center text-[#8a80a0] opacity-50">Data parsing incomplete. No DNS targets generated.</td>
                                    </tr>
                                  ) : (
                                    domain.dns_records.map((record: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                          <span className="text-[#9b5de5] bg-[#9b5de5]/10 px-2 py-1 rounded font-bold border border-[#9b5de5]/20">{record.type}</span>
                                        </td>
                                        <td className="px-6 py-5 text-white font-bold">{record.name}</td>
                                        <td className="px-6 py-5 text-[#8a80a0] group-hover:text-white transition-colors cursor-crosshair">
                                          <div className="max-w-[400px] truncate break-all select-all py-1 px-2 -mx-2 rounded hover:bg-white/10" title="Click and drag to copy">
                                            {record.value}
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8a80a0] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none"></div>
            <div className="w-[600px] h-[600px] bg-[#9b5de5]/5 blur-[120px] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center animate-[fadeUp_0.8s_ease-out]">
              <div className="w-24 h-24 rounded-full border border-white/[0.05] flex items-center justify-center mb-8 bg-black/40 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                <div className="absolute inset-0 rounded-full border border-[#9b5de5]/20 animate-ping opacity-20"></div>
                <svg className="w-10 h-10 opacity-40 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <p className="font-['Syne',sans-serif] text-3xl font-extrabold text-white mb-3 tracking-tight">Awaiting Target Selection</p>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-[#8a80a0]">Initialize connection by selecting a node from the network array on the left.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}