import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, description, order_id } = body;

    const apiKey = process.env.NOWPAYMENTS_API_KEY;

    if (!apiKey) {
      console.error("NOWPayments API Key is missing.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usdt',        // Prices are listed in USDT
        pay_currency: 'usdttrc20',     // THIS LOCKS THE CHECKOUT TO TRON ONLY
        order_id: order_id,     
        order_description: description,
        success_url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success` : 'http://localhost:3000/dashboard?payment=success',
        cancel_url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=cancelled` : 'http://localhost:3000/dashboard?payment=cancelled',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("NOWPayments Error:", data);
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }

    return NextResponse.json({ checkout_url: data.invoice_url });

  } catch (error) {
    console.error("Checkout System Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}