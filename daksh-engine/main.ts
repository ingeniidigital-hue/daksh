/**
 * Daksh Game BaaS - Nakama Authoritative Server Runtime
 * Provides authoritative RPCs, authentication lifecycle hooks, atomic wallet operations,
 * remote config title data, leaderboards, and real-time relay / turn-based match loops.
 */

// Global InitModule entrypoint required by Nakama
let InitModule: nkruntime.InitModule = function(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  initializer: nkruntime.Initializer
) {
  logger.info("=========================================");
  logger.info("🚀 DAKSH GAME BAAS NAKAMA RUNTIME ONLINE");
  logger.info("=========================================");

  // 1. Initialize Default Global Leaderboards
  try {
    const leaderboardId = "global_highscores";
    const authoritative = true;
    const sortOrder = nkruntime.SortOrder.DESCENDING;
    const operator = nkruntime.Operator.BEST;
    const resetSchedule = "0 0 * * 0"; // Weekly Sunday midnight
    const metadata = { game: "daksh_core", season: 1 };
    
    nk.leaderboardCreate(leaderboardId, authoritative, sortOrder, operator, resetSchedule, metadata);
    logger.info("🏆 Created authoritative leaderboard: %s", leaderboardId);
  } catch (err: any) {
    logger.warn("Leaderboard already exists or initialization skipped: %s", err.message || err);
  }

  // 2. Register Authentication Lifecycle Hooks
  initializer.registerBeforeAuthenticateDevice(beforeAuthenticateDevice);
  initializer.registerAfterAuthenticateDevice(afterAuthenticateDevice);

  // 3. Register Core RPC Functions
  initializer.registerRpc("healthcheck", rpcHealthcheck);
  initializer.registerRpc("daksh_authenticate_device", rpcAuthenticateDevice);
  initializer.registerRpc("daksh_wallet_transaction", rpcWalletTransaction);
  initializer.registerRpc("daksh_purchase_item", rpcPurchaseItem);
  initializer.registerRpc("daksh_get_inventory", rpcGetInventory);
  initializer.registerRpc("daksh_title_data_get", rpcTitleDataGet);
  initializer.registerRpc("daksh_title_data_set", rpcTitleDataSet);
  initializer.registerRpc("daksh_leaderboard_submit", rpcLeaderboardSubmit);

  // 4. Register Real-Time Relay Match Engine (30 Hz Tick Rate)
  initializer.registerMatch("daksh_relay", {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal
  });

  logger.info("✅ All Daksh RPCs and match handlers successfully registered.");
};

// -----------------------------------------------------------------------------
// Authentication Hooks
// -----------------------------------------------------------------------------

function beforeAuthenticateDevice(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  data: nkruntime.AuthenticateDeviceRequest
): nkruntime.AuthenticateDeviceRequest {
  if (!data || !data.account || !data.account.id) {
    throw new Error("Device ID cannot be empty");
  }
  // Enforce lowercase deterministic device ID
  data.account.id = data.account.id.trim().toLowerCase();
  return data;
}

function afterAuthenticateDevice(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  data: nkruntime.Session
) {
  // If brand new account, initialize default player wallet
  if (data.created) {
    const userId = ctx.userId || "";
    if (userId) {
      try {
        const changeset = { "GOLD": 1000, "GEMS": 50 };
        const metadata = { reason: "starter_pack_registration" };
        nk.walletUpdate(userId, changeset, metadata, true);
        logger.info("🎉 Seeded starter wallet for new player: %s", userId);
      } catch (e: any) {
        logger.error("Failed to seed initial wallet: %s", e.message);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// RPC Functions
// -----------------------------------------------------------------------------

function rpcHealthcheck(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  payload: string
): string {
  return JSON.stringify({
    status: "ok",
    node: ctx.node || "daksh-node-1",
    version: ctx.version || "3.22.0",
    engine: "Nakama + Daksh BaaS Hybrid Runtime",
    timestamp: Date.now()
  });
}

function rpcAuthenticateDevice(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  payload: string
): string {
  const req = JSON.parse(payload || "{}");
  const deviceId = req.deviceId;
  if (!deviceId) throw new Error("deviceId is required");

  // Create or retrieve device authenticated session (id, username, create)
  const account = nk.authenticateDevice(deviceId, req.username || undefined, true);
  return JSON.stringify({
    userId: account.userId,
    username: account.username,
    created: account.created
  });
}

function rpcWalletTransaction(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  payload: string
): string {
  const userId = ctx.userId;
  if (!userId) throw new Error("Authentication required");

  const req = JSON.parse(payload || "{}");
  const currencyCode = req.currencyCode || "GOLD";
  const amount = Number(req.amount) || 0;
  const reason = req.reason || "custom_rpc_transaction";

  const changeset: Record<string, number> = {};
  changeset[currencyCode] = amount;

  const result = nk.walletUpdate(userId, changeset, { reason }, true);
  return JSON.stringify({
    success: true,
    currencyCode,
    updatedWallet: result
  });
}

function rpcPurchaseItem(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  payload: string
): string {
  const userId = ctx.userId;
  if (!userId) throw new Error("Authentication required");

  const req = JSON.parse(payload || "{}");
  const itemId = req.itemId;
  const price = Number(req.price) || 100;
  const currencyCode = req.currencyCode || "GOLD";

  // 1. Deduct currency atomically
  const changeset: Record<string, number> = {};
  changeset[currencyCode] = -Math.abs(price);
  nk.walletUpdate(userId, changeset, { action: "purchase_item", itemId }, true);

  // 2. Write granted item instance to player inventory collection
  const instanceId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const writeOp: nkruntime.StorageWriteRequest = {
    collection: "player_inventory",
    key: instanceId,
    userId: userId,
    value: {
      itemId,
      acquiredAt: new Date().toISOString(),
      customData: req.customData || {}
    },
    permissionRead: 1, // Owner read
    permissionWrite: 0 // Server authoritative only
  };

  nk.storageWrite([writeOp]);

  return JSON.stringify({
    success: true,
    instanceId,
    itemId,
    price,
    currencyCode
  });
}

function rpcGetInventory(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  payload: string
): string {
  const userId = ctx.userId;
  if (!userId) throw new Error("Authentication required");

  const objects = nk.storageList(userId, "player_inventory", 100);
  const items = objects && objects.objects ? objects.objects.map(obj => ({
    key: obj.key,
    value: obj.value,
    version: obj.version
  })) : [];
  return JSON.stringify({ inventory: items });
}

function rpcTitleDataGet(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  payload: string
): string {
  const req = JSON.parse(payload || "{}");
  const keys = req.keys || [];

  const readRequests = keys.map((key: string) => ({
    collection: "title_data",
    key,
    userId: nkruntime.SystemUserId
  }));

  const records = nk.storageRead(readRequests);
  const data: Record<string, any> = {};
  for (const rec of records) {
    data[rec.key] = rec.value;
  }

  return JSON.stringify({ data });
}

function rpcTitleDataSet(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  payload: string
): string {
  const req = JSON.parse(payload || "{}");
  const key = req.key;
  const value = req.value;
  if (!key) throw new Error("Key is required");

  const writeOp: nkruntime.StorageWriteRequest = {
    collection: "title_data",
    key,
    userId: nkruntime.SystemUserId,
    value,
    permissionRead: 2, // Public read
    permissionWrite: 0 // Server only
  };

  nk.storageWrite([writeOp]);
  return JSON.stringify({ success: true, key });
}

function rpcLeaderboardSubmit(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  payload: string
): string {
  const userId = ctx.userId;
  if (!userId) throw new Error("Authentication required");

  const req = JSON.parse(payload || "{}");
  const leaderboardId = req.leaderboardId || "global_highscores";
  const score = Number(req.score) || 0;
  const username = ctx.username || "Anonymous";

  const record = nk.leaderboardRecordWrite(leaderboardId, userId, username, score, undefined, req.metadata || {});
  return JSON.stringify({
    success: true,
    leaderboardId,
    record
  });
}

// -----------------------------------------------------------------------------
// Real-Time Authoritative Relay Match Loop (30 Hz)
// -----------------------------------------------------------------------------

interface RelayMatchState {
  presences: { [userId: string]: nkruntime.Presence };
  tickRate: number;
  emptyTicks: number;
}

function matchInit(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  params: { [key: string]: string }
): { state: RelayMatchState; tickRate: number; label: string } {
  const tickRate = 30; // 30 Hz real-time dispatch
  return {
    state: {
      presences: {},
      tickRate,
      emptyTicks: 0
    },
    tickRate,
    label: params.label || "daksh_standard_relay"
  };
}

function matchJoinAttempt(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  dispatcher: nkruntime.MatchDispatcher, 
  tick: number, 
  state: RelayMatchState, 
  presence: nkruntime.Presence, 
  metadata: { [key: string]: any }
): { state: RelayMatchState; accept: boolean; rejectReason?: string } {
  // Allow maximum 32 players per relay room
  const currentCount = Object.keys(state.presences).length;
  if (currentCount >= 32) {
    return { state, accept: false, rejectReason: "Match is full (max 32)" };
  }
  return { state, accept: true };
}

function matchJoin(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  dispatcher: nkruntime.MatchDispatcher, 
  tick: number, 
  state: RelayMatchState, 
  presences: nkruntime.Presence[]
): { state: RelayMatchState } {
  for (const p of presences) {
    state.presences[p.userId] = p;
  }
  dispatcher.broadcastMessage(100, JSON.stringify({ event: "PLAYER_JOINED", presences }), null, null, true);
  return { state };
}

function matchLeave(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  dispatcher: nkruntime.MatchDispatcher, 
  tick: number, 
  state: RelayMatchState, 
  presences: nkruntime.Presence[]
): { state: RelayMatchState } | null {
  for (const p of presences) {
    delete state.presences[p.userId];
  }
  dispatcher.broadcastMessage(101, JSON.stringify({ event: "PLAYER_LEFT", presences }), null, null, true);
  return { state };
}

function matchLoop(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  dispatcher: nkruntime.MatchDispatcher, 
  tick: number, 
  state: RelayMatchState, 
  messages: nkruntime.MatchMessage[]
): { state: RelayMatchState } | null {
  // If match has been empty for >600 ticks (20s), cleanly terminate
  if (Object.keys(state.presences).length === 0) {
    state.emptyTicks++;
    if (state.emptyTicks > 600) {
      return null;
    }
  } else {
    state.emptyTicks = 0;
  }

  // Relay incoming packets to peers (opCode 1: movement, opCode 2: action, opCode 3: chat)
  for (const msg of messages) {
    dispatcher.broadcastMessage(msg.opCode, msg.data, null, msg.sender, false);
  }

  return { state };
}

function matchTerminate(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  dispatcher: nkruntime.MatchDispatcher, 
  tick: number, 
  state: RelayMatchState, 
  graceSeconds: number
): { state: RelayMatchState } | null {
  return null;
}

function matchSignal(
  ctx: nkruntime.Context, 
  logger: nkruntime.Logger, 
  nk: nkruntime.Nakama, 
  dispatcher: nkruntime.MatchDispatcher, 
  tick: number, 
  state: RelayMatchState, 
  data: string
): { state: RelayMatchState; data?: string } | null {
  return { state, data: "acknowledged" };
}
