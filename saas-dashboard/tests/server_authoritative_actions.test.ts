import { describe, it, expect, beforeEach } from "vitest";
import { ActionReportingService, resetActionReportStore } from "../lib/actions";
import { getWalletBalance, resetServiceStorage, resetWalletsStorage } from "../lib/economy";

describe("Zero-Trust Server-Authoritative Action Reporting Architecture", () => {
  const titleId = "TITLE_ZERO_TRUST";
  const playerId = "player_legit_hero_01";

  beforeEach(() => {
    resetActionReportStore();
    resetServiceStorage();
    resetWalletsStorage();
  });

  it("TEST-ACTION-01 [Server-Authoritative Rewards]: Client reports action; server calculates and commits reward without client specifying values", async () => {
    // Client reports dungeon cleared with telemetry context (NO reward amounts passed!)
    const result = await ActionReportingService.processActionReport(titleId, {
      playerId,
      actionType: "DUNGEON_CLEARED",
      context: {
        dungeonId: "crypt_of_shadows",
        completionTimeSeconds: 120, // legit time
        monstersKilled: 10
      },
      idempotencyKey: "idem_tx_001"
    });

    expect(result.success).toBe(true);
    expect(result.antiCheatFlagged).toBeFalsy();
    // Server calculated: 150 base + (10 * 10) = 250 gold
    expect(result.grantedRewards?.gold).toBe(250);
    expect(result.grantedRewards?.xp).toBe(300);
    expect(result.serverSignature).toBeDefined();

    // Verify server directly credited authoritative database wallet
    const balance = getWalletBalance(titleId, playerId, "GOLD");
    expect(balance).toBe(250);
  });

  it("TEST-ACTION-02 [Anti-Cheat Exploit Detection]: Server rejects impossible completion time (speedhack attempt)", async () => {
    // Attacker reports clearing a 10-minute dungeon in 3 seconds
    const result = await ActionReportingService.processActionReport(titleId, {
      playerId,
      actionType: "DUNGEON_CLEARED",
      context: {
        dungeonId: "crypt_of_shadows",
        completionTimeSeconds: 3 // speedhack!
      }
    });

    expect(result.success).toBe(false);
    expect(result.antiCheatFlagged).toBe(true);
    expect(result.error).toContain("EXPLOIT_DETECTED");

    // Wallet balance remains 0; no reward granted!
    const balance = getWalletBalance(titleId, playerId, "GOLD");
    expect(balance).toBe(0);
  });

  it("TEST-ACTION-03 [Anti-Cheat Exploit Detection]: Server rejects boss defeat without sufficient damage dealt", async () => {
    // Attacker claims boss defeated with only 5 damage
    const result = await ActionReportingService.processActionReport(titleId, {
      playerId,
      actionType: "BOSS_DEFEATED",
      context: {
        bossId: "dragon_king",
        damageDealt: 5 // impossible to defeat boss with 5 damage
      }
    });

    expect(result.success).toBe(false);
    expect(result.antiCheatFlagged).toBe(true);
    expect(result.error).toContain("EXPLOIT_DETECTED");
  });

  it("TEST-ACTION-04 [Idempotency Protection]: Replayed actions are deduplicated so player is never double-rewarded", async () => {
    const idempotencyKey = "tx_dedup_unique_777";

    // 1. Initial report
    const res1 = await ActionReportingService.processActionReport(titleId, {
      playerId,
      actionType: "DAILY_LOGIN",
      idempotencyKey
    });

    expect(res1.success).toBe(true);
    expect(res1.isDeduped).toBe(false);
    expect(res1.grantedRewards?.gold).toBe(50);
    expect(getWalletBalance(titleId, playerId, "GOLD")).toBe(50);

    // 2. Client loses network and replays identical idempotency key
    const res2 = await ActionReportingService.processActionReport(titleId, {
      playerId,
      actionType: "DAILY_LOGIN",
      idempotencyKey
    });

    expect(res2.success).toBe(true);
    expect(res2.isDeduped).toBe(true);

    // Balance must STILL be 50, NOT 100!
    expect(getWalletBalance(titleId, playerId, "GOLD")).toBe(50);
  });
});
