export interface VirtualCurrency {
  code: string;
  name: string;
  initialDeposit: number;
}

export interface CatalogItem {
  id: string;
  titleId: string;
  name: string;
  description: string;
  category: "weapon" | "armor" | "consumable" | "bundle";
  prices: Record<string, number>; // e.g. { "GOLD": 100, "GEMS": 10 }
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface InventoryItemInstance {
  instanceId: string;
  itemId: string;
  name: string;
  acquiredAt: string;
  customData?: Record<string, any>;
}

export interface PurchaseRequest {
  titleId: string;
  playerId: string;
  itemId: string;
  currencyCode: string;
  idempotencyKey: string;
}

export interface PurchaseResult {
  success: boolean;
  isDeduped?: boolean;
  txId?: string;
  error?: "INSUFFICIENT_FUNDS" | "ITEM_NOT_FOUND" | "CURRENCY_NOT_SUPPORTED" | "DATABASE_LOCK_TIMEOUT";
  newBalance?: number;
  currencyCode?: string;
  grantedItem?: InventoryItemInstance;
}
