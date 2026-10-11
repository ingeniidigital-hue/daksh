import crypto from "crypto";
import { LootTable, LootTableItem, LootDropResult, LootRarity } from "./types";

/**
 * Returns a cryptographically uniform random float in [0, 1) using crypto.randomBytes
 */
export function secureRandomFloat(): number {
  const buf = crypto.randomBytes(4);
  const uint32 = buf.readUInt32BE(0);
  return uint32 / 0x100000000;
}

/**
 * Executes a weighted roll across loot table entries.
 * Supports guaranteed minimum rarity threshold via pity mechanics.
 */
export function rollFromLootTable(
  table: LootTable,
  options?: {
    pityCounter?: number;
    pityThreshold?: number;
    pityGuaranteedRarity?: LootRarity;
  }
): LootDropResult {
  if (!table.entries || table.entries.length === 0) {
    throw new Error(`LOOT_TABLE_EMPTY: Table '${table.tableId}' contains zero drop entries.`);
  }

  const { pityCounter = 0, pityThreshold = 0, pityGuaranteedRarity } = options || {};
  let candidateEntries = table.entries;
  let pityTriggered = false;

  // Check if pity counter triggered guaranteed rarity
  if (pityThreshold > 0 && pityCounter >= pityThreshold && pityGuaranteedRarity) {
    const pityCandidates = table.entries.filter(e => e.rarity === pityGuaranteedRarity);
    if (pityCandidates.length > 0) {
      candidateEntries = pityCandidates;
      pityTriggered = true;
    }
  }

  const totalWeight = candidateEntries.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    throw new Error(`LOOT_TABLE_INVALID_WEIGHT: Cumulative weight must be greater than 0.`);
  }

  const roll = secureRandomFloat() * totalWeight;
  let runningWeight = 0;
  let selectedEntry: LootTableItem = candidateEntries[0];

  for (const entry of candidateEntries) {
    runningWeight += entry.weight;
    if (roll < runningWeight) {
      selectedEntry = entry;
      break;
    }
  }

  // Calculate random item quantity between minQuantity and maxQuantity
  let quantity = selectedEntry.minQuantity;
  if (selectedEntry.maxQuantity > selectedEntry.minQuantity) {
    const range = selectedEntry.maxQuantity - selectedEntry.minQuantity + 1;
    quantity = selectedEntry.minQuantity + Math.floor(secureRandomFloat() * range);
  }

  return {
    tableId: table.tableId,
    grantedItem: {
      itemId: selectedEntry.itemId,
      quantity
    },
    rarity: selectedEntry.rarity,
    roll,
    totalWeight,
    pityTriggered
  };
}
