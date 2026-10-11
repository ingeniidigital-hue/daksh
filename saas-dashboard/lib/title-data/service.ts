import {
  TitleDataItem,
  TitleDataScope,
  GetTitleDataRequest,
  GetTitleDataResponse,
  SetTitleDataRequest,
  LootTable,
  RollLootDropRequest,
  LootDropResult
} from "./types";
import {
  getRawTitleDataStore,
  getRawLootTableStore,
  SERVER_MASTER_SECRET
} from "./store";
import { rollFromLootTable } from "./loot-tables";

export class TitleDataService {
  /**
   * Retrieves Key-Value Title Data configs with sub-millisecond retrieval.
   * Strictly enforces public vs internal scope isolation.
   */
  static async getTitleData(req: GetTitleDataRequest): Promise<GetTitleDataResponse> {
    const scope: TitleDataScope = req.scope || "public";

    // Enforce server security on internal title data
    if (scope === "internal") {
      if (!req.secretKey || req.secretKey !== SERVER_MASTER_SECRET) {
        throw new Error("FORBIDDEN: Server authorization required for Internal Title Data");
      }
    }

    const store = getRawTitleDataStore();
    const resultData: Record<string, string> = {};
    const resultRevisions: Record<string, number> = {};

    const prefix = `${req.titleId}:${scope}:`;

    if (req.keys && req.keys.length > 0) {
      for (const k of req.keys) {
        const item = store.get(`${prefix}${k}`);
        if (item) {
          resultData[k] = item.value;
          resultRevisions[k] = item.revision;
        }
      }
    } else {
      for (const [storeKey, item] of store.entries()) {
        if (storeKey.startsWith(prefix)) {
          resultData[item.key] = item.value;
          resultRevisions[item.key] = item.revision;
        }
      }
    }

    return {
      titleId: req.titleId,
      scope,
      data: resultData,
      revisions: resultRevisions
    };
  }

  /**
   * Sets or updates a Title Data key with optional JSON validation and revision bump.
   */
  static async setTitleData(
    req: SetTitleDataRequest
  ): Promise<{ success: boolean; revision: number; item: TitleDataItem }> {
    const scope: TitleDataScope = req.scope || "public";

    if (!req.key || req.key.trim().length === 0) {
      throw new Error("INVALID_KEY: Key cannot be empty");
    }

    // JSON Validation
    if (req.validateJson) {
      try {
        JSON.parse(req.value);
      } catch (err: any) {
        throw new Error(`MALFORMED_JSON: Value must be valid JSON: ${err.message}`);
      }
    }

    const store = getRawTitleDataStore();
    const storeKey = `${req.titleId}:${scope}:${req.key}`;
    const existing = store.get(storeKey);

    const revision = existing ? existing.revision + 1 : 1;
    const item: TitleDataItem = {
      titleId: req.titleId,
      key: req.key,
      scope,
      value: req.value,
      revision,
      updatedAt: new Date().toISOString(),
      description: req.description || existing?.description
    };

    store.set(storeKey, item);

    return {
      success: true,
      revision,
      item
    };
  }

  /**
   * Deletes a Title Data key.
   */
  static async deleteTitleData(
    titleId: string,
    key: string,
    scope: TitleDataScope = "public"
  ): Promise<{ success: boolean }> {
    const store = getRawTitleDataStore();
    const storeKey = `${titleId}:${scope}:${key}`;
    const deleted = store.delete(storeKey);
    return { success: deleted };
  }

  /**
   * Lists all Title Data entries for Studio manager inspection.
   */
  static async listTitleData(titleId: string, scope?: TitleDataScope): Promise<TitleDataItem[]> {
    const store = getRawTitleDataStore();
    const items: TitleDataItem[] = [];

    for (const [storeKey, item] of store.entries()) {
      if (item.titleId === titleId) {
        if (!scope || item.scope === scope) {
          items.push(item);
        }
      }
    }

    return items.sort((a, b) => a.key.localeCompare(b.key));
  }

  /**
   * Registers or updates a loot drop table.
   */
  static async registerLootTable(table: Omit<LootTable, "updatedAt">): Promise<LootTable> {
    if (!table.entries || table.entries.length === 0) {
      throw new Error("Loot table must have at least one entry");
    }

    const fullTable: LootTable = {
      ...table,
      updatedAt: new Date().toISOString()
    };

    const store = getRawLootTableStore();
    store.set(`${table.titleId}:${table.tableId}`, fullTable);
    return fullTable;
  }

  /**
   * Retrieves a single loot drop table.
   */
  static async getLootTable(titleId: string, tableId: string): Promise<LootTable | null> {
    const store = getRawLootTableStore();
    return store.get(`${titleId}:${tableId}`) || null;
  }

  /**
   * Lists all loot tables for a title.
   */
  static async listLootTables(titleId: string): Promise<LootTable[]> {
    const store = getRawLootTableStore();
    const tables: LootTable[] = [];

    for (const [key, table] of store.entries()) {
      if (table.titleId === titleId) {
        tables.push(table);
      }
    }

    return tables;
  }

  /**
   * Rolls a drop from a configured loot table using cryptographically secure RNG.
   */
  static async rollLootDrop(req: RollLootDropRequest): Promise<LootDropResult> {
    const table = await this.getLootTable(req.titleId, req.tableId);
    if (!table) {
      throw new Error(`LOOT_TABLE_NOT_FOUND: Table '${req.tableId}' not found for title '${req.titleId}'`);
    }

    return rollFromLootTable(table, {
      pityCounter: req.pityCounter,
      pityThreshold: req.pityThreshold,
      pityGuaranteedRarity: req.pityGuaranteedRarity
    });
  }
}
