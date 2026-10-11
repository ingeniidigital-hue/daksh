import { describe, it, expect, beforeEach } from "vitest";
import {
  EconomyService,
  resetEconomyStorage,
  seedEconomyCatalog,
  getWalletBalance
} from "../lib/economy";

describe("STORY-03 / TDD: PlayFab Economy V2 & Atomic Wallet Concurrency", () => {
  const titleId = "TITLE_ECO";
  const playerId = "ply_hero_777";

  beforeEach(() => {
    resetEconomyStorage();
    seedEconomyCatalog(titleId);
  });

  it("TEST-03-A [Happy Path]: Player with 500 Gold purchases 100 Gold item atomically", async () => {
    // 1. Initial wallet setup: 500 GOLD
    EconomyService.creditWallet(titleId, playerId, "GOLD", 500);
    expect(getWalletBalance(titleId, playerId, "GOLD")).toBe(500);

    // 2. Execute purchase of iron_sword (costs 100 GOLD)
    const result = await EconomyService.purchaseItem({
      titleId,
      playerId,
      itemId: "item_iron_sword",
      currencyCode: "GOLD",
      idempotencyKey: "tx_happy_001"
    });

    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(400);
    expect(result.grantedItem).toBeDefined();
    expect(result.grantedItem.itemId).toBe("item_iron_sword");

    // 3. Verify final wallet and inventory
    expect(getWalletBalance(titleId, playerId, "GOLD")).toBe(400);
    const inventory = EconomyService.getPlayerInventory(titleId, playerId);
    expect(inventory.length).toBe(1);
    expect(inventory[0].itemId).toBe("item_iron_sword");
  });

  it("TEST-03-B [Concurrency/Race Condition]: 2 concurrent purchases for 100 Gold item with only 100 Gold in wallet", async () => {
    // Player has exactly 100 GOLD
    EconomyService.creditWallet(titleId, playerId, "GOLD", 100);
    expect(getWalletBalance(titleId, playerId, "GOLD")).toBe(100);

    // Two requests arrive simultaneously
    const req1 = EconomyService.purchaseItem({
      titleId,
      playerId,
      itemId: "item_iron_sword",
      currencyCode: "GOLD",
      idempotencyKey: "tx_race_001"
    });

    const req2 = EconomyService.purchaseItem({
      titleId,
      playerId,
      itemId: "item_iron_sword",
      currencyCode: "GOLD",
      idempotencyKey: "tx_race_002"
    });

    const [res1, res2] = await Promise.all([req1, req2]);

    const successes = [res1, res2].filter(r => r.success);
    const failures = [res1, res2].filter(r => !r.success);

    // EXACTLY 1 must succeed and EXACTLY 1 must fail
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    expect(failures[0].error).toBe("INSUFFICIENT_FUNDS");

    // Balance must be exactly 0, never negative (no balance underflow)
    const finalBalance = getWalletBalance(titleId, playerId, "GOLD");
    expect(finalBalance).toBe(0);

    // Inventory must contain exactly 1 item
    const inventory = EconomyService.getPlayerInventory(titleId, playerId);
    expect(inventory.length).toBe(1);
  });

  it("TEST-03-C [Failure Mode]: purchase request with insufficient funds returns 402 with zero wallet mutation", async () => {
    EconomyService.creditWallet(titleId, playerId, "GOLD", 50);

    const result = await EconomyService.purchaseItem({
      titleId,
      playerId,
      itemId: "item_iron_sword", // Costs 100 GOLD
      currencyCode: "GOLD",
      idempotencyKey: "tx_insufficient_001"
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("INSUFFICIENT_FUNDS");

    // Balance must be untouched
    expect(getWalletBalance(titleId, playerId, "GOLD")).toBe(50);
    const inventory = EconomyService.getPlayerInventory(titleId, playerId);
    expect(inventory.length).toBe(0);
  });

  it("TEST-03-D [Database Integrity]: invalid item ID causes immediate abort with zero wallet deduction", async () => {
    EconomyService.creditWallet(titleId, playerId, "GOLD", 500);

    await expect(EconomyService.purchaseItem({
      titleId,
      playerId,
      itemId: "non_existent_item_999",
      currencyCode: "GOLD",
      idempotencyKey: "tx_invalid_001"
    })).rejects.toThrow("Item non_existent_item_999 not found in catalog");

    // Balance untouched
    expect(getWalletBalance(titleId, playerId, "GOLD")).toBe(500);
  });

  it("TEST-03-E [Idempotency Deduplication]: network retries with same idempotency key return cached receipt", async () => {
    EconomyService.creditWallet(titleId, playerId, "GOLD", 500);

    const first = await EconomyService.purchaseItem({
      titleId,
      playerId,
      itemId: "item_healing_potion", // Costs 25 GOLD
      currencyCode: "GOLD",
      idempotencyKey: "tx_retry_idem_key_100"
    });

    expect(first.success).toBe(true);
    expect(first.newBalance).toBe(475);

    // Retry sending identical request (simulating mobile network reconnect)
    const retry = await EconomyService.purchaseItem({
      titleId,
      playerId,
      itemId: "item_healing_potion",
      currencyCode: "GOLD",
      idempotencyKey: "tx_retry_idem_key_100"
    });

    expect(retry.success).toBe(true);
    expect(retry.isDeduped).toBe(true);
    expect(retry.newBalance).toBe(475); // Balance NOT deducted twice!

    // Wallet is still 475, not 450!
    expect(getWalletBalance(titleId, playerId, "GOLD")).toBe(475);
    const inventory = EconomyService.getPlayerInventory(titleId, playerId);
    expect(inventory.length).toBe(1); // Only 1 potion granted!
  });

});
