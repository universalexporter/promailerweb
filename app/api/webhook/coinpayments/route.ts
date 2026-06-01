import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. CoinPayments sends IPN data as urlencoded text
    const textBody = await req.text();
    const params = new URLSearchParams(textBody);
    
    // Extract incoming variables sent by CoinPayments
    const txn_id = params.get('txn_id');
    const status = parseInt(params.get('status') || '0', 10);
    const custom_order_id = params.get('custom'); // This holds our order_id containing the user_id

    // 2. Security Check: Verify that this request actually came from CoinPayments
    const ipnHeaderSignature = req.headers.get('HMAC');
    const IPN_SECRET = process.env.COINPAYMENTS_IPN_SECRET;

    if (!ipnHeaderSignature || !IPN_SECRET) {
      return NextResponse.json({ error: "Missing verification headers" }, { status: 400 });
    }

    const calculatedHmac = crypto
      .createHmac('sha512', IPN_SECRET)
      .update(textBody)
      .digest('hex');

    if (calculatedHmac !== ipnHeaderSignature) {
      console.error("⚠️ IPN SECURITY WARNING: Mathematical signature mismatch.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Status Control: Status 100 or 2 means the transaction is complete and confirmed
    if (status >= 100 || status === 2) {
      // Fetch transaction to make sure it's not already processed
      const { data: currentTxn } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('txn_id', txn_id)
        .single();

      if (currentTxn && currentTxn.status !== 'completed') {
        // A. Mark the transaction as completed automatically
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'completed' })
          .eq('txn_id', txn_id);

        // B. Activate the client's premium features instantly
        await supabaseAdmin
          .from('users')
          .update({ 
            plan: 'pro', 
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentTxn.user_id);

        console.log(`✅ Transaction ${txn_id} automatically processed and user upgraded via Webhook.`);
      }
    }

    // CoinPayments expects a simple 'IPN OK' response to stop retrying
    return new Response('IPN OK', { status: 200 });

  } catch (error: any) {
    console.error("Webhook Execution Crash:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}