import {
  CatalogItem,
  InventoryItemInstance,
  PurchaseRequest,
  PurchaseResult
} from "./types";
import {
  creditWallet,
  getAllPlayerWallets,
  getWalletBalance,
  tryDeductFunds,
  withPlayerRowLock
} from "./wallet";
import { getCatalogItem } from "./catalog";

// In-memory player inventory: key = `${titleId}:${playerId}`
const inventoriesDb = new Map<string, InventoryItemInstance[]>();

// Idempotency records table: key = `${titleId}:${idempotencyKey}`
const idempotencyDb = new Map<string, PurchaseResult>();

function getInventoryKey(titleId: string, playerId: string): string {
  return `${titleId}:${playerId}`;
}

export function resetServiceStorage() {
  inventoriesDb.clear();
  idempotencyDb.clear();
}

export class EconomyService {
  /**
   * Retrieves player inventory items.
   */
  public static getPlayerInventory(titleId: string, playerId: string): InventoryItemInstance[] {
    const key = getInventoryKey(titleId, playerId);
    return inventoriesDb.get(key) || [];
  }

  /**
   * Credits a player's virtual wallet.
   */
  public static creditWallet(titleId: string, playerId: string, currencyCode: string, amount: number): number {
    return creditWallet(titleId, playerId, currencyCode, amount);
  }

  /**
   * Deducts funds from a player's virtual wallet atomically.
   */
  public static deductWallet(titleId: string, playerId: string, currencyCode: string, amount: number): number {
    const res = tryDeductFunds(titleId, playerId, currencyCode, amount);
    if (!res.success) {
      throw new Error(`INSUFFICIENT_FUNDS: Player has insufficient ${currencyCode}`);
    }
    return res.newBalance;
  }

  /**
   * Returns a player's wallet balance for a specific currency.
   */
  public static getPlayerBalance(titleId: string, playerId: string, currencyCode: string): number {
    return getWalletBalance(titleId, playerId, currencyCode);
  }

  /**
   * Retrieves all wallet balances for a player.
   */
  public static getPlayerWallets(titleId: string, playerId: string): Record<string, number> {
    return getAllPlayerWallets(titleId, playerId);
  }

  /**
   * Executes an atomic purchase transaction protected by row-level locks and idempotency keys.
   */
  public static async purchaseItem(req: PurchaseRequest): Promise<PurchaseResult> {
    const { titleId, playerId, itemId, currencyCode, idempotencyKey } = req;

    // 1. Idempotency Check: Return cached transaction if already processed
    const idemKey = `${titleId}:${idempotencyKey}`;
    if (idempotencyDb.has(idemKey)) {
      const cached = idempotencyDb.get(idemKey)!;
      return {
        ...cached,
        isDeduped: true
      };
    }

    // 2. Validate Catalog Item
    const item = getCatalogItem(titleId, itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in catalog`);
    }

    const price = item.prices[currencyCode.toUpperCase()];
    if (price === undefined) {
      return {
        success: false,
        error: "CURRENCY_NOT_SUPPORTED"
      };
    }

    // 3. Acquire exclusive row-level lock for the player
    return await withPlayerRowLock(titleId, playerId, async () => {
      // Re-check idempotency inside lock in case of concurrent duplicate arrival
      if (idempotencyDb.has(idemKey)) {
        return {
          ...idempotencyDb.get(idemKey)!,
          isDeduped: true
        };
      }

      // 4. Check & deduct wallet balance atomically
      const deduction = tryDeductFunds(titleId, playerId, currencyCode, price);
      if (!deduction.success) {
        return {
          success: false,
          error: "INSUFFICIENT_FUNDS",
          newBalance: deduction.newBalance,
          currencyCode
        };
      }

      // 5. Grant inventory item
      const instanceId = `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const grantedItem: InventoryItemInstance = {
        instanceId,
        itemId: item.id,
        name: item.name,
        acquiredAt: new Date().toISOString(),
        customData: item.metadata || {}
      };

      const invKey = getInventoryKey(titleId, playerId);
      const playerInv = inventoriesDb.get(invKey) || [];
      playerInv.push(grantedItem);
      inventoriesDb.set(invKey, playerInv);

      // 6. Generate Transaction Receipt & Record Idempotency Key
      const receipt: PurchaseResult = {
        success: true,
        txId: `tx_${Date.now()}`,
        newBalance: deduction.newBalance,
        currencyCode,
        grantedItem
      };

      idempotencyDb.set(idemKey, receipt);
      return receipt;
    });
  }
}
