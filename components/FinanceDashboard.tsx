'use client'

import { useState, useEffect } from 'react'

type Entry = { id: string; kind: string; label: string; amount: number; note: string | null; created_at: string }

type FinanceData = {
  stats: { clients: number; contacts: number; domains: number; emailsSent: number }
  income: { subscriptions: number; topups: number; manual: number; total: number; list: any[]; manualList: Entry[] }
  outcome: { mailCost: number; mailRate: number; fixedCosts: number; manualExpenses: number; total: number; fixedList: Entry[]; expenseList: Entry[] }
  netProfit: number
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function FinanceDashboard() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // form state
  const [rate, setRate] = useState('')
  const [form, setForm] = useState<{ kind: string; label: string; amount: string; note: string }>({ kind: 'expense', label: '', amount: '', note: '' })

  const load = async () => {
    try {
      const res = await fetch('/api/admin/finance', { cache: 'no-store' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load finance data')
      setData(d)
      setRate(String(d.outcome.mailRate ?? ''))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const addEntry = async () => {
    if (!form.label.trim() || !form.amount) { alert('Enter a label and amount.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', kind: form.kind, label: form.label.trim(), amount: Number(form.amount), note: form.note.trim() })
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Add failed') }
      setForm({ kind: form.kind, label: '', amount: '', note: '' })
      await load()
    } catch (e: any) { alert(`Error: ${e.message}`) } finally { setBusy(false) }
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      })
      if (!res.ok) throw new Error('Delete failed')
      await load()
    } catch (e: any) { alert(`Error: ${e.message}`) } finally { setBusy(false) }
  }

  const saveRate = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_rate', rate: Number(rate) })
      })
      if (!res.ok) throw new Error('Save failed')
      await load()
    } catch (e: any) { alert(`Error: ${e.message}`) } finally { setBusy(false) }
  }

  if (loading) return <div className="py-16 text-center text-[#8a80a0] font-mono animate-pulse">Loading finance data...</div>
  if (error) return <div className="py-16 text-center text-red-400 font-mono">{error}</div>
  if (!data) return null

  const profitPositive = data.netProfit >= 0

  const Stat = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="bg-black/40 border border-white/[0.06] rounded-2xl p-5">
      <div className="text-[9px] uppercase tracking-widest font-bold text-[#8a80a0] mb-2">{label}</div>
      <div className="text-2xl font-black font-mono" style={{ color }}>{value}</div>
    </div>
  )

  const EntryList = ({ title, items, accent }: { title: string; items: Entry[]; accent: string }) => (
    <div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-[#8a80a0] mb-3">{title}</div>
      {items.length === 0 ? (
        <div className="text-[11px] text-[#6a6080] font-mono py-3">No entries.</div>
      ) : (
        <div className="space-y-2">
          {items.map(e => (
            <div key={e.id} className="flex items-center justify-between gap-3 bg-black/40 border border-white/[0.05] rounded-xl px-4 py-3">
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-white truncate">{e.label}</div>
                {e.note && <div className="text-[10px] text-[#8a80a0] truncate">{e.note}</div>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono font-bold text-sm" style={{ color: accent }}>{fmt(Number(e.amount))}</span>
                <button onClick={() => deleteEntry(e.id)} className="text-[9px] font-bold uppercase text-[#8a80a0] hover:text-red-400 transition-colors">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* ── HEADLINE: NET PROFIT ── */}
      <div className={`relative overflow-hidden rounded-3xl border p-8 ${profitPositive ? 'border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/[0.08] to-transparent' : 'border-red-500/30 bg-gradient-to-br from-red-500/[0.08] to-transparent'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#8a80a0] mb-2">Net Profit</div>
            <div className={`text-4xl sm:text-5xl font-black font-mono ${profitPositive ? 'text-[#10b981]' : 'text-red-400'}`}>{fmt(data.netProfit)} <span className="text-lg">USDT</span></div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#8a80a0] mb-2">Total Income</div>
            <div className="text-2xl font-black font-mono text-white">{fmt(data.income.total)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#8a80a0] mb-2">Total Outcome</div>
            <div className="text-2xl font-black font-mono text-[#f59e0b]">{fmt(data.outcome.total)}</div>
          </div>
        </div>
      </div>

      {/* ── PLATFORM STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Clients" value={data.stats.clients.toLocaleString()} color="#9b5de5" />
        <Stat label="Contacts" value={data.stats.contacts.toLocaleString()} color="#3b82f6" />
        <Stat label="Domains" value={data.stats.domains.toLocaleString()} color="#10b981" />
        <Stat label="Emails Sent" value={data.stats.emailsSent.toLocaleString()} color="#f59e0b" />
      </div>

      {/* ── INCOME vs OUTCOME breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* INCOME */}
        <div className="bg-black/40 border border-[#10b981]/20 rounded-3xl p-6 space-y-5">
          <h3 className="font-['Syne',sans-serif] text-[#10b981] font-bold text-sm uppercase tracking-[0.2em]">Income</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/40 rounded-xl p-3"><div className="text-[9px] uppercase text-[#8a80a0] font-bold mb-1">Subscriptions</div><div className="font-mono font-bold text-[#10b981]">{fmt(data.income.subscriptions)}</div></div>
            <div className="bg-black/40 rounded-xl p-3"><div className="text-[9px] uppercase text-[#8a80a0] font-bold mb-1">Top-ups</div><div className="font-mono font-bold text-[#10b981]">{fmt(data.income.topups)}</div></div>
            <div className="bg-black/40 rounded-xl p-3"><div className="text-[9px] uppercase text-[#8a80a0] font-bold mb-1">Manual</div><div className="font-mono font-bold text-[#10b981]">{fmt(data.income.manual)}</div></div>
          </div>
          <EntryList title="Manual Income Entries" items={data.income.manualList} accent="#10b981" />
        </div>

        {/* OUTCOME */}
        <div className="bg-black/40 border border-[#f59e0b]/20 rounded-3xl p-6 space-y-5">
          <h3 className="font-['Syne',sans-serif] text-[#f59e0b] font-bold text-sm uppercase tracking-[0.2em]">Outcome</h3>

          {/* mail rate */}
          <div className="bg-black/40 rounded-xl p-4">
            <div className="text-[9px] uppercase text-[#8a80a0] font-bold mb-2">Mail Cost Rate (USDT / email)</div>
            <div className="flex gap-2">
              <input type="number" step="0.0001" value={rate} onChange={e => setRate(e.target.value)} className="flex-1 bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#f59e0b]/50" />
              <button onClick={saveRate} disabled={busy} className="px-4 py-2 bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f59e0b] hover:text-black transition-all disabled:opacity-50">Save</button>
            </div>
            <div className="text-[10px] text-[#8a80a0] mt-2 font-mono">{data.stats.emailsSent.toLocaleString()} emails × {data.outcome.mailRate} = <span className="text-[#f59e0b] font-bold">{fmt(data.outcome.mailCost)} USDT</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 rounded-xl p-3"><div className="text-[9px] uppercase text-[#8a80a0] font-bold mb-1">Fixed Costs</div><div className="font-mono font-bold text-[#f59e0b]">{fmt(data.outcome.fixedCosts)}</div></div>
            <div className="bg-black/40 rounded-xl p-3"><div className="text-[9px] uppercase text-[#8a80a0] font-bold mb-1">One-off Expenses</div><div className="font-mono font-bold text-[#f59e0b]">{fmt(data.outcome.manualExpenses)}</div></div>
          </div>

          <EntryList title="Fixed Monthly Costs" items={data.outcome.fixedList} accent="#f59e0b" />
          <EntryList title="One-off Expenses" items={data.outcome.expenseList} accent="#f59e0b" />
        </div>
      </div>

      {/* ── ADD ENTRY ── */}
      <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-6">
        <h3 className="font-['Syne',sans-serif] text-white font-bold text-sm uppercase tracking-[0.2em] mb-5">Add Entry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))} className="bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50">
            <option value="income">Income</option>
            <option value="expense">One-off Expense</option>
            <option value="fixed_cost">Fixed Monthly Cost</option>
          </select>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Label (e.g. Server)" className="bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 placeholder:text-[#8a80a0]" />
          <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" className="bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#9b5de5]/50 placeholder:text-[#8a80a0]" />
          <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Comment (optional)" className="bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 placeholder:text-[#8a80a0]" />
          <button onClick={addEntry} disabled={busy} className="px-4 py-3 bg-[#9b5de5] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#8040cd] transition-all disabled:opacity-50">Add</button>
        </div>
      </div>

      {/* ── REAL PAYMENTS LIST ── */}
      <div className="bg-black/40 border border-white/[0.08] rounded-3xl p-6">
        <h3 className="font-['Syne',sans-serif] text-white font-bold text-sm uppercase tracking-[0.2em] mb-5">Completed Payments (Real Income)</h3>
        {data.income.list.length === 0 ? (
          <div className="text-[11px] text-[#6a6080] font-mono py-3">No completed payments yet.</div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto" data-lenis-prevent>
            {data.income.list.map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-black/40 border border-white/[0.05] rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-white truncate">{t.label}</div>
                  <div className="text-[10px] text-[#8a80a0] capitalize">{t.type} · {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</div>
                </div>
                <span className="font-mono font-bold text-sm text-[#10b981] shrink-0">+{fmt(Number(t.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}