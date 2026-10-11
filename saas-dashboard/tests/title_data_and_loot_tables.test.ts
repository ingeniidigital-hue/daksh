import { describe, it, expect, beforeEach } from "vitest";
import {
  TitleDataService,
  resetTitleDataStorage,
  seedDefaultTitleData
} from "../lib/title-data";

describe("STORY-04 / TDD: Title Data (Remote Config KV Store), Internal Title Data & Loot Drop Tables", () => {
  const titleId = "TITLE_GAME_01";
  const clientToken = "client_session_token_player_1";
  const serverSecret = "secret_master_key_xyz987";

  beforeEach(() => {
    resetTitleDataStorage();
    seedDefaultTitleData(titleId);
  });

  it("TEST-04-A [Happy Path]: Client fetches GetTitleData and receives public game constants in <20ms", async () => {
    const start = performance.now();
    const result = await TitleDataService.getTitleData({
      titleId,
      scope: "public",
      keys: ["GameConfig", "SeasonalEvent"]
    });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(20); // Sub-20ms requirement
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data["GameConfig"]).toBeDefined();
    const gameConfig = JSON.parse(result.data["GameConfig"]);
    expect(gameConfig.xpMultiplier).toBe(1.5);
    expect(gameConfig.maxLevel).toBe(100);

    const seasonConfig = JSON.parse(result.data["SeasonalEvent"]);
    expect(seasonConfig.active).toBe(true);
    expect(seasonConfig.name).toBe("Solar Flare 2026");
  });

  it("TEST-04-B [Security Isolation]: Game client request to GetTitleData never leaks internal title keys or secret server configs", async () => {
    // 1. Client fetches all public title data without specifying keys
    const publicResult = await TitleDataService.getTitleData({
      titleId,
      scope: "public"
    });

    // Public configs should exist
    expect(publicResult.data["GameConfig"]).toBeDefined();
    expect(publicResult.data["SeasonalEvent"]).toBeDefined();

    // Internal secrets MUST NOT be present in public scope
    expect(publicResult.data["AntiCheat_Rules"]).toBeUndefined();
    expect(publicResult.data["Payment_Secret_Webhook_Key"]).toBeUndefined();
    expect(publicResult.data["RNG_Master_Salt"]).toBeUndefined();

    // 2. Client maliciously requests an internal key under public scope
    const breachAttempt = await TitleDataService.getTitleData({
      titleId,
      scope: "public",
      keys: ["AntiCheat_Rules", "Payment_Secret_Webhook_Key"]
    });
    // Even if explicitly requested by key, public query cannot leak internal keys
    expect(breachAttempt.data["AntiCheat_Rules"]).toBeUndefined();
    expect(breachAttempt.data["Payment_Secret_Webhook_Key"]).toBeUndefined();

    // 3. Client attempts to query internal scope without server authorization
    await expect(
      TitleDataService.getTitleData({
        titleId,
        scope: "internal",
        secretKey: "invalid_or_missing_token"
      })
    ).rejects.toThrow("FORBIDDEN: Server authorization required for Internal Title Data");

    // 4. Authorized server/admin query successfully accesses internal data
    const serverResult = await TitleDataService.getTitleData({
      titleId,
      scope: "internal",
      secretKey: serverSecret
    });
    expect(serverResult.data["AntiCheat_Rules"]).toBeDefined();
    const antiCheat = JSON.parse(serverResult.data["AntiCheat_Rules"]);
    expect(antiCheat.maxSpeedMetersPerSec).toBe(35);
  });

  it("TEST-04-C [RNG Distribution]: 10,000 loot box rolls with 70% Common / 25% Rare / 5% Legendary match expected statistical variance within 1.5%", async () => {
    const lootTableId = "mystery_chest_v1";

    const rolls = 10000;
    const counts: Record<string, number> = {
      COMMON: 0,
      RARE: 0,
      LEGENDARY: 0
    };

    const startTime = performance.now();
    for (let i = 0; i < rolls; i++) {
      const drop = await TitleDataService.rollLootDrop({
        titleId,
        tableId: lootTableId
      });
      expect(drop.grantedItem).toBeDefined();
      counts[drop.rarity] = (counts[drop.rarity] || 0) + 1;
    }
    const duration = performance.now() - startTime;
    console.log(`10,000 Cryptographic RNG rolls executed in ${duration.toFixed(2)}ms`);

    const commonPercent = (counts.COMMON / rolls) * 100;
    const rarePercent = (counts.RARE / rolls) * 100;
    const legendaryPercent = (counts.LEGENDARY / rolls) * 100;

    console.log("RNG Sample Results:", {
      COMMON: `${commonPercent.toFixed(2)}% (Target: 70%)`,
      RARE: `${rarePercent.toFixed(2)}% (Target: 25%)`,
      LEGENDARY: `${legendaryPercent.toFixed(2)}% (Target: 5%)`
    });

    // Statistical tolerance: within ±1.5% of expected probabilities for 10,000 rolls
    expect(commonPercent).toBeGreaterThanOrEqual(68.5);
    expect(commonPercent).toBeLessThanOrEqual(71.5);

    expect(rarePercent).toBeGreaterThanOrEqual(23.5);
    expect(rarePercent).toBeLessThanOrEqual(26.5);

    expect(legendaryPercent).toBeGreaterThanOrEqual(3.5);
    expect(legendaryPercent).toBeLessThanOrEqual(6.5);
  });

  it("TEST-04-D [Failure Mode]: Malformed JSON submission in SetTitleData is rejected by schema validator before database commit", async () => {
    // 1. Attempt to set malformed JSON
    const malformedPayload = "{ this is definitely not valid json : 123 ";

    await expect(
      TitleDataService.setTitleData({
        titleId,
        key: "BrokenConfig",
        value: malformedPayload,
        scope: "public",
        validateJson: true
      })
    ).rejects.toThrow("MALFORMED_JSON: Value must be valid JSON");

    // Verify key was NOT committed to storage
    const check = await TitleDataService.getTitleData({
      titleId,
      scope: "public",
      keys: ["BrokenConfig"]
    });
    expect(check.data["BrokenConfig"]).toBeUndefined();

    // 2. Setting valid JSON succeeds and increments revision
    const validPayload = JSON.stringify({ serverTickRate: 60, pvpEnabled: true });
    const successResult = await TitleDataService.setTitleData({
      titleId,
      key: "ServerSettings",
      value: validPayload,
      scope: "public",
      validateJson: true
    });

    expect(successResult.success).toBe(true);
    expect(successResult.revision).toBeGreaterThan(0);

    const saved = await TitleDataService.getTitleData({
      titleId,
      scope: "public",
      keys: ["ServerSettings"]
    });
    expect(saved.data["ServerSettings"]).toBe(validPayload);
  });

  it("TEST-04-E [Loot Tables CRUD & Pity Counter Mechanics]: Can define custom loot tables with minimum guaranteed rarity", async () => {
    const tableId = "boss_raid_chest";
    await TitleDataService.registerLootTable({
      titleId,
      tableId,
      name: "Boss Raid Mythic Chest",
      entries: [
        { itemId: "potion_mana", rarity: "COMMON", weight: 80, minQuantity: 1, maxQuantity: 5 },
        { itemId: "scroll_teleport", rarity: "RARE", weight: 19, minQuantity: 1, maxQuantity: 2 },
        { itemId: "mythic_excalibur", rarity: "LEGENDARY", weight: 1, minQuantity: 1, maxQuantity: 1 }
      ]
    });

    // Test pity drop guarantee: if pityCounter >= 50, enforce LEGENDARY
    const pityDrop = await TitleDataService.rollLootDrop({
      titleId,
      tableId,
      pityCounter: 50,
      pityThreshold: 50,
      pityGuaranteedRarity: "LEGENDARY"
    });

    expect(pityDrop.rarity).toBe("LEGENDARY");
    expect(pityDrop.grantedItem.itemId).toBe("mythic_excalibur");
    expect(pityDrop.pityTriggered).toBe(true);
  });
});
