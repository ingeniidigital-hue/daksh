import { TitleDataItem, TitleDataScope, LootTable } from "./types";

// In-memory backing stores for high performance (sub-20ms) operations
// Key: `${titleId}:${scope}:${key}`
const titleDataStore = new Map<string, TitleDataItem>();

// Key: `${titleId}:${tableId}`
const lootTableStore = new Map<string, LootTable>();

// Hardcoded master test secret key for server authorization
export const SERVER_MASTER_SECRET = "secret_master_key_xyz987";

export function resetTitleDataStorage(): void {
  titleDataStore.clear();
  lootTableStore.clear();
}

export function seedDefaultTitleData(titleId: string): void {
  // 1. Seed Public Title Data
  const defaultPublicConfigs: Array<{ key: string; value: object; description: string }> = [
    {
      key: "GameConfig",
      value: {
        xpMultiplier: 1.5,
        maxLevel: 100,
        energyRechargeSeconds: 300,
        maintenanceMode: false,
        clientMinVersion: "1.0.0"
      },
      description: "Core client gameplay tuning and leveling constants"
    },
    {
      key: "SeasonalEvent",
      value: {
        active: true,
        name: "Solar Flare 2026",
        startDate: "2026-10-01T00:00:00Z",
        endDate: "2026-11-01T00:00:00Z",
        featuredCatalogItem: "item_solar_blade"
      },
      description: "Active seasonal liveops event schedule and highlights"
    },
    {
      key: "UIPromos",
      value: {
        bannerUrl: "https://assets.daksh.io/promos/solar_flare.png",
        callToAction: "Join the Solar Flare Arena now!",
        deeplink: "daksh://store/bundles/solar_pack"
      },
      description: "Dynamic marketing banner displayed on main menu"
    }
  ];

  for (const item of defaultPublicConfigs) {
    const storeKey = `${titleId}:public:${item.key}`;
    titleDataStore.set(storeKey, {
      titleId,
      key: item.key,
      scope: "public",
      value: JSON.stringify(item.value, null, 2),
      revision: 1,
      updatedAt: new Date().toISOString(),
      description: item.description
    });
  }

  // 2. Seed Internal Title Data (Secret Server-Side Only)
  const defaultInternalConfigs: Array<{ key: string; value: object; description: string }> = [
    {
      key: "AntiCheat_Rules",
      value: {
        maxSpeedMetersPerSec: 35,
        maxInventoryCapacity: 250,
        flagSuspiciousPacketsOverHz: 120,
        autoBanOnTeleport: true
      },
      description: "Server-side heuristic thresholds for anti-cheat verification"
    },
    {
      key: "Payment_Secret_Webhook_Key",
      value: {
        secret: "whsec_live_98a7sd8f7a6sd5f4",
        provider: "Stripe",
        verifySignature: true
      },
      description: "Private webhook secret used for verifying IAP receipts"
    },
    {
      key: "RNG_Master_Salt",
      value: {
        salt: "e7c6d9a184b23c910fd4e7a",
        rotationIntervalHours: 24
      },
      description: "Internal cryptographic salt for server-side loot generation"
    }
  ];

  for (const item of defaultInternalConfigs) {
    const storeKey = `${titleId}:internal:${item.key}`;
    titleDataStore.set(storeKey, {
      titleId,
      key: item.key,
      scope: "internal",
      value: JSON.stringify(item.value, null, 2),
      revision: 1,
      updatedAt: new Date().toISOString(),
      description: item.description
    });
  }

  // 3. Seed Default Loot Tables
  const defaultLootTable: LootTable = {
    titleId,
    tableId: "mystery_chest_v1",
    name: "Standard Mystery Chest V1",
    description: "Standard daily chest with 70% Common, 25% Rare, 5% Legendary",
    updatedAt: new Date().toISOString(),
    entries: [
      { itemId: "potion_health_small", rarity: "COMMON", weight: 70, minQuantity: 1, maxQuantity: 3 },
      { itemId: "gem_pouch_silver", rarity: "RARE", weight: 25, minQuantity: 1, maxQuantity: 1 },
      { itemId: "dragon_scale_armor", rarity: "LEGENDARY", weight: 5, minQuantity: 1, maxQuantity: 1 }
    ]
  };

  lootTableStore.set(`${titleId}:${defaultLootTable.tableId}`, defaultLootTable);
}

export function getRawTitleDataStore(): Map<string, TitleDataItem> {
  return titleDataStore;
}

export function getRawLootTableStore(): Map<string, LootTable> {
  return lootTableStore;
}
