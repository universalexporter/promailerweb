// lib/activatePlan.ts
//
// The ONE place that turns a paid transaction into real account changes.
// Both the CoinPayments webhook (automatic) and the admin "Approve" button
// (manual backup) call this, so activation behaves identically either way.
//
// What it does, based on the transaction's `type`:
//   • activation / upgrade  → set profiles.active_plan_id + plan_expires_at (30d)
//   • topup                 → add the amount to the user's wallet balance
// It also marks the transaction `completed`. It is idempotent: calling it twice
// on the same txn won't double-apply (it checks status first).

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ActivateResult =
  | { ok: true; alreadyDone?: boolean; detail: string }
  | { ok: false; error: string }

export async function activateTransaction(txn_id: string): Promise<ActivateResult> {
  if (!txn_id) return { ok: false, error: 'Missing txn_id' }

  // 1. Load the transaction.
  const { data: txn, error: txnErr } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('txn_id', txn_id)
    .single()

  if (txnErr || !txn) return { ok: false, error: 'Transaction not found' }

  // Idempotency: if it's already completed, do nothing (prevents double-credit
  // when CoinPayments retries the IPN, or an admin clicks Approve twice).
  if (txn.status === 'completed') {
    return { ok: true, alreadyDone: true, detail: 'Already completed' }
  }

  if (!txn.user_id) {
    return { ok: false, error: 'Transaction has no user_id (cannot activate). Approve manually after fixing the user.' }
  }

  const type = (txn.type || 'activation').toLowerCase()

  // 2a. TOP-UP → credit the wallet.
  if (type === 'topup') {
    const { data: wallet } = await supabaseAdmin
      .from('wallets').select('balance').eq('user_id', txn.user_id).single()
    const current = Number(wallet?.balance || 0)
    const next = current + Number(txn.amount || 0)

    const { error: wErr } = await supabaseAdmin
      .from('wallets')
      .upsert({ user_id: txn.user_id, balance: next }, { onConflict: 'user_id' })
    if (wErr) return { ok: false, error: `Wallet update failed: ${wErr.message}` }
  } else {
    // 2b. ACTIVATION / UPGRADE → set the chosen plan + a fresh 30-day timer.
    const planId = txn.plan_id && txn.plan_id !== 'wallet' ? txn.plan_id : 'starter'
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: pErr } = await supabaseAdmin
      .from('profiles')
      .update({
        active_plan_id: planId,
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq('id', txn.user_id)
    if (pErr) return { ok: false, error: `Plan activation failed: ${pErr.message}` }
  }

  // 3. Mark the transaction completed.
  const { error: sErr } = await supabaseAdmin
    .from('transactions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('txn_id', txn_id)
  if (sErr) return { ok: false, error: `Status update failed: ${sErr.message}` }

  return { ok: true, detail: `Activated (${type}) for user ${txn.user_id}` }
}