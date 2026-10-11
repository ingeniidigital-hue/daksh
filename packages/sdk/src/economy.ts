export interface PurchaseItemParams {
  titleId: string;
  playerId: string;
  itemId: string;
  currencyCode: string;
  idempotencyKey?: string;
  endpoint?: string;
}

export interface PurchaseResponse {
  success: boolean;
  txId?: string;
  isDeduped?: boolean;
  newBalance?: number;
  currencyCode?: string;
  grantedItem?: {
    instanceId: string;
    itemId: string;
    name: string;
    acquiredAt: string;
  };
  error?: string;
}

export class DakshEconomy {
  /**
   * Executes an atomic store purchase protected by server-side row-level locks.
   */
  public static async purchaseItemAsync(params: PurchaseItemParams): Promise<PurchaseResponse> {
    const endpoint = params.endpoint || "http://localhost:3000";
    const idempotencyKey = params.idempotencyKey || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const url = `${endpoint}/api/titles/${params.titleId}/economy/purchase`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerId: params.playerId,
        itemId: params.itemId,
        currencyCode: params.currencyCode,
        idempotencyKey
      })
    });

    const data = await res.json();
    if (!res.ok && !data.error) {
      throw new Error(`[Daksh.Economy] Purchase failed: ${res.statusText}`);
    }
    return data;
  }
}
