import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/requireAdmin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — full finance snapshot: real income from transactions, real platform
// stats (clients/contacts/domains/emails), manual entries, and the mail rate.
// Admin only.
export async function GET() {
  try {
    const gate = await requireAdmin()
    if (gate instanceof Response) return gate

    // ── Real income from COMPLETED transactions ──
    const { data: txns } = await supabaseAdmin
      .from('transactions')
      .select('txn_id, type, amount, status, description, plan_id, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    let incomeSubscriptions = 0
    let incomeTopups = 0
    const incomeList = (txns || []).map(t => {
      const amt = Number(t.amount) || 0
      const type = (t.type || '').toLowerCase()
      if (type === 'topup') incomeTopups += amt
      else incomeSubscriptions += amt
      return { source: 'transaction', type: t.type, label: t.description || t.plan_id || 'Payment', amount: amt, created_at: t.created_at }
    })

    // ── Platform stats ──
    const { count: clientCount } = await supabaseAdmin
      .from('profiles').select('id', { count: 'exact', head: true })
    const { count: contactCount } = await supabaseAdmin
      .from('contacts').select('id', { count: 'exact', head: true })
    const { count: domainCount } = await supabaseAdmin
      .from('client_domains').select('id', { count: 'exact', head: true })

    // total emails sent across all clients (sum of profiles.emails_sent).
    // Pull id+email+emails_sent so we can also show a per-client breakdown.
    const { data: sentRows } = await supabaseAdmin
      .from('profiles').select('id, email, emails_sent, active_plan_id')
    const totalEmailsSent = (sentRows || []).reduce((s, r) => s + (Number(r.emails_sent) || 0), 0)
    const perClientSends = (sentRows || [])
      .map(r => ({ email: r.email || 'unknown', plan: r.active_plan_id || '—', sent: Number(r.emails_sent) || 0 }))
      .filter(r => r.sent > 0)
      .sort((a, b) => b.sent - a.sent)

    // ── Manual entries ──
    const { data: entries } = await supabaseAdmin
      .from('finance_entries')
      .select('*')
      .order('created_at', { ascending: false })

    const manualIncome = (entries || []).filter(e => e.kind === 'income')
    const manualExpense = (entries || []).filter(e => e.kind === 'expense')
    const fixedCosts = (entries || []).filter(e => e.kind === 'fixed_cost')

    // ── Mail rate setting ──
    const { data: rateRow } = await supabaseAdmin
      .from('finance_settings').select('value').eq('id', 'mail_rate').single()
    const mailRate = Number(rateRow?.value) || 0

    // ── Totals ──
    const manualIncomeTotal = manualIncome.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const manualExpenseTotal = manualExpense.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const fixedCostTotal = fixedCosts.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const mailCost = totalEmailsSent * mailRate

    const totalIncome = incomeSubscriptions + incomeTopups + manualIncomeTotal
    const totalOutcome = mailCost + fixedCostTotal + manualExpenseTotal
    const netProfit = totalIncome - totalOutcome

    return NextResponse.json({
      stats: {
        clients: clientCount || 0,
        contacts: contactCount || 0,
        domains: domainCount || 0,
        emailsSent: totalEmailsSent,
      },
      perClientSends,
      income: {
        subscriptions: incomeSubscriptions,
        topups: incomeTopups,
        manual: manualIncomeTotal,
        total: totalIncome,
        list: incomeList,
        manualList: manualIncome,
      },
      outcome: {
        mailCost,
        mailRate,
        fixedCosts: fixedCostTotal,
        manualExpenses: manualExpenseTotal,
        total: totalOutcome,
        fixedList: fixedCosts,
        expenseList: manualExpense,
      },
      netProfit,
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST — admin actions: add/delete an entry, or set the mail rate. Admin only.
export async function POST(req: Request) {
  try {
    const gate = await requireAdmin()
    if (gate instanceof Response) return gate

    const body = await req.json()
    const { action } = body

    if (action === 'add') {
      const { kind, label, amount, note } = body
      if (!['income', 'expense', 'fixed_cost'].includes(kind)) {
        return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
      }
      if (!label || amount === undefined) {
        return NextResponse.json({ error: 'Missing label or amount' }, { status: 400 })
      }
      const { error } = await supabaseAdmin.from('finance_entries').insert({
        kind, label, amount: Number(amount) || 0, note: note || null,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (action === 'delete') {
      const { id } = body
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      const { error } = await supabaseAdmin.from('finance_entries').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (action === 'set_rate') {
      const { rate } = body
      const { error } = await supabaseAdmin
        .from('finance_settings')
        .upsert({ id: 'mail_rate', value: Number(rate) || 0 }, { onConflict: 'id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true }, { status: 200 })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}