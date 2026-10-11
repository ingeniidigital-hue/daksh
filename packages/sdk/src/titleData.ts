export interface TitleDataCacheEntry {
  data: Record<string, string>;
  revisions: Record<string, number>;
  cachedAt: number;
}

export interface GetTitleDataParams {
  titleId: string;
  keys?: string[];
  scope?: 'public' | 'internal';
  secretKey?: string;
  bypassCache?: boolean;
  endpoint?: string;
}

export interface RollLootDropParams {
  titleId: string;
  tableId: string;
  pityCounter?: number;
  pityThreshold?: number;
  pityGuaranteedRarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  endpoint?: string;
}

export class DakshTitleData {
  private static cache = new Map<string, TitleDataCacheEntry>();
  public static cacheTTLMs = 60 * 1000; // 60s default cache TTL

  /**
   * Retrieves Key-Value Remote Config Title Data with local memory caching.
   * Responses return in <20ms.
   */
  public static async getTitleDataAsync(params: GetTitleDataParams): Promise<{
    titleId: string;
    scope: string;
    data: Record<string, string>;
    revisions: Record<string, number>;
    isFromCache: boolean;
  }> {
    const endpoint = params.endpoint || "http://localhost:3000";
    const scope = params.scope || "public";
    const cacheKey = `${params.titleId}:${scope}:${(params.keys || []).sort().join(",")}`;

    const now = Date.now();
    const cached = this.cache.get(cacheKey);

    if (!params.bypassCache && cached && now - cached.cachedAt < this.cacheTTLMs) {
      return {
        titleId: params.titleId,
        scope,
        data: { ...cached.data },
        revisions: { ...cached.revisions },
        isFromCache: true
      };
    }

    const query = new URLSearchParams();
    query.set("scope", scope);
    if (params.keys && params.keys.length > 0) {
      query.set("keys", params.keys.join(","));
    }

    const headers: Record<string, string> = {};
    if (params.secretKey) {
      headers["x-secret-key"] = params.secretKey;
    }

    const url = `${endpoint}/api/titles/${params.titleId}/title-data?${query.toString()}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`[Daksh.TitleData] Failed to get Title Data: ${err.error || res.statusText}`);
    }

    const result = await res.json();

    this.cache.set(cacheKey, {
      data: result.data,
      revisions: result.revisions,
      cachedAt: now
    });

    return {
      titleId: result.titleId,
      scope: result.scope,
      data: result.data,
      revisions: result.revisions,
      isFromCache: false
    };
  }

  /**
   * Rolls a drop from a server-side loot table with cryptographic RNG.
   */
  public static async rollLootDropAsync(params: RollLootDropParams) {
    const endpoint = params.endpoint || "http://localhost:3000";
    const url = `${endpoint}/api/titles/${params.titleId}/title-data/loot-drop`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: params.tableId,
        pityCounter: params.pityCounter,
        pityThreshold: params.pityThreshold,
        pityGuaranteedRarity: params.pityGuaranteedRarity
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`[Daksh.TitleData] Loot drop failed: ${err.error || res.statusText}`);
    }

    return await res.json();
  }

  public static clearCache(): void {
    this.cache.clear();
  }
}
