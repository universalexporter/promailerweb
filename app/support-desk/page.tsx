'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type ClientData = {
  id: string
  email: string
  role: string
  api_key: string
  balance: number
  active_plan_id: string | null
  plan_expires_at: string | null
}

type DomainData = {
  id: string
  domain_name: string
  status: string
  dns_records: any[]
}

type PricingData = {
  id: string
  name: string
  price: number
  email_limit: number
  overage_cost: number
  features: string[]
}

type TxnData = {
  id: string
  txn_id: string
  user_id: string | null
  email: string
  plan_id: string | null
  type: string
  amount: number
  currency: string
  status: string
  description: string
  order_id: string
  created_at: string
}

type ModalState = {
  isOpen: boolean
  type: 'balance' | 'email' | 'password' | 'plan' | null
  title: string
  placeholder: string
  currentValue: string
}

export default function SupportDesk() {
  const router = useRouter()

  const [clients, setClients] = useState<ClientData[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [clientDomains, setClientDomains] = useState<DomainData[]>([])
  // global view now has sub-views: 'pricing' | 'transactions'
  const [activeTab, setActiveTab] = useState<'chat' | 'settings' | 'global'>('global')
  const [globalView, setGlobalView] = useState<'pricing' | 'transactions'>('transactions')

  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [ticketId, setTicketId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const [systemPricing, setSystemPricing] = useState<PricingData[]>([])
  const [isPricingSaving, setIsPricingSaving] = useState(false)

  // Transactions state
  const [transactions, setTransactions] = useState<TxnData[]>([])
  const [txnLoading, setTxnLoading] = useState(false)
  const [txnFilter, setTxnFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [txnSearch, setTxnSearch] = useState('')

  const [modal, setModal] = useState<ModalState>({
    isOpen: false, type: null, title: '', placeholder: '', currentValue: ''
  })
  const [modalInput, setModalInput] = useState('')

  // Notification sound — guarded so a missing /tick.mp3 never throws.
  const tickSoundRef = useRef<HTMLAudioElement | null>(null)
  const playTick = () => {
    try {
      if (typeof window === 'undefined') return
      if (!tickSoundRef.current) {
        const a = new Audio('/tick.mp3'); a.preload = 'none'; tickSoundRef.current = a
      }
      tickSoundRef.current.play().catch(() => {})
    } catch { /* sound is optional */ }
  }

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
      fetchSystemPricing()
      fetchTransactions()
    }
    initializeAdmin()
  }, [router])

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

  const fetchSystemPricing = async () => {
    try {
      const res = await fetch('/api/admin/system-pricing')
      if (!res.ok) return
      const data = await res.json()
      if (data.pricing) setSystemPricing(data.pricing)
    } catch (error) {
      console.error("Failed to load pricing data.", error)
    }
  }

  const fetchTransactions = async () => {
    setTxnLoading(true)
    try {
      const res = await fetch('/api/admin/transactions')
      if (!res.ok) throw new Error('Failed to load transactions')
      const data = await res.json()
      if (data.transactions) setTransactions(data.transactions)
    } catch (error) {
      console.error('Failed to load transactions.', error)
    } finally {
      setTxnLoading(false)
    }
  }

  const handleApproveTxn = async (txn: TxnData) => {
    if (!confirm(`Approve this payment and activate "${txn.plan_id || 'wallet'}" for ${txn.email}?`)) return
    setApprovingId(txn.txn_id)
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', txn_id: txn.txn_id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Approval failed')
      await fetchTransactions()
      fetchMasterDatabase()
      alert(data.alreadyDone ? 'This transaction was already completed.' : 'Approved and activated successfully.')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setApprovingId(null)
    }
  }

  const handleSavePricing = async () => {
    setIsPricingSaving(true)
    try {
      const res = await fetch('/api/admin/system-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: systemPricing })
      })
      if (!res.ok) throw new Error("Failed to sync new pricing to database. Ensure /api/admin/system-pricing/route.ts exists.")
      alert("Global System Pricing Successfully Updated!")
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsPricingSaving(false)
    }
  }

  const handleSeedPricing = async () => {
    setIsPricingSaving(true)
    const defaultTiers = [
      { id: 'starter', name: 'Starter Plan', price: 65, email_limit: 20000, overage_cost: 0.0035, features: ['20k Monthly Limit', 'Standard API Access', 'Overage: 0.0035 USDT/email'] },
      { id: 'pro', name: 'Pro Plan', price: 220, email_limit: 80000, overage_cost: 0.0035, features: ['80k Monthly Limit', 'High-Speed Routing', 'Dedicated Account Manager'] },
      { id: 'enterprise', name: 'Scale Plan', price: 750, email_limit: 300000, overage_cost: 0.0035, features: ['300k Monthly Limit', 'Custom Dedicated IPs', 'Priority 24/7 Support'] }
    ]
    try {
      const res = await fetch('/api/admin/system-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: defaultTiers })
      })
      if (!res.ok) throw new Error("Database table 'system_pricing' might be missing.")
      fetchSystemPricing()
    } catch (e: any) {
      alert("CRITICAL ERROR: " + e.message)
    } finally {
      setIsPricingSaving(false)
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients)
    } else {
      const lowerQuery = searchQuery.toLowerCase()
      setFilteredClients(clients.filter(c => c.email.toLowerCase().includes(lowerQuery)))
    }
  }, [searchQuery, clients])

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
          playTick()
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
      currentValue = selectedClient.balance?.toString() || '0'
    } else if (type === 'plan') {
      title = 'Execute Subscription Override'
      placeholder = 'Select Tier'
      currentValue = selectedClient.active_plan_id || 'none'
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
      const res = await fetch('/api/admin/update-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedClient.id, action: modal.type, value: modalInput })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Database rejection.')
      }

      if (modal.type === 'balance') {
        const newBalance = parseFloat(modalInput)
        setClients(clients.map(c => c.id === selectedClient.id ? { ...c, balance: newBalance } : c))
        setSelectedClient({ ...selectedClient, balance: newBalance })
      } else if (modal.type === 'plan') {
        const newPlan = modalInput === 'none' ? null : modalInput
        setClients(clients.map(c => c.id === selectedClient.id ? { ...c, active_plan_id: newPlan } : c))
        setSelectedClient({ ...selectedClient, active_plan_id: newPlan })
      } else if (modal.type === 'email') {
        setClients(clients.map(c => c.id === selectedClient.id ? { ...c, email: modalInput } : c))
        setSelectedClient({ ...selectedClient, email: modalInput })
      }
      closeOverrideModal()
    } catch (error: any) {
      alert(`System Error: ${error.message}`)
    } finally {
      setIsActionLoading(false)
    }
  }

  const filteredTxns = transactions.filter(t => {
    const matchesFilter = txnFilter === 'all' ? true : t.status === txnFilter
    const q = txnSearch.trim().toLowerCase()
    const matchesSearch = !q || (t.email || '').toLowerCase().includes(q) || (t.txn_id || '').toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const pendingCount = transactions.filter(t => t.status === 'pending').length

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

  return (
    <main className="fixed inset-0 bg-[#020106] text-white font-['DM_Sans',sans-serif] flex flex-col md:flex-row overflow-hidden selection:bg-[#9b5de5]/30">

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(155, 93, 229, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(155, 93, 229, 0.5); }
      `}} />

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#070512] border border-white/[0.1] rounded-2xl p-6 sm:p-8 shadow-[0_0_100px_rgba(155,93,229,0.15)] animate-[fadeUp_0.2s_ease-out]">
            <h3 className="font-['Syne',sans-serif] text-xl font-bold mb-2 text-white">{modal.title}</h3>
            <p className="text-xs text-[#8a80a0] mb-6">Manually update the client's information. Changes are instantly saved to the secure database.</p>

            <form onSubmit={handleExecuteModalAction}>
              <div className="mb-6">
                {modal.type === 'plan' ? (
                  <select value={modalInput} onChange={(e) => setModalInput(e.target.value)} className="w-full bg-[#020106] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#9b5de5] focus:ring-1 focus:ring-[#9b5de5]/50 transition-all font-mono text-sm">
                    <option value="none">Revoke Access (No Plan)</option>
                    {systemPricing.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder={modal.placeholder} className="w-full bg-[#020106] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#9b5de5] focus:ring-1 focus:ring-[#9b5de5]/50 transition-all font-mono text-sm" autoFocus required />
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={closeOverrideModal} className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#8a80a0] hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isActionLoading || !modalInput.trim() || modalInput === modal.currentValue} className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-[#9b5de5] text-white hover:bg-[#8040cd] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(155,93,229,0.3)]">{isActionLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SIDEBAR (network list) ── */}
      <div className="w-full md:w-[380px] shrink-0 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#070512] flex flex-col h-auto md:h-full min-h-0 max-h-[40vh] md:max-h-full z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="p-5 sm:p-8 border-b border-white/[0.08] bg-black/40 shrink-0">
          <h1 className="font-['Syne',sans-serif] text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#9b5de5] to-[#10b981] tracking-tight">SUPPORT HQ</h1>
          <p className="text-[#8a80a0] text-[10px] font-bold uppercase tracking-[0.2em] mt-2 mb-5">Active Network: <span className="text-white">{clients.length} Nodes</span></p>

          <button onClick={() => { setActiveTab('global'); setSelectedClient(null); }} className={`w-full py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'global' ? 'bg-[#9b5de5]/20 border-[#9b5de5]/50 text-[#9b5de5]' : 'bg-white/5 border-white/10 text-[#8a80a0] hover:text-white'}`}>
            Global · Pricing & Transactions
            {pendingCount > 0 && <span className="ml-2 bg-[#f59e0b] text-black text-[9px] px-2 py-0.5 rounded-full">{pendingCount} pending</span>}
          </button>

          <div className="mt-5 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a80a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" placeholder="Locate client identity..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#9b5de5]/50 transition-all placeholder:text-[#8a80a0]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredClients.length === 0 ? (
            <div className="text-center text-[#8a80a0] text-xs font-mono mt-10">No matching identifiers found.</div>
          ) : (
            filteredClients.map(client => (
              <div key={client.id} onClick={() => { setSelectedClient(client); setActiveTab('settings'); }} className={`p-4 rounded-xl cursor-pointer transition-all border group ${selectedClient?.id === client.id && activeTab !== 'global' ? 'bg-[#9b5de5]/10 border-[#9b5de5]/50 shadow-[inset_0_0_20px_rgba(155,93,229,0.1)]' : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05]'}`}>
                <div className={`font-bold text-sm truncate transition-colors ${selectedClient?.id === client.id && activeTab !== 'global' ? 'text-white' : 'text-[#8a80a0] group-hover:text-white'}`}>{client.email}</div>
                <div className="flex justify-between items-center mt-3 text-xs">
                  <span className={`px-2 py-1 rounded text-[9px] uppercase tracking-widest font-bold ${client.role === 'admin' ? 'bg-[#9b5de5]/20 text-[#9b5de5]' : 'bg-white/5 text-[#8a80a0]'}`}>{client.role}</span>
                  <span className="font-mono text-[#10b981] font-bold tracking-tight">{client.balance?.toFixed(2) || '0.00'} <span className="text-[10px] text-[#10b981]/50">USDT</span></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top,#1a0b2e_0%,#020106_60%)] relative min-w-0">

        {activeTab === 'global' ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-10 custom-scrollbar">
            <div className="max-w-5xl mx-auto">

              {/* Global sub-nav: Transactions | Pricing */}
              <div className="flex gap-2 mb-8 bg-white/[0.02] p-1 rounded-xl border border-white/[0.05] w-full sm:w-fit">
                <button onClick={() => setGlobalView('transactions')} className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-all ${globalView === 'transactions' ? 'bg-gradient-to-r from-[#9b5de5] to-[#6c3b9c] text-white' : 'text-[#8a80a0] hover:text-white'}`}>
                  Transactions {pendingCount > 0 && <span className="ml-1.5 bg-[#f59e0b] text-black text-[9px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
                </button>
                <button onClick={() => setGlobalView('pricing')} className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-all ${globalView === 'pricing' ? 'bg-[#10b981] text-black' : 'text-[#8a80a0] hover:text-white'}`}>
                  Pricing
                </button>
              </div>

              {globalView === 'transactions' ? (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 border-b border-white/[0.05] pb-6">
                    <div>
                      <h2 className="font-['Syne',sans-serif] text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Payments & Transactions</h2>
                      <p className="text-[#8a80a0] text-xs sm:text-sm uppercase tracking-widest font-bold">Every payment, who paid, and what they're activating.</p>
                    </div>
                    <button onClick={fetchTransactions} disabled={txnLoading} className="shrink-0 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#8a80a0] hover:text-white transition-all disabled:opacity-50">
                      {txnLoading ? 'Refreshing...' : '↻ Refresh'}
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex gap-2">
                      {(['all', 'pending', 'completed'] as const).map(f => (
                        <button key={f} onClick={() => setTxnFilter(f)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${txnFilter === f ? 'bg-[#9b5de5]/20 border-[#9b5de5]/50 text-[#9b5de5]' : 'bg-white/[0.02] border-white/10 text-[#8a80a0] hover:text-white'}`}>
                          {f}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                        </button>
                      ))}
                    </div>
                    <input type="text" placeholder="Search email or txn id..." value={txnSearch} onChange={(e) => setTxnSearch(e.target.value)} className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-[#9b5de5]/50 transition-all placeholder:text-[#8a80a0]" />
                  </div>

                  {/* Transactions table */}
                  {txnLoading ? (
                    <div className="text-center text-[#8a80a0] font-mono py-16 animate-pulse">Loading transactions...</div>
                  ) : filteredTxns.length === 0 ? (
                    <div className="bg-black/40 border border-white/[0.08] rounded-2xl py-16 text-center text-[#8a80a0] font-mono text-sm">No transactions match this view.</div>
                  ) : (
                    <div className="bg-black/40 border border-white/[0.08] rounded-2xl overflow-hidden overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-xs min-w-[760px]">
                        <thead className="bg-[#070512]">
                          <tr>
                            <th className="px-5 py-4 text-[#8a80a0] uppercase tracking-widest font-bold text-[10px]">Client</th>
                            <th className="px-5 py-4 text-[#8a80a0] uppercase tracking-widest font-bold text-[10px]">Type</th>
                            <th className="px-5 py-4 text-[#8a80a0] uppercase tracking-widest font-bold text-[10px]">Plan</th>
                            <th className="px-5 py-4 text-[#8a80a0] uppercase tracking-widest font-bold text-[10px]">Amount</th>
                            <th className="px-5 py-4 text-[#8a80a0] uppercase tracking-widest font-bold text-[10px]">Date</th>
                            <th className="px-5 py-4 text-[#8a80a0] uppercase tracking-widest font-bold text-[10px]">Status</th>
                            <th className="px-5 py-4 text-[#8a80a0] uppercase tracking-widest font-bold text-[10px] text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {filteredTxns.map(t => {
                            const isPending = t.status === 'pending'
                            const isDone = t.status === 'completed'
                            return (
                              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-5 py-4 text-white font-bold">{t.email}</td>
                                <td className="px-5 py-4 text-[#8a80a0] capitalize">{t.type || '—'}</td>
                                <td className="px-5 py-4"><span className="text-[#9b5de5] bg-[#9b5de5]/10 px-2 py-1 rounded font-bold border border-[#9b5de5]/20 capitalize">{t.plan_id || '—'}</span></td>
                                <td className="px-5 py-4 font-mono text-[#10b981] font-bold">{Number(t.amount).toFixed(2)} <span className="text-[9px] text-[#10b981]/50">USDT</span></td>
                                <td className="px-5 py-4 text-[#8a80a0] font-mono text-[11px]">{t.created_at ? new Date(t.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                <td className="px-5 py-4">
                                  {isDone ? (
                                    <span className="inline-flex items-center gap-1.5 text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">✓ Done</span>
                                  ) : isPending ? (
                                    <span className="inline-flex items-center gap-1.5 text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest animate-pulse">● Pending</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest capitalize">{t.status}</span>
                                  )}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  {isPending ? (
                                    <button onClick={() => handleApproveTxn(t)} disabled={approvingId === t.txn_id} className="px-4 py-2 bg-[#10b981] text-black rounded-lg text-[10px] font-extrabold uppercase tracking-widest hover:bg-[#0ea571] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                      {approvingId === t.txn_id ? 'Approving...' : 'Approve'}
                                    </button>
                                  ) : (
                                    <span className="text-[#8a80a0]/40 text-[10px] font-mono">—</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* ── PRICING SUB-VIEW ── */
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10 border-b border-white/[0.05] pb-8">
                    <div>
                      <h2 className="font-['Syne',sans-serif] text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Global Network Settings</h2>
                      <p className="text-[#8a80a0] text-xs sm:text-sm uppercase tracking-widest font-bold">Modify live subscription tiers and overage logic.</p>
                    </div>
                    {systemPricing.length > 0 && (
                      <button onClick={handleSavePricing} disabled={isPricingSaving} className="shrink-0 px-6 sm:px-8 py-4 bg-gradient-to-r from-[#10b981] to-[#059669] text-black font-extrabold uppercase tracking-widest text-[11px] rounded-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50">
                        {isPricingSaving ? 'Syncing to Database...' : 'Deploy Global Update'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {systemPricing.length === 0 ? (
                      <div className="bg-black/60 border border-white/[0.08] p-8 sm:p-12 rounded-3xl flex flex-col items-center justify-center text-center shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                        <h3 className="text-xl font-bold text-white mb-2">Pricing Database Empty</h3>
                        <p className="text-[#8a80a0] text-sm max-w-md mb-8">The system_pricing table returned no data. Click below to inject the default enterprise plans.</p>
                        <button onClick={handleSeedPricing} disabled={isPricingSaving} className="px-8 sm:px-10 py-4 bg-gradient-to-r from-[#9b5de5] to-[#6c3b9c] text-white font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-[0_0_30px_rgba(155,93,229,0.4)] disabled:opacity-50 transition-all hover:scale-105">
                          {isPricingSaving ? 'Injecting Data...' : 'Initialize Default Pricing Database'}
                        </button>
                      </div>
                    ) : (
                      systemPricing.map((plan, index) => (
                        <div key={plan.id} className="bg-black/60 border border-white/[0.08] p-6 sm:p-8 rounded-3xl flex flex-wrap md:flex-nowrap gap-6 sm:gap-8 items-center shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                          <div className="w-full md:w-1/4">
                            <label className="text-[10px] text-[#8a80a0] uppercase tracking-widest mb-2 block font-bold">Plan Identifier</label>
                            <input type="text" value={plan.name} onChange={(e) => { const newPricing = [...systemPricing]; newPricing[index].name = e.target.value; setSystemPricing(newPricing) }} className="w-full bg-[#020106] border border-white/10 p-4 rounded-xl font-bold text-white focus:border-[#9b5de5] outline-none transition-all" />
                          </div>
                          <div className="w-full md:w-1/4">
                            <label className="text-[10px] text-[#10b981] uppercase tracking-widest mb-2 block font-bold">Cost (USDT)</label>
                            <input type="number" value={plan.price} onChange={(e) => { const newPricing = [...systemPricing]; newPricing[index].price = Number(e.target.value); setSystemPricing(newPricing) }} className="w-full bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] p-4 rounded-xl font-mono font-bold outline-none focus:border-[#10b981]" />
                          </div>
                          <div className="w-full md:w-1/4">
                            <label className="text-[10px] text-[#9b5de5] uppercase tracking-widest mb-2 block font-bold">Max Email Output</label>
                            <input type="number" value={plan.email_limit} onChange={(e) => { const newPricing = [...systemPricing]; newPricing[index].email_limit = Number(e.target.value); setSystemPricing(newPricing) }} className="w-full bg-[#9b5de5]/10 border border-[#9b5de5]/30 text-[#9b5de5] p-4 rounded-xl font-mono outline-none focus:border-[#9b5de5]" />
                          </div>
                          <div className="w-full md:w-1/4">
                            <label className="text-[10px] text-orange-400 uppercase tracking-widest mb-2 block font-bold">Overage Burn Rate</label>
                            <input type="number" step="0.001" value={plan.overage_cost} onChange={(e) => { const newPricing = [...systemPricing]; newPricing[index].overage_cost = Number(e.target.value); setSystemPricing(newPricing) }} className="w-full bg-orange-500/10 border border-orange-500/30 text-orange-400 p-4 rounded-xl font-mono outline-none focus:border-orange-500" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : selectedClient ? (
          <>
            <div className="p-5 sm:p-8 border-b border-white/[0.08] bg-black/40 backdrop-blur-xl flex flex-col gap-6 z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="min-w-0">
                  <h2 className="font-['Syne',sans-serif] font-bold text-xl sm:text-3xl tracking-tight truncate">{selectedClient.email}</h2>
                  <div className="text-[11px] font-mono text-[#8a80a0] mt-3 flex flex-wrap items-center gap-3">
                    <span className="uppercase tracking-widest font-bold opacity-50">API Identifier</span>
                    <code className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-[#9b5de5] select-all cursor-text transition-colors hover:bg-white/10 break-all">{selectedClient.api_key || 'Awaiting Core Generation'}</code>
                  </div>
                </div>
                <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/[0.05] shrink-0">
                  <button onClick={() => setActiveTab('chat')} className={`px-5 sm:px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'chat' ? 'bg-gradient-to-r from-[#9b5de5] to-[#6c3b9c] text-white shadow-[0_0_20px_rgba(155,93,229,0.3)]' : 'text-[#8a80a0] hover:text-white hover:bg-white/[0.02]'}`}>Live Chat</button>
                  <button onClick={() => setActiveTab('settings')} className={`px-5 sm:px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'settings' ? 'bg-[#10b981] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-[#8a80a0] hover:text-white hover:bg-white/[0.02]'}`}>Inspection</button>
                </div>
              </div>
            </div>

            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[#8a80a0] opacity-50">
                      <span className="text-sm font-mono uppercase tracking-widest text-center">Comm-Link Established. Awaiting Input.</span>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isClient = msg.sender_id === selectedClient.id
                      return (
                        <div key={i} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] sm:max-w-[65%] p-4 sm:p-5 rounded-2xl ${isClient ? 'bg-white/[0.03] border border-white/[0.08] text-white rounded-tl-none shadow-[0_5px_15px_rgba(0,0,0,0.5)]' : 'bg-gradient-to-br from-[#6c3b9c] to-[#9b5de5] text-white rounded-tr-none shadow-[0_10px_30px_rgba(155,93,229,0.2)]'}`}>
                            {msg.image_url && (
                              <div className="mb-4 relative group rounded-xl overflow-hidden border border-white/20">
                                <img src={msg.image_url} alt="Secure Attachment" className="w-full max-h-[400px] object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in" onClick={() => window.open(msg.image_url, '_blank')} />
                              </div>
                            )}
                            {msg.message && <p className="leading-relaxed text-[14px] sm:text-[15px] whitespace-pre-wrap break-words">{msg.message}</p>}
                            <div className={`text-[10px] mt-3 opacity-60 font-mono tracking-widest uppercase flex items-center gap-2 ${isClient ? 'justify-start' : 'justify-end'}`}>
                              <span>{isClient ? 'Client' : 'Admin'}</span><span>•</span><span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="shrink-0 p-4 sm:p-6 bg-black/80 border-t border-white/[0.08] backdrop-blur-xl z-20">
                  <div className="flex gap-3 sm:gap-4 max-w-6xl mx-auto items-center">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_10px_#10b981] animate-pulse shrink-0"></div>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Transmit encrypted directive..." className="flex-1 min-w-0 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 sm:px-6 py-4 text-white focus:outline-none focus:border-[#9b5de5] focus:ring-1 focus:ring-[#9b5de5]/50 transition-all text-sm font-mono shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-[#8a80a0]/50" />
                    <button type="submit" disabled={!newMessage.trim()} className="shrink-0 px-6 sm:px-12 py-4 bg-white text-black font-extrabold uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-[#9b5de5] hover:text-white transition-all disabled:opacity-50 hover:shadow-[0_0_30px_rgba(155,93,229,0.4)]">Send</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-10 animate-[fadeIn_0.3s_ease-out] custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8 pb-20">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold mb-6 text-[#10b981] uppercase tracking-[0.2em]">Financial Ledger Engine</h3>
                      <div className="mb-8">
                        <div className="text-[10px] text-[#8a80a0] uppercase tracking-[0.2em] font-bold mb-2">Validated Cryptographic Balance</div>
                        <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">{selectedClient.balance?.toFixed(2) || '0.00'} <span className="text-lg sm:text-xl text-[#10b981] opacity-80">USDT</span></div>
                      </div>
                      <button onClick={() => openOverrideModal('balance')} disabled={isActionLoading} className="w-full py-4 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] hover:bg-[#10b981] hover:text-black transition-all disabled:opacity-50">Adjust Balance</button>
                    </div>

                    <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold mb-6 text-[#3b82f6] uppercase tracking-[0.2em]">Subscription Engine</h3>
                      <div className="mb-8">
                        <div className="text-[10px] text-[#8a80a0] uppercase tracking-[0.2em] font-bold mb-2">Active Plan Matrix</div>
                        <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(59,130,246,0.3)] capitalize">{selectedClient.active_plan_id || 'No Plan'}</div>
                      </div>
                      <button onClick={() => openOverrideModal('plan')} disabled={isActionLoading} className="w-full py-4 bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30 rounded-xl text-[10px] font-extrabold uppercase tracking-[0.2em] hover:bg-[#3b82f6] hover:text-white transition-all disabled:opacity-50">Modify Tier Access</button>
                    </div>

                    <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden group lg:col-span-2">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#9b5de5]/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold mb-6 text-[#9b5de5] uppercase tracking-[0.2em]">Identity Access Protocols</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl flex justify-between items-center gap-3">
                          <div className="truncate pr-2"><div className="text-xs font-bold text-white mb-1">Authorization Email</div><div className="text-[10px] text-[#8a80a0] font-mono truncate">{selectedClient.email}</div></div>
                          <button onClick={() => openOverrideModal('email')} className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-white/10 shrink-0">Change</button>
                        </div>
                        <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl flex justify-between items-center gap-3">
                          <div><div className="text-xs font-bold text-white mb-1">Account Password</div><div className="text-[10px] text-[#8a80a0] font-mono">Manually set a new password</div></div>
                          <button onClick={() => openOverrideModal('password')} className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-white/10 shrink-0">Change</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold text-[#9b5de5] uppercase tracking-[0.2em]">Network Architecture (DNS Inspector)</h3>
                      <div className="text-[10px] font-bold text-[#8a80a0] uppercase tracking-widest border border-white/[0.1] px-3 py-1.5 rounded-lg bg-white/[0.02] self-start">Total: {clientDomains.length}</div>
                    </div>
                    {clientDomains.length === 0 ? (
                      <div className="py-12 border-2 border-dashed border-white/[0.05] rounded-2xl flex flex-col items-center justify-center text-center">
                        <p className="text-[#8a80a0] text-sm font-mono px-4">No network domains have been routed for this identity.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {clientDomains.map((domain, i) => (
                          <div key={i} className="border border-white/[0.08] rounded-2xl overflow-hidden bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:border-[#9b5de5]/30">
                            <div className="bg-gradient-to-r from-white/[0.05] to-transparent p-5 flex flex-wrap gap-4 justify-between items-center border-b border-white/[0.08]">
                              <span className="font-bold text-white font-mono text-base sm:text-lg break-all">{domain.domain_name}</span>
                              <span className={`px-4 py-1.5 border rounded-lg text-[10px] uppercase font-bold tracking-widest ${domain.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>{domain.status === 'active' ? 'Network Linked' : 'Awaiting Propagation'}</span>
                            </div>
                            <div className="p-0 overflow-x-auto custom-scrollbar">
                              <table className="w-full text-left text-xs font-mono min-w-[500px]">
                                <thead className="bg-[#070512]">
                                  <tr><th className="px-6 py-4 text-[#8a80a0] uppercase tracking-widest font-bold">Type</th><th className="px-6 py-4 text-[#8a80a0] uppercase tracking-widest font-bold">Host</th><th className="px-6 py-4 text-[#8a80a0] uppercase tracking-widest font-bold">Value</th></tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                  {!domain.dns_records || domain.dns_records.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-[#8a80a0] opacity-50">No DNS targets generated.</td></tr>
                                  ) : (
                                    domain.dns_records.map((record: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5"><span className="text-[#9b5de5] bg-[#9b5de5]/10 px-2 py-1 rounded font-bold border border-[#9b5de5]/20">{record.type}</span></td>
                                        <td className="px-6 py-5 text-white font-bold break-all">{record.name}</td>
                                        <td className="px-6 py-5 text-[#8a80a0] group-hover:text-white transition-colors"><div className="max-w-[400px] break-all select-all py-1 px-2 -mx-2 rounded hover:bg-white/10">{record.value}</div></td>
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
          <div className="flex-1 flex flex-col items-center justify-center text-[#8a80a0] relative overflow-hidden p-6">
            <div className="w-[600px] h-[600px] bg-[#9b5de5]/5 blur-[120px] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center animate-[fadeUp_0.8s_ease-out] text-center">
              <p className="font-['Syne',sans-serif] text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">Awaiting Target Selection</p>
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-[#8a80a0]">Select a client node, or open Global to manage transactions.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}