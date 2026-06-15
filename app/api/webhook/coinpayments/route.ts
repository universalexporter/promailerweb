import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { activateTransaction } from '@/lib/activatePlan';

// CoinPayments IPN (Instant Payment Notification).
// When a payment confirms, CoinPayments POSTs here. We verify the HMAC
// signature (so it can't be faked), then activate the correct plan via the
// shared activateTransaction() helper.
export async function POST(req: Request) {
  try {
    // 1. CoinPayments sends IPN data as urlencoded text.
    const textBody = await req.text();
    const params = new URLSearchParams(textBody);

    const txn_id = params.get('txn_id');
    const status = parseInt(params.get('status') || '0', 10);

    // 2. SECURITY: verify the request really came from CoinPayments.
    const ipnHeaderSignature = req.headers.get('HMAC');
    const IPN_SECRET = process.env.COINPAYMENTS_IPN_SECRET;

    if (!ipnHeaderSignature || !IPN_SECRET) {
      return NextResponse.json({ error: "Missing verification headers" }, { status: 400 });
    }

    const calculatedHmac = crypto
      .createHmac('sha512', IPN_SECRET)
      .update(textBody)
      .digest('hex');

    // Constant-time compare to avoid timing attacks.
    const a = Buffer.from(calculatedHmac);
    const b = Buffer.from(ipnHeaderSignature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.error("⚠️ IPN SECURITY WARNING: signature mismatch.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Status 100 (or 2) = complete & confirmed. Anything lower is still
    //    pending/processing, so we acknowledge but don't activate yet.
    if (status >= 100 || status === 2) {
      if (!txn_id) {
        return new Response('IPN OK (no txn_id)', { status: 200 });
      }
      // Activate the RIGHT plan for the RIGHT user, automatically.
      const result = await activateTransaction(txn_id);
      if (!result.ok) {
        console.error(`IPN activation problem for ${txn_id}:`, result.error);
        // Still return 200 so CoinPayments stops retrying; the admin can
        // approve manually from the support desk if needed.
      } else {
        console.log(`✅ IPN processed ${txn_id}: ${result.detail}`);
      }
    }

    // CoinPayments expects a simple 200 to stop retrying.
    return new Response('IPN OK', { status: 200 });

  } catch (error: any) {
    console.error("Webhook Execution Crash:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}