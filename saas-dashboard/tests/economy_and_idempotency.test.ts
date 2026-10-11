import { describe, it, expect } from "vitest";

describe("EPIC 04 & 05 / TDD: Economy V2 & Idempotency", () => {

  it("should prevent double spending using unique idempotency keys", () => {
    const processedTransactions = new Map<string, any>();

    function executePurchase(idempotencyKey: string, playerId: string, amount: number) {
      if (processedTransactions.has(idempotencyKey)) {
        return {
          deduped: true,
          response: processedTransactions.get(idempotencyKey)
        };
      }

      const result = {
        txId: `tx_${Date.now()}`,
        playerId,
        amountDeducted: amount,
        status: "success"
      };

      processedTransactions.set(idempotencyKey, result);
      return { deduped: false, response: result };
    }

    // First attempt
    const firstCall = executePurchase("req_unique_001", "player_123", 100);
    expect(firstCall.deduped).toBe(false);
    expect(firstCall.response.amountDeducted).toBe(100);

    // Duplicate retry attempt (flaky mobile network)
    const retryCall = executePurchase("req_unique_001", "player_123", 100);
    expect(retryCall.deduped).toBe(true);
    expect(retryCall.response.txId).toBe(firstCall.response.txId);
  });

  it("should reject purchases when wallet balance is insufficient", () => {
    let walletBalance = 50; // Player has 50 Gold
    const itemPrice = 100;  // Item costs 100 Gold

    function purchase(balance: number, price: number) {
      if (balance < price) {
        return { success: false, error: "INSUFFICIENT_FUNDS", balance };
      }
      return { success: true, balance: balance - price };
    }

    const failedAttempt = purchase(walletBalance, itemPrice);
    expect(failedAttempt.success).toBe(false);
    expect(failedAttempt.error).toBe("INSUFFICIENT_FUNDS");
    expect(failedAttempt.balance).toBe(50); // Balance untouched

    // Valid purchase
    walletBalance = 200;
    const successfulAttempt = purchase(walletBalance, itemPrice);
    expect(successfulAttempt.success).toBe(true);
    expect(successfulAttempt.balance).toBe(100);
  });

});
