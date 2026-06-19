'use client'

import { useState, useEffect } from 'react'

type Entry = { id: string; kind: string; label: string; amount: number; note: string | null; created_at: string }

type FinanceData = {
  stats: { clients: number; contacts: number; domains: number; emailsSent: number }
  perClientSends: { email: string; plan: string; sent: number }[]
  income: { subscriptions: number; topups: number; manual: number; total: number; list: any[]; manualList: Entry[] }
  outcome: { mailCost: number; mailRate: number; fixedCosts: number; manualExpenses: number; total: number; fixedList: Entry[]; expenseList: Entry[] }
  netProfit: number
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt = (n: number) => n.toLocaleString('en-US')

export default function FinanceDashboard() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rate, setRate] = useState('')
  const [form, setForm] = useState({ kind: 'expense', label: '', amount: '', note: '' })

  const load = async () => {
    try {
      const res = await fetch('/api/admin/finance', { cache: 'no-store' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to load finance data')
      setData(d)
      setRate(String(d.outcome.mailRate ?? ''))
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const addEntry = async () => {
    if (!form.label.trim() || !form.amount) { alert('Enter a label and amount.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', kind: form.kind, label: form.label.trim(), amount: Number(form.amount), note: form.note.trim() }) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Add failed') }
      setForm({ kind: form.kind, label: '', amount: '', note: '' }); await load()
    } catch (e: any) { alert(`Error: ${e.message}`) } finally { setBusy(false) }
  }
  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }) })
      if (!res.ok) throw new Error('Delete failed'); await load()
    } catch (e: any) { alert(`Error: ${e.message}`) } finally { setBusy(false) }
  }
  const saveRate = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_rate', rate: Number(rate) }) })
      if (!res.ok) throw new Error('Save failed'); await load()
    } catch (e: any) { alert(`Error: ${e.message}`) } finally { setBusy(false) }
  }

  if (loading) return (
    <div className="py-24 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#9b5de5]/20 border-t-[#9b5de5] rounded-full animate-spin" />
      <div className="text-[#8a80a0] font-mono text-xs uppercase tracking-widest">Computing financials…</div>
    </div>
  )
  if (error) return <div className="py-16 text-center text-red-400 font-mono">{error}</div>
  if (!data) return null

  const profitPositive = data.netProfit >= 0
  const incomeTotal = data.income.total || 1
  const outcomeTotal = data.outcome.total || 1
  const margin = data.income.total > 0 ? (data.netProfit / data.income.total) * 100 : 0

  return (
    <div className="space-y-7">
      <style>{`
        @keyframes fin-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fin-rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        .fin-card{animation:fin-rise .5s ease-out both}
        .fin-grid-bg{background-image:linear-gradient(rgba(155,93,229,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(155,93,229,.04) 1px,transparent 1px);background-size:32px 32px}
      `}</style>

      {/* ── HERO: NET PROFIT ── */}
      <div className="fin-card relative overflow-hidden rounded-[2rem] border border-white/[0.08] p-8 sm:p-10 fin-grid-bg"
        style={{ background: profitPositive
          ? 'radial-gradient(120% 140% at 0% 0%, rgba(16,185,129,0.16), transparent 55%), linear-gradient(180deg, rgba(8,12,10,0.9), rgba(4,6,8,0.95))'
          : 'radial-gradient(120% 140% at 0% 0%, rgba(239,68,68,0.16), transparent 55%), linear-gradient(180deg, rgba(14,8,10,0.9), rgba(6,4,6,0.95))' }}>
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-[110px] pointer-events-none" style={{ background: profitPositive ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)' }} />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: profitPositive ? '#10b981' : '#ef4444', boxShadow: `0 0 12px ${profitPositive ? '#10b981' : '#ef4444'}` }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8a80a0] font-['Syne',sans-serif]">Net Profit · Live</span>
            </div>
            <div className={`font-['Syne',sans-serif] font-extrabold tracking-tight ${profitPositive ? 'text-[#10b981]' : 'text-red-400'}`} style={{ fontSize: 'clamp(44px,7vw,84px)', lineHeight: 1, textShadow: `0 0 60px ${profitPositive ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
              {fmt(data.netProfit)}
            </div>
            <div className="mt-2 text-sm font-mono text-[#8a80a0]">USDT · margin <span className={profitPositive ? 'text-[#10b981]' : 'text-red-400'}>{margin.toFixed(1)}%</span></div>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl border border-[#10b981]/20 bg-[#10b981]/[0.06] px-6 py-5 min-w-[150px]">
              <div className="text-[9px] uppercase tracking-widest font-bold text-[#8a80a0] mb-2">Income</div>
              <div className="text-2xl font-black font-mono text-[#10b981]">{fmt(data.income.total)}</div>
            </div>
            <div className="rounded-2xl border border-[#f59e0b]/20 bg-[#f59e0b]/[0.06] px-6 py-5 min-w-[150px]">
              <div className="text-[9px] uppercase tracking-widest font-bold text-[#8a80a0] mb-2">Outcome</div>
              <div className="text-2xl font-black font-mono text-[#f59e0b]">{fmt(data.outcome.total)}</div>
            </div>
          </div>
        </div>
        {/* income vs outcome bar */}
        <div className="relative z-10 mt-8">
          <div className="flex h-3 rounded-full overflow-hidden border border-white/[0.06] bg-black/40">
            <div className="h-full bg-gradient-to-r from-[#059669] to-[#10b981]" style={{ width: `${(data.income.total / (data.income.total + data.outcome.total || 1)) * 100}%` }} />
            <div className="h-full bg-gradient-to-r from-[#d97706] to-[#f59e0b]" style={{ width: `${(data.outcome.total / (data.income.total + data.outcome.total || 1)) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ── PLATFORM STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Clients', value: fmtInt(data.stats.clients), color: '#9b5de5', icon: '👥' },
          { label: 'Contacts', value: fmtInt(data.stats.contacts), color: '#3b82f6', icon: '📇' },
          { label: 'Domains', value: fmtInt(data.stats.domains), color: '#10b981', icon: '🌐' },
          { label: 'Emails Sent', value: fmtInt(data.stats.emailsSent), color: '#f59e0b', icon: '🚀' },
        ].map((s, i) => (
          <div key={s.label} className="fin-card relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="absolute -top-10 -right-8 w-28 h-28 rounded-full blur-[50px] pointer-events-none" style={{ background: `${s.color}22` }} />
            <div className="relative z-10 flex items-center justify-between mb-3">
              <span className="text-[9px] uppercase tracking-widest font-bold text-[#8a80a0]">{s.label}</span>
              <span className="text-lg opacity-70">{s.icon}</span>
            </div>
            <div className="relative z-10 text-3xl font-black font-mono" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── INCOME / OUTCOME ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* INCOME */}
        <div className="fin-card rounded-3xl border border-[#10b981]/15 bg-gradient-to-b from-[#10b981]/[0.05] to-transparent p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-['Syne',sans-serif] text-[#10b981] font-bold text-sm uppercase tracking-[0.2em]">Income</h3>
            <span className="font-mono font-black text-xl text-[#10b981]">{fmt(data.income.total)}</span>
          </div>
          {[['Subscriptions', data.income.subscriptions], ['Top-ups', data.income.topups], ['Manual', data.income.manual]].map(([l, v]: any) => (
            <div key={l}>
              <div className="flex justify-between text-[11px] mb-1.5"><span className="uppercase tracking-widest font-bold text-[#8a80a0]">{l}</span><span className="font-mono font-bold text-[#10b981]">{fmt(v)}</span></div>
              <div className="h-1.5 rounded-full bg-black/40 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#059669] to-[#10b981] transition-all duration-700" style={{ width: `${Math.min(100, (v / incomeTotal) * 100)}%` }} /></div>
            </div>
          ))}
          <EntryList title="Manual Income" items={data.income.manualList} accent="#10b981" onDelete={deleteEntry} />
        </div>

        {/* OUTCOME */}
        <div className="fin-card rounded-3xl border border-[#f59e0b]/15 bg-gradient-to-b from-[#f59e0b]/[0.05] to-transparent p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-['Syne',sans-serif] text-[#f59e0b] font-bold text-sm uppercase tracking-[0.2em]">Outcome</h3>
            <span className="font-mono font-black text-xl text-[#f59e0b]">{fmt(data.outcome.total)}</span>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-4">
            <div className="text-[9px] uppercase text-[#8a80a0] font-bold mb-2 tracking-widest">Mail Cost Rate (USDT / email)</div>
            <div className="flex gap-2">
              <input type="number" step="0.0001" value={rate} onChange={e => setRate(e.target.value)} className="flex-1 bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#f59e0b]/50" />
              <button onClick={saveRate} disabled={busy} className="px-4 py-2 bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#f59e0b] hover:text-black transition-all disabled:opacity-50">Save</button>
            </div>
            <div className="text-[10px] text-[#8a80a0] mt-2 font-mono">{fmtInt(data.stats.emailsSent)} × {data.outcome.mailRate} = <span className="text-[#f59e0b] font-bold">{fmt(data.outcome.mailCost)}</span></div>
          </div>
          {[['Mail Cost', data.outcome.mailCost], ['Fixed Costs', data.outcome.fixedCosts], ['One-off', data.outcome.manualExpenses]].map(([l, v]: any) => (
            <div key={l}>
              <div className="flex justify-between text-[11px] mb-1.5"><span className="uppercase tracking-widest font-bold text-[#8a80a0]">{l}</span><span className="font-mono font-bold text-[#f59e0b]">{fmt(v)}</span></div>
              <div className="h-1.5 rounded-full bg-black/40 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#d97706] to-[#f59e0b] transition-all duration-700" style={{ width: `${Math.min(100, (v / outcomeTotal) * 100)}%` }} /></div>
            </div>
          ))}
          <EntryList title="Fixed Monthly Costs" items={data.outcome.fixedList} accent="#f59e0b" onDelete={deleteEntry} />
          <EntryList title="One-off Expenses" items={data.outcome.expenseList} accent="#f59e0b" onDelete={deleteEntry} />
        </div>
      </div>

      {/* ── ADD ENTRY ── */}
      <div className="fin-card rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6">
        <h3 className="font-['Syne',sans-serif] text-white font-bold text-sm uppercase tracking-[0.2em] mb-5">Add Entry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))} className="bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50">
            <option value="income">Income</option>
            <option value="expense">One-off Expense</option>
            <option value="fixed_cost">Fixed Monthly Cost</option>
          </select>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Label" className="bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 placeholder:text-[#8a80a0]" />
          <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount" className="bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#9b5de5]/50 placeholder:text-[#8a80a0]" />
          <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Comment" className="bg-[#020106] border border-white/[0.08] rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-[#9b5de5]/50 placeholder:text-[#8a80a0]" />
          <button onClick={addEntry} disabled={busy} className="px-4 py-3 bg-gradient-to-r from-[#6c3b9c] to-[#9b5de5] text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:shadow-[0_0_24px_rgba(155,93,229,0.5)] transition-all disabled:opacity-50">Add</button>
        </div>
      </div>

      {/* ── PER-CLIENT SENDS ── */}
      <div className="fin-card rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6">
        <h3 className="font-['Syne',sans-serif] text-white font-bold text-sm uppercase tracking-[0.2em] mb-5">Emails Sent by Client</h3>
        {data.perClientSends.length === 0 ? (
          <div className="text-[11px] text-[#6a6080] font-mono py-3">No sends recorded yet.</div>
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-y-auto" data-lenis-prevent>
            {data.perClientSends.map((c, i) => {
              const max = data.perClientSends[0].sent || 1
              return (
                <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.05] bg-black/40 px-4 py-3">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#9b5de5]/20 to-transparent" style={{ width: `${(c.sent / max) * 100}%` }} />
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-white truncate">{c.email}</div>
                      <div className="text-[10px] text-[#8a80a0] uppercase tracking-widest">{c.plan}</div>
                    </div>
                    <span className="font-mono font-bold text-sm text-[#9b5de5] shrink-0">{fmtInt(c.sent)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── REAL PAYMENTS ── */}
      <div className="fin-card rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6">
        <h3 className="font-['Syne',sans-serif] text-white font-bold text-sm uppercase tracking-[0.2em] mb-5">Completed Payments</h3>
        {data.income.list.length === 0 ? (
          <div className="text-[11px] text-[#6a6080] font-mono py-3">No completed payments yet.</div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto" data-lenis-prevent>
            {data.income.list.map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-black/40 border border-white/[0.05] rounded-xl px-4 py-3">
                <div className="min-w-0"><div className="text-[13px] font-bold text-white truncate">{t.label}</div><div className="text-[10px] text-[#8a80a0] capitalize">{t.type} · {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</div></div>
                <span className="font-mono font-bold text-sm text-[#10b981] shrink-0">+{fmt(Number(t.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EntryList({ title, items, accent, onDelete }: { title: string; items: Entry[]; accent: string; onDelete: (id: string) => void }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-[#8a80a0] mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-[11px] text-[#6a6080] font-mono py-2">No entries.</div>
      ) : (
        <div className="space-y-2">
          {items.map(e => (
            <div key={e.id} className="flex items-center justify-between gap-3 bg-black/40 border border-white/[0.05] rounded-xl px-4 py-2.5">
              <div className="min-w-0"><div className="text-[12px] font-bold text-white truncate">{e.label}</div>{e.note && <div className="text-[10px] text-[#8a80a0] truncate">{e.note}</div>}</div>
              <div className="flex items-center gap-3 shrink-0"><span className="font-mono font-bold text-sm" style={{ color: accent }}>{fmt(Number(e.amount))}</span><button onClick={() => onDelete(e.id)} className="text-[9px] font-bold uppercase text-[#8a80a0] hover:text-red-400 transition-colors">Del</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}