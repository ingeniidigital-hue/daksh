import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const processedPaddleEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("paddle-signature");
    const secret = process.env.PADDLE_WEBHOOK_SECRET;

    if (secret && signatureHeader) {
      // Paddle format: ts=12345678;h1=hash
      const parts = signatureHeader.split(";");
      const tsPart = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
      const hashPart = parts.find((p) => p.startsWith("h1="))?.split("=")[1];

      if (!tsPart || !hashPart) {
        return NextResponse.json({ error: "Malformed Paddle signature header" }, { status: 400 });
      }

      const payloadToHash = `${tsPart}:${rawBody}`;
      const expectedHash = crypto
        .createHmac("sha256", secret)
        .update(payloadToHash)
        .digest("hex");

      if (expectedHash !== hashPart) {
        return NextResponse.json({ error: "Invalid Paddle HMAC signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody || "{}");
    const eventType = payload.event_type;
    const eventId = payload.event_id || payload.data?.id || rawBody;

    // Idempotency Deduplication Guard
    if (processedPaddleEvents.has(eventId)) {
      return NextResponse.json({ received: true, deduplicated: true, gateway: "paddle" });
    }
    processedPaddleEvents.add(eventId);

    if (
      eventType === "transaction.completed" || 
      eventType === "subscription.activated" ||
      eventType === "subscription.updated"
    ) {
      const customData = payload.data?.custom_data || {};
      const titleId = customData.titleId;
      const planId = customData.planId || "pro";

      console.log(`[PADDLE WEBHOOK] Verified event '${eventType}' for Title: ${titleId}, Plan: ${planId}`);
      // In production, update PostgreSQL title_entitlements table:
      // UPDATE titles SET cloud_tier = $1, billing_provider = 'paddle' WHERE id = $2;
    }

    return NextResponse.json({ received: true, gateway: "paddle" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
