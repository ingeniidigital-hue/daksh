import crypto from "crypto";

export interface LinkedAccount {
  provider: "Steam" | "Google" | "Apple" | "Email";
  providerId: string;
  linkedAt: string;
}

export interface Player {
  id: string;
  titleId: string;
  deviceId: string;
  username: string;
  status: "Active" | "Banned" | "Suspended";
  clientPlatform: string;
  createdAt: string;
  lastLoginAt: string;
  wallet: Record<string, number>;
  inventory: any[];
  linkedAccounts: LinkedAccount[];
}

export interface RefreshTokenRecord {
  token: string;
  titleId: string;
  playerId: string;
  deviceId: string;
  expiresAt: number; // UNIX timestamp
  isRevoked: boolean;
}

export interface AuthResult {
  token: string;
  refreshToken: string;
  expiresIn: number; // in seconds (7200)
  isNewPlayer: boolean;
  player: Player;
}

export interface TokenVerificationResult {
  valid: boolean;
  payload?: any;
  error?: "INVALID_SIGNATURE" | "TOKEN_EXPIRED" | "PLAYER_BANNED" | "MALFORMED_TOKEN";
}

export interface LinkAccountParams {
  titleId: string;
  playerId: string;
  provider: "Steam" | "Google" | "Apple" | "Email";
  providerId: string;
  conflictResolution?: "ABORT" | "SWITCH_ACCOUNT" | "MERGE_PROFILES";
}

export interface LinkAccountResult {
  success: boolean;
  conflict?: boolean;
  resolutionApplied?: "LINKED" | "SWITCHED" | "MERGED";
  player: Player;
  token?: string;
  refreshToken?: string;
  conflictDetails?: {
    conflictingPlayerId: string;
    conflictingUsername: string;
    conflictingWallet: Record<string, number>;
  };
}

// In-memory player database partitioned by titleId
const titlePlayersDb = new Map<string, Map<string, Player>>();

// Refresh tokens registry: key = `${titleId}:${refreshToken}`
const refreshTokensDb = new Map<string, RefreshTokenRecord>();

// Deterministic Ed25519 Keypair for test & local environment
let cachedKeyPair: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject } | null = null;

export function generateEd25519KeyPair() {
  if (!cachedKeyPair) {
    cachedKeyPair = crypto.generateKeyPairSync("ed25519");
  }
  return cachedKeyPair;
}

export function clearPlayerStorage() {
  titlePlayersDb.clear();
  refreshTokensDb.clear();
}

function getTitleStore(titleId: string): Map<string, Player> {
  if (!titlePlayersDb.has(titleId)) {
    titlePlayersDb.set(titleId, new Map());
  }
  return titlePlayersDb.get(titleId)!;
}

/**
 * Issues an Ed25519 signed JWT token with 2-hour expiration.
 */
export async function signPlayerJwt(payload: Record<string, any>): Promise<string> {
  const { privateKey } = generateEd25519KeyPair();

  const header = {
    alg: "EdDSA",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: "daksh.io",
    iat: now,
    exp: now + 7200, // 2 hours
    ...payload
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString("base64url");
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.sign(null, Buffer.from(dataToSign), privateKey);
  const encodedSignature = signature.toString("base64url");

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Generates and stores a cryptographically random refresh token (30-day sliding expiry).
 */
export function issueRefreshToken(titleId: string, playerId: string, deviceId: string): string {
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const token = `rt_${randomBytes}`;
  const now = Math.floor(Date.now() / 1000);

  const record: RefreshTokenRecord = {
    token,
    titleId,
    playerId,
    deviceId,
    expiresAt: now + 30 * 86400, // 30 days
    isRevoked: false
  };

  refreshTokensDb.set(`${titleId}:${token}`, record);
  return token;
}

/**
 * Rotates an existing refresh token and issues a fresh 2-hour Ed25519 JWT.
 * Implements strict Refresh Token Rotation (RTR) to prevent token reuse attacks.
 */
export async function rotateRefreshToken(titleId: string, oldRefreshToken: string): Promise<{
  token: string;
  refreshToken: string;
  player: Player;
}> {
  const key = `${titleId}:${oldRefreshToken}`;
  const record = refreshTokensDb.get(key);

  if (!record || record.isRevoked) {
    throw new Error("INVALID_OR_REVOKED_REFRESH_TOKEN");
  }

  const now = Math.floor(Date.now() / 1000);
  if (record.expiresAt < now) {
    throw new Error("REFRESH_TOKEN_EXPIRED");
  }

  const store = getTitleStore(titleId);
  const player = Array.from(store.values()).find(p => p.id === record.playerId);
  if (!player) {
    throw new Error("PLAYER_NOT_FOUND");
  }

  if (player.status === "Banned") {
    throw new Error("PLAYER_BANNED");
  }

  // 1. Revoke the old refresh token (prevents replay)
  record.isRevoked = true;

  // 2. Issue rotated refresh token
  const newRefreshToken = issueRefreshToken(titleId, player.id, record.deviceId);

  // 3. Issue fresh 2-hour JWT
  const token = await signPlayerJwt({
    sub: player.id,
    titleId: player.titleId,
    deviceId: player.deviceId,
    username: player.username
  });

  return {
    token,
    refreshToken: newRefreshToken,
    player
  };
}

/**
 * Verifies an Ed25519 signed JWT token and checks if the player is banned.
 */
export async function verifyPlayerJwt(token: string): Promise<TokenVerificationResult> {
  const { publicKey } = generateEd25519KeyPair();

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "MALFORMED_TOKEN" };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;
  const signature = Buffer.from(encodedSignature, "base64url");

  // Verify Ed25519 cryptographic signature
  const isVerified = crypto.verify(null, Buffer.from(dataToVerify), publicKey, signature);
  if (!isVerified) {
    return { valid: false, error: "INVALID_SIGNATURE" };
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "TOKEN_EXPIRED" };
    }

    // Check if player is banned in storage
    if (payload.titleId && payload.sub) {
      const store = getTitleStore(payload.titleId);
      const player = Array.from(store.values()).find(p => p.id === payload.sub);
      if (player && player.status === "Banned") {
        return { valid: false, error: "PLAYER_BANNED" };
      }
    }

    return { valid: true, payload };
  } catch (e) {
    return { valid: false, error: "MALFORMED_TOKEN" };
  }
}

/**
 * Authenticates a device ID, creates or retrieves player profile, and issues JWT + refresh token.
 */
export async function authenticateDevice(params: {
  titleId: string;
  deviceId: string;
  clientPlatform?: string;
  displayName?: string;
}): Promise<AuthResult> {
  const { titleId, deviceId, clientPlatform = "Unknown", displayName } = params;

  if (!deviceId || !deviceId.trim()) {
    throw new Error("deviceId cannot be blank");
  }

  const store = getTitleStore(titleId);

  // Check if player with this device ID exists for this title
  let player = store.get(deviceId);
  let isNewPlayer = false;

  if (!player) {
    isNewPlayer = true;
    const hash = crypto.createHash("sha256").update(`${titleId}:${deviceId}`).digest("hex");
    const playerId = `ply_${hash.substring(0, 8)}`;
    const randomGuestNum = Math.floor(1000 + Math.random() * 9000);

    player = {
      id: playerId,
      titleId,
      deviceId,
      username: displayName || `Guest_${randomGuestNum}`,
      status: "Active",
      clientPlatform,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      wallet: { "GOLD": 1000, "GEMS": 50 },
      inventory: [],
      linkedAccounts: []
    };
    store.set(deviceId, player);
  } else {
    // Update last login
    player.lastLoginAt = new Date().toISOString();
  }

  // Issue Ed25519 signed JWT
  const token = await signPlayerJwt({
    sub: player.id,
    titleId: player.titleId,
    deviceId: player.deviceId,
    username: player.username
  });

  // Issue cryptographic 30-day Refresh Token
  const refreshToken = issueRefreshToken(titleId, player.id, player.deviceId);

  return {
    token,
    refreshToken,
    expiresIn: 7200,
    isNewPlayer,
    player
  };
}

/**
 * Links a federated identity (Steam, Google, Apple, Email) with Conflict Resolution.
 */
