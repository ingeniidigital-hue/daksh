import crypto from "crypto";
import { ActionReportRequest, ActionReportResult } from "./types";
import { EconomyService, getWalletBalance } from "../economy";

const idempotencyStore = new Map<string, ActionReportResult>();
const SERVER_HMAC_SECRET = process.env.DAKSH_HMAC_SECRET || "daksh_server_authoritative_signing_key_32";

export function resetActionReportStore() {
  idempotencyStore.clear();
}

export class ActionReportingService {
  public static async processActionReport(
    titleId: string,
    req: ActionReportRequest
  ): Promise<ActionReportResult> {
    const actionId = req.actionId || `act_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const idempotencyKey = req.idempotencyKey || `idem_${actionId}`;

    // 1. Idempotency Check (Never re-execute duplicate actions)
    const idempotencyCacheKey = `${titleId}:${idempotencyKey}`;
    const cached = idempotencyStore.get(idempotencyCacheKey);
    if (cached) {
      return { ...cached, isDeduped: true };
    }

    const context = req.context || {};

    // 2. Anti-Cheat Precondition Validation (Never trust client claims)
    if (req.actionType === "DUNGEON_CLEARED") {
      if (context.completionTimeSeconds !== undefined && Number(context.completionTimeSeconds) < 15) {
        return {
          success: false,
          actionId,
          actionType: req.actionType,
          antiCheatFlagged: true,
          error: "EXPLOIT_DETECTED: Impossible dungeon completion duration (< 15 seconds)"
        };
      }
    }

    if (req.actionType === "BOSS_DEFEATED") {
      if (context.damageDealt !== undefined && Number(context.damageDealt) < 50) {
        return {
          success: false,
          actionId,
          actionType: req.actionType,
          antiCheatFlagged: true,
          error: "EXPLOIT_DETECTED: Insufficient player damage dealt to qualify for boss defeat"
        };
      }
    }

    // 3. Server-Authoritative Reward Calculation (Server decides what to grant)
    let grantedGold = 0;
    let grantedXp = 0;
    const grantedItems: Array<{ itemId: string; name: string; quantity: number }> = [];

    switch (req.actionType) {
      case "DUNGEON_CLEARED":
        grantedGold = 150 + Math.min(100, Math.floor(Number(context.monstersKilled || 0) * 10));
        grantedXp = 300;
        break;

      case "BOSS_DEFEATED":
        grantedGold = 500;
        grantedXp = 1000;
        grantedItems.push({ itemId: "boss_trophy", name: "Vanquisher Trophy", quantity: 1 });
        break;

      case "DAILY_LOGIN":
        grantedGold = 50;
        grantedXp = 50;
        break;

      default:
        grantedGold = 25;
        grantedXp = 25;
        break;
    }

    // 4. Server-Side State Mutation (Server credits wallet directly)
    if (grantedGold > 0) {
      EconomyService.creditWallet(titleId, req.playerId, "GOLD", grantedGold);
    }

    const currentGold = getWalletBalance(titleId, req.playerId, "GOLD");

    // 5. Cryptographic Proof Signing
    const outcomeData = `${titleId}:${req.playerId}:${actionId}:${grantedGold}:${grantedXp}:${Date.now()}`;
    const serverSignature = crypto
      .createHmac("sha256", SERVER_HMAC_SECRET)
      .update(outcomeData)
      .digest("hex");

    const result: ActionReportResult = {
      success: true,
      actionId,
      actionType: req.actionType,
      isDeduped: false,
      grantedRewards: {
        gold: grantedGold,
        xp: grantedXp,
        items: grantedItems
      },
      newBalances: {
        GOLD: currentGold
      },
      serverSignature
    };

    idempotencyStore.set(idempotencyCacheKey, result);
    return result;
  }
}
