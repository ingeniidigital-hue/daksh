export interface ActionReportRequest {
  actionId?: string;
  playerId: string;
  actionType: string; // e.g. "DUNGEON_CLEARED", "BOSS_DEFEATED", "QUEST_STEP_COMPLETED", "DAILY_LOGIN"
  context?: Record<string, any>; // e.g. { completionTimeSeconds: 120, dungeonId: "crypt_01" }
  idempotencyKey?: string;
  timestamp?: number;
}

export interface ServerGrantedItem {
  itemId: string;
  name: string;
  quantity: number;
}

export interface ActionReportResult {
  success: boolean;
  actionId: string;
  actionType: string;
  isDeduped?: boolean;
  error?: string;
  antiCheatFlagged?: boolean;
  grantedRewards?: {
    gold?: number;
    xp?: number;
    items?: ServerGrantedItem[];
  };
  newBalances?: Record<string, number>;
  serverSignature?: string;
}
