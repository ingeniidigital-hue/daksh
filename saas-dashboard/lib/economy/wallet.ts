/**
 * Wallet Manager: Implements row-level locking and atomic balance updates.
 * Guarantees zero double-spending under concurrent requests and enforces CHECK (balance >= 0).
 */

const walletsDb = new Map<string, number>(); // key: `${titleId}:${playerId}:${currencyCode}`
const lockQueues = new Map<string, Promise<void>>(); // key: `${titleId}:${playerId}`

function getWalletKey(titleId: string, playerId: string, currencyCode: string): string {
  return `${titleId}:${playerId}:${currencyCode.toUpperCase()}`;
}

function getLockKey(titleId: string, playerId: string): string {
  return `${titleId}:${playerId}`;
}

export function resetWalletsStorage() {
  walletsDb.clear();
  lockQueues.clear();
}

/**
 * Returns current wallet balance for a currency.
 */
export function getWalletBalance(titleId: string, playerId: string, currencyCode: string): number {
  const key = getWalletKey(titleId, playerId, currencyCode);
  return walletsDb.get(key) || 0;
}

/**
 * Credits a player wallet.
 */
export function creditWallet(titleId: string, playerId: string, currencyCode: string, amount: number): number {
  if (amount < 0) throw new Error("Credit amount must be positive");
  const key = getWalletKey(titleId, playerId, currencyCode);
  const current = walletsDb.get(key) || 0;
  const updated = current + amount;
  walletsDb.set(key, updated);
  return updated;
}

/**
 * Executes a callback inside an exclusive transaction lock for the player.
 * Equivalent to PostgreSQL "BEGIN ... SELECT balance FROM player_wallets WHERE player_id = $1 FOR UPDATE"
 */
export async function withPlayerRowLock<T>(
  titleId: string,
  playerId: string,
  fn: () => Promise<T>
): Promise<T> {
  const lockKey = getLockKey(titleId, playerId);

  // Queue up operations sequentially per player
  const currentLock = lockQueues.get(lockKey) || Promise.resolve();

  let releaseLock: () => void;
  const nextLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  lockQueues.set(lockKey, currentLock.then(() => nextLock));

  try {
    await currentLock;
    return await fn();
  } finally {
    releaseLock!();
  }
}

/**
 * Atomically checks and deducts balance if sufficient funds exist.
 * Returns true if deduction succeeded, false if insufficient funds.
 */
export function tryDeductFunds(
  titleId: string,
  playerId: string,
  currencyCode: string,
  amount: number
): { success: boolean; newBalance: number } {
  const key = getWalletKey(titleId, playerId, currencyCode);
  const current = walletsDb.get(key) || 0;

  if (current < amount) {
    return { success: false, newBalance: current };
  }

  const updated = current - amount;
  walletsDb.set(key, updated);
  return { success: true, newBalance: updated };
}

/**
 * Gets all wallet balances for a player.
 */
export function getAllPlayerWallets(titleId: string, playerId: string): Record<string, number> {
  const prefix = `${titleId}:${playerId}:`;
  const result: Record<string, number> = {};
  for (const [key, balance] of walletsDb.entries()) {
    if (key.startsWith(prefix)) {
      const curr = key.substring(prefix.length);
      result[curr] = balance;
    }
  }
  return result;
}
