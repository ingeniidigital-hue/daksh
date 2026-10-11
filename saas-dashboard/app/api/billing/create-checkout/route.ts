import { NextRequest, NextResponse } from "next/server";

// Dual Payment Gateway Checkout Router: Razorpay (India) + Paddle (Global MoR)
export async function POST(req: NextRequest) {
  try {
    const { planId = "pro", titleId, preferredGateway } = await req.json();

    // Geo-detection from HTTP headers (Next.js / Cloudflare / Vercel)
    const clientCountry = req.headers.get("x-vercel-ip-country") || 
                          req.headers.get("cf-ipcountry") || 
                          "IN"; // Default to India in local development

    const isDomestic = preferredGateway === "razorpay" || (preferredGateway !== "paddle" && clientCountry === "IN");

    if (isDomestic) {
      // --- ROUTE TO RAZORPAY (India / INR / UPI) ---
      const priceInInr = planId === "studio" ? 29999 : 9999;
      
      const rzpKey = process.env.RAZORPAY_KEY_ID;
      const rzpSecret = process.env.RAZORPAY_KEY_SECRET;

      if (!rzpKey || !rzpSecret) {
        // Return simulated sandbox checkout for local offline development
        return NextResponse.json({
          gateway: "razorpay",
          currency: "INR",
          amount: priceInInr,
          mode: "mock_sandbox",
          message: "Razorpay sandbox session initialized for local offline dev",
          orderId: `order_rzp_mock_${Date.now()}`,
          key: "rzp_test_mock_daksh_local"
        });
      }

      // Live Razorpay API call
      const authHeader = "Basic " + Buffer.from(`${rzpKey}:${rzpSecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({
          amount: priceInInr * 100, // paise
          currency: "INR",
          receipt: `rcpt_${titleId}_${Date.now()}`,
          notes: { titleId, planId }
        })
      });

      const orderData = await rzpRes.json();
      return NextResponse.json({
        gateway: "razorpay",
        currency: "INR",
        amount: priceInInr,
        orderId: orderData.id,
        key: rzpKey
      });

    } else {
      // --- ROUTE TO PADDLE (Global / USD / Merchant of Record) ---
      const priceInUsd = planId === "studio" ? 499 : 149;
      const paddleKey = process.env.PADDLE_API_KEY;

      if (!paddleKey) {
        // Return simulated sandbox checkout for local offline development
        return NextResponse.json({
          gateway: "paddle",
          currency: "USD",
          amount: priceInUsd,
          mode: "mock_sandbox",
          message: "Paddle Merchant of Record sandbox session initialized for local offline dev",
          checkoutUrl: `https://sandbox-buy.paddle.com/mock-checkout?titleId=${titleId}&plan=${planId}&amount=${priceInUsd}`
        });
      }

      // Live Paddle Billing API v2 call
      const paddleRes = await fetch("https://api.paddle.com/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${paddleKey}`
        },
        body: JSON.stringify({
          items: [
            {
              price_id: planId === "studio" ? process.env.PADDLE_STUDIO_PRICE_ID : process.env.PADDLE_PRO_PRICE_ID,
              quantity: 1
            }
          ],
          custom_data: { titleId, planId }
        })
      });

      const paddleData = await paddleRes.json();
      return NextResponse.json({
        gateway: "paddle",
        currency: "USD",
        amount: priceInUsd,
        checkoutUrl: paddleData.data?.url
      });
    }

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to initialize payment gateway" },
      { status: 500 }
    );
  }
}
