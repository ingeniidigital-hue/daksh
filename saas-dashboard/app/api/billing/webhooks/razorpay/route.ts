import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const processedRazorpayEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: "Invalid Razorpay HMAC signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody || "{}");
    const eventType = payload.event;
    const eventId = payload.payload?.payment?.entity?.id || payload.payload?.subscription?.entity?.id || rawBody;

    // Idempotency Deduplication Guard
    if (processedRazorpayEvents.has(eventId)) {
      return NextResponse.json({ received: true, deduplicated: true, gateway: "razorpay" });
    }
    processedRazorpayEvents.add(eventId);

    // Handle payment & subscription events
    if (
      eventType === "payment.captured" || 
      eventType === "subscription.charged" || 
      eventType === "order.paid"
    ) {
      const notes = payload.payload?.payment?.entity?.notes || payload.payload?.subscription?.entity?.notes || {};
      const titleId = notes.titleId;
      const planId = notes.planId || "pro";

      console.log(`[RAZORPAY WEBHOOK] Verified event '${eventType}' for Title: ${titleId}, Plan: ${planId}`);
      // In production, update PostgreSQL title_entitlements table:
      // UPDATE titles SET cloud_tier = $1, billing_provider = 'razorpay' WHERE id = $2;
    }

    return NextResponse.json({ received: true, gateway: "razorpay" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
