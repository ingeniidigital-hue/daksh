import { CatalogItem, VirtualCurrency } from "./types";

const currenciesDb = new Map<string, VirtualCurrency[]>(); // key: titleId
const catalogItemsDb = new Map<string, CatalogItem[]>(); // key: titleId

export function resetCatalogStorage() {
  currenciesDb.clear();
  catalogItemsDb.clear();
}

/**
 * Seeds default PlayFab-style dual currencies and initial items for a title.
 */
export function seedEconomyCatalog(titleId: string) {
  // Dual currencies: Soft currency (GOLD) and Hard currency (GEMS)
  const defaultCurrencies: VirtualCurrency[] = [
    { code: "GOLD", name: "Gold Coins", initialDeposit: 1000 },
    { code: "GEMS", name: "Premium Gems", initialDeposit: 50 }
  ];
  currenciesDb.set(titleId, defaultCurrencies);

  // Initial RPG store catalog
  const defaultItems: CatalogItem[] = [
    {
      id: "item_iron_sword",
      titleId,
      name: "Iron Broadsword",
      description: "A sharp, reliable blade forged from tempered steel.",
      category: "weapon",
      prices: { "GOLD": 100 },
      isActive: true,
      metadata: { attack: 25, rarity: "Common" }
    },
    {
      id: "item_healing_potion",
      titleId,
      name: "Elixir of Vitality",
      description: "Restores 150 health points instantly.",
      category: "consumable",
      prices: { "GOLD": 25 },
      isActive: true,
      metadata: { healAmount: 150, consumable: true }
    },
    {
      id: "item_dragon_shield",
      titleId,
      name: "Dragon Scale Aegis",
      description: "A legendary shield impervious to flame attacks.",
      category: "armor",
      prices: { "GEMS": 20, "GOLD": 500 },
      isActive: true,
      metadata: { defense: 80, rarity: "Legendary" }
    }
  ];
  catalogItemsDb.set(titleId, defaultItems);
}

export function listCurrencies(titleId: string): VirtualCurrency[] {
  if (!currenciesDb.has(titleId)) {
    seedEconomyCatalog(titleId);
  }
  return currenciesDb.get(titleId) || [];
}

export function addCurrency(titleId: string, currency: VirtualCurrency): VirtualCurrency {
  const list = listCurrencies(titleId);
  const existing = list.find(c => c.code === currency.code.toUpperCase());
  if (existing) {
    throw new Error(`Currency ${currency.code} already exists`);
  }
  const normalized = {
    ...currency,
    code: currency.code.toUpperCase()
  };
  list.push(normalized);
  currenciesDb.set(titleId, list);
  return normalized;
}

export function listCatalogItems(titleId: string): CatalogItem[] {
  if (!catalogItemsDb.has(titleId)) {
    seedEconomyCatalog(titleId);
  }
  return catalogItemsDb.get(titleId) || [];
}

export function getCatalogItem(titleId: string, itemId: string): CatalogItem | undefined {
  const items = listCatalogItems(titleId);
  return items.find(i => i.id === itemId && i.isActive);
}

export function addCatalogItem(titleId: string, item: Omit<CatalogItem, "titleId">): CatalogItem {
  const items = listCatalogItems(titleId);
  if (items.some(i => i.id === item.id)) {
    throw new Error(`Item ${item.id} already exists`);
  }
  const newItem: CatalogItem = {
    ...item,
    titleId
  };
  items.push(newItem);
  catalogItemsDb.set(titleId, items);
  return newItem;
}
