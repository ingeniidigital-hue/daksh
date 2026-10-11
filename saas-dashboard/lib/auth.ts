import crypto from "crypto";

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
}

export interface AuthResult {
  token: string;
  isNewPlayer: boolean;
  player: Player;
}

export interface TokenVerificationResult {
  valid: boolean;
  payload?: any;
  error?: "INVALID_SIGNATURE" | "TOKEN_EXPIRED" | "PLAYER_BANNED" | "MALFORMED_TOKEN";
}

// In-memory player database partitioned by titleId
const titlePlayersDb = new Map<string, Map<string, Player>>();

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
 * Authenticates a device ID, creates or retrieves player profile, and issues JWT.
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
      inventory: []
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

  return {
    token,
    isNewPlayer,
    player
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