export async function linkFederatedAccount(params: LinkAccountParams): Promise<LinkAccountResult> {
  const { titleId, playerId, provider, providerId, conflictResolution = "ABORT" } = params;
  const store = getTitleStore(titleId);

  const currentPlayer = Array.from(store.values()).find(p => p.id === playerId);
  if (!currentPlayer) {
    throw new Error(`Player ${playerId} not found`);
  }

  // Search if this providerId is already linked to ANY player in this title
  let conflictingPlayer: Player | undefined;
  for (const p of store.values()) {
    if (p.id !== playerId && p.linkedAccounts.some(l => l.provider === provider && l.providerId === providerId)) {
      conflictingPlayer = p;
      break;
    }
  }

  // 1. Conflict Detected
  if (conflictingPlayer) {
    if (conflictResolution === "ABORT") {
      return {
        success: false,
        conflict: true,
        player: currentPlayer,
        conflictDetails: {
          conflictingPlayerId: conflictingPlayer.id,
          conflictingUsername: conflictingPlayer.username,
          conflictingWallet: conflictingPlayer.wallet
        }
      };
    }

    if (conflictResolution === "SWITCH_ACCOUNT") {
      // Log the client into the existing conflicting master account
      const token = await signPlayerJwt({
        sub: conflictingPlayer.id,
        titleId: conflictingPlayer.titleId,
        deviceId: conflictingPlayer.deviceId,
        username: conflictingPlayer.username
      });
      const refreshToken = issueRefreshToken(titleId, conflictingPlayer.id, conflictingPlayer.deviceId);

      return {
        success: true,
        conflict: true,
        resolutionApplied: "SWITCHED",
        player: conflictingPlayer,
        token,
        refreshToken
      };
    }

    if (conflictResolution === "MERGE_PROFILES") {
      // Merge guest currencies into the master account
      for (const [curr, bal] of Object.entries(currentPlayer.wallet || {})) {
        conflictingPlayer.wallet[curr] = (conflictingPlayer.wallet[curr] || 0) + bal;
      }
      // Merge guest inventory into master account
      conflictingPlayer.inventory = [...conflictingPlayer.inventory, ...currentPlayer.inventory];

      // Re-point device to master account
      store.set(currentPlayer.deviceId, conflictingPlayer);

      const token = await signPlayerJwt({
        sub: conflictingPlayer.id,
        titleId: conflictingPlayer.titleId,
        deviceId: conflictingPlayer.deviceId,
        username: conflictingPlayer.username
      });
      const refreshToken = issueRefreshToken(titleId, conflictingPlayer.id, conflictingPlayer.deviceId);

      return {
        success: true,
        conflict: true,
        resolutionApplied: "MERGED",
        player: conflictingPlayer,
        token,
        refreshToken
      };
    }
  }

  // 2. No conflict: Link seamlessly
  const existingLinkIndex = currentPlayer.linkedAccounts.findIndex(l => l.provider === provider);
  if (existingLinkIndex >= 0) {
    currentPlayer.linkedAccounts[existingLinkIndex].providerId = providerId;
    currentPlayer.linkedAccounts[existingLinkIndex].linkedAt = new Date().toISOString();
  } else {
    currentPlayer.linkedAccounts.push({
      provider,
      providerId,
      linkedAt: new Date().toISOString()
    });
  }

  return {
    success: true,
    conflict: false,
    resolutionApplied: "LINKED",
    player: currentPlayer
  };
}

/**
 * Lists all players registered for a given game title.
 */
export async function listTitlePlayers(titleId: string): Promise<Player[]> {
  const store = getTitleStore(titleId);
  return Array.from(store.values());
}

/**
 * Permanently deletes a player profile (Right to be Forgotten / DPDP compliance).
 */
export async function deletePlayerRightToBeForgotten(titleId: string, playerId: string): Promise<boolean> {
  const store = getTitleStore(titleId);
  for (const [deviceId, player] of store.entries()) {
    if (player.id === playerId) {
      store.delete(deviceId);
      return true;
    }
  }
  return false;
}

/**
 * Sets player moderation status (Active, Banned, Suspended).
 */
export async function setPlayerStatus(
  titleId: string,
  playerId: string,
  status: "Active" | "Banned" | "Suspended"
): Promise<Player> {
  const store = getTitleStore(titleId);
  for (const player of store.values()) {
    if (player.id === playerId) {
      player.status = status;
      return player;
    }
  }
  throw new Error(`Player ${playerId} not found`);
}
