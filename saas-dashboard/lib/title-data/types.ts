export type TitleDataScope = 'public' | 'internal';

export type LootRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface TitleDataItem {
  key: string;
  value: string;
  scope: TitleDataScope;
  titleId: string;
  revision: number;
  updatedAt: string;
  description?: string;
}

export interface LootTableItem {
  itemId: string;
  rarity: LootRarity;
  weight: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface LootTable {
  tableId: string;
  titleId: string;
  name: string;
  description?: string;
  entries: LootTableItem[];
  updatedAt: string;
}

export interface LootDropResult {
  tableId: string;
  grantedItem: {
    itemId: string;
    quantity: number;
  };
  rarity: LootRarity;
  roll: number;
  totalWeight: number;
  pityTriggered: boolean;
}

export interface GetTitleDataRequest {
  titleId: string;
  scope?: TitleDataScope;
  keys?: string[];
  secretKey?: string;
}

export interface GetTitleDataResponse {
  titleId: string;
  scope: TitleDataScope;
  data: Record<string, string>;
  revisions: Record<string, number>;
}

export interface SetTitleDataRequest {
  titleId: string;
  key: string;
  value: string;
  scope?: TitleDataScope;
  description?: string;
  validateJson?: boolean;
}

export interface RollLootDropRequest {
  titleId: string;
  tableId: string;
  pityCounter?: number;
  pityThreshold?: number;
  pityGuaranteedRarity?: LootRarity;
}
