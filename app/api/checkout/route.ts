import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, description, order_id } = body;

    const PUBLIC_KEY = process.env.COINPAYMENTS_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.COINPAYMENTS_PRIVATE_KEY;

    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      console.error("SYSTEM HALT: Coinpayments API Keys are missing.");
      return NextResponse.json({ error: "Missing Keys" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Extract the client's email from the order_id we passed from the frontend
    const clientEmail = order_id.split('_')[1] || 'client@promail.club';

    // 1. Construct the payload (Added buyer_email to satisfy Coinpayments)
    const payloadParams = new URLSearchParams({
      version: '1',
      cmd: 'create_transaction',
      key: PUBLIC_KEY,
      format: 'json',
      amount: amount.toString(),
      currency1: 'USDT',
      currency2: 'USDT.TRC20', // Ensure Tron USDT is enabled in your Coinpayments settings!
      buyer_email: clientEmail, 
      item_name: description,
      custom: order_id,
      success_url: `${baseUrl}/dashboard?payment=success`,
      cancel_url: `${baseUrl}/dashboard?payment=cancelled`
    });

    const payloadString = payloadParams.toString();

    // 2. Cryptographic Signature
    const hmac = crypto.createHmac('sha512', PRIVATE_KEY).update(payloadString).digest('hex');

    // 3. Dispatch to Coinpayments
    const response = await fetch('https://www.coinpayments.net/api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'HMAC': hmac
      },
      body: payloadString
    });

    const data = await response.json();

    // 4. Traffic Control & Error Logging
    if (data.error === 'ok' && data.result) {
      return NextResponse.json({ checkout_url: data.result.checkout_url }, { status: 200 });
    } else {
      // 🚨 IF IT FAILS, THIS LOGS THE EXACT COINPAYMENTS REASON TO VERCEL 🚨
      console.error("COINPAYMENTS REJECTED INVOICE. REASON:", data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Checkout System Crash:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}