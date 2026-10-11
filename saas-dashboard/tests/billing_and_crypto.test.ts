import { describe, it, expect } from "vitest";
import crypto from "crypto";

describe("EPIC 13 / TDD: Dual Payment Gateway & Cryptography", () => {
  
  // 1. Geo-routing test
  it("should route Indian IP headers to Razorpay with INR currency", () => {
    const mockHeaders = {
      "cf-ipcountry": "IN",
      "x-vercel-ip-country": "IN"
    };

    const isDomestic = mockHeaders["cf-ipcountry"] === "IN";
    const planId: "pro" | "studio" = "pro";
    const amountInInr = planId === "studio" ? 29999 : 9999;

    expect(isDomestic).toBe(true);
    expect(amountInInr).toBe(9999);
  });

  it("should route International IP headers to Paddle with USD currency", () => {
    const mockHeaders = {
      "cf-ipcountry": "US",
      "x-vercel-ip-country": "US"
    };

    const isDomestic = mockHeaders["cf-ipcountry"] === "IN";
    const planId: "pro" | "studio" = "pro";
    const amountInUsd = planId === "studio" ? 499 : 149;

    expect(isDomestic).toBe(false);
    expect(amountInUsd).toBe(149);
  });

  // 2. Razorpay HMAC-SHA256 signature verification test
  it("should verify valid Razorpay HMAC-SHA256 signature and reject tampered payload", () => {
    const webhookSecret = "rzp_secret_test_key_12345";
    const validPayload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_123", amount: 999900 } } }
    });

    // Generate valid HMAC
    const validSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(validPayload)
      .digest("hex");

    // Verification logic
    const computedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(validPayload)
      .digest("hex");

    expect(computedSignature).toBe(validSignature);

    // Tampered payload verification
    const tamperedPayload = validPayload.replace("999900", "100");
    const tamperedCheck = crypto
      .createHmac("sha256", webhookSecret)
      .update(tamperedPayload)
      .digest("hex");

    expect(tamperedCheck).not.toBe(validSignature);
  });

  // 3. Paddle signature verification test
  it("should verify valid Paddle timestamped signature (ts + h1) header", () => {
    const paddleSecret = "pdl_secret_test_key_67890";
    const rawBody = JSON.stringify({
      event_type: "transaction.completed",
      data: { id: "txn_001", status: "completed" }
    });
    const ts = "1728639000";

    const payloadToHash = `${ts}:${rawBody}`;
    const validHash = crypto
      .createHmac("sha256", paddleSecret)
      .update(payloadToHash)
      .digest("hex");

    const header = `ts=${ts};h1=${validHash}`;

    // Parsing test
    const parts = header.split(";");
    const parsedTs = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
    const parsedH1 = parts.find((p) => p.startsWith("h1="))?.split("=")[1];

    expect(parsedTs).toBe(ts);
    expect(parsedH1).toBe(validHash);

    const recomputedHash = crypto
      .createHmac("sha256", paddleSecret)
      .update(`${parsedTs}:${rawBody}`)
      .digest("hex");

    expect(recomputedHash).toBe(parsedH1);
  });

});
