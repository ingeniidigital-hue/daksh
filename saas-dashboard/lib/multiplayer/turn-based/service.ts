import {
  TurnBasedMatch,
  CreateMatchRequest,
  SubmitMoveRequest,
  TurnMove
} from "./types";
import { saveMatchInMemory, getMatchFromMemory, listMatchesInMemory } from "./store";
import { validateAndApplyMove } from "./state-machine";
import { EconomyService } from "../../economy/service";

export class TurnBasedMatchService {
  /**
   * Creates an in-memory turn-based match room.
   * Wagers are deducted at match start and persisted once.
   */
  public static async createMatch(req: CreateMatchRequest): Promise<TurnBasedMatch> {
    if (!req.players || req.players.length < 2) {
      throw new Error("INVALID_PLAYERS: At least 2 players required for turn-based match");
    }

    const matchId = `match_tb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    // Deduct wagers if present
    if (req.wagerAmount && req.wagerAmount > 0 && req.currencyCode) {
      for (const p of req.players) {
        EconomyService.deductWallet(req.titleId, p, req.currencyCode, req.wagerAmount);
      }
    }

    const match: TurnBasedMatch = {
      matchId,
      titleId: req.titleId,
      status: "ACTIVE",
      players: [...req.players],
      activeTurnPlayerId: req.players[0],
      turnNumber: 1,
      turnTimeoutSeconds: req.turnTimeoutSeconds || 30,
      turnStartedAt: now,
      boardState: [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      moveHistory: [],
      winnerId: null,
      loserId: null,
      resolutionReason: null,
      wagerAmount: req.wagerAmount,
      currencyCode: req.currencyCode,
      onPersistenceWrite: req.onPersistenceWrite,
      createdAt: now,
      updatedAt: now
    };

    // Initial persistence write (Match Start)
    if (match.onPersistenceWrite) {
      match.onPersistenceWrite();
    }

    saveMatchInMemory(match);
    return match;
  }

  /**
   * Retrieves live match state from in-memory room ($0 compute).
   */
  public static async getMatch(matchId: string): Promise<TurnBasedMatch | null> {
    return getMatchFromMemory(matchId);
  }

  /**
   * Submits a move server-authoritatively in <10ms.
   * Dispatches updates and commits to DB only upon win/completion.
   */
  public static async submitMove(
    req: SubmitMoveRequest
  ): Promise<{ success: boolean; match: TurnBasedMatch; move: TurnMove }> {
    const match = getMatchFromMemory(req.matchId);
    if (!match) {
      throw new Error(`MATCH_NOT_FOUND: Match '${req.matchId}' does not exist`);
    }

    const { match: updatedMatch, move, isWin, isDraw } = validateAndApplyMove(
      match,
      req.playerId,
      req.move
    );

    // If game concluded, atomically settle rewards & commit final persistence
    if (isWin && updatedMatch.winnerId) {
      if (updatedMatch.wagerAmount && updatedMatch.wagerAmount > 0 && updatedMatch.currencyCode) {
        const totalPot = updatedMatch.wagerAmount * updatedMatch.players.length;
        EconomyService.creditWallet(
          updatedMatch.titleId,
          updatedMatch.winnerId,
          updatedMatch.currencyCode,
          totalPot
        );
      }

      if (updatedMatch.onPersistenceWrite) {
        updatedMatch.onPersistenceWrite();
      }
    } else if (isDraw) {
      // Refund wagers on draw
      if (updatedMatch.wagerAmount && updatedMatch.wagerAmount > 0 && updatedMatch.currencyCode) {
        for (const p of updatedMatch.players) {
          EconomyService.creditWallet(
            updatedMatch.titleId,
            p,
            updatedMatch.currencyCode,
            updatedMatch.wagerAmount
          );
        }
      }

      if (updatedMatch.onPersistenceWrite) {
        updatedMatch.onPersistenceWrite();
      }
    }

    saveMatchInMemory(updatedMatch);

    return {
      success: true,
      match: updatedMatch,
      move
    };
  }

  /**
   * Watchdog timer checking for turn timeout. Triggers automated forfeit if expired.
   */
  public static async checkTurnTimeoutWatchdog(
    matchId: string,
    currentTime: number = Date.now()
  ): Promise<{ triggered: boolean; match: TurnBasedMatch }> {
    const match = getMatchFromMemory(matchId);
    if (!match || match.status !== "ACTIVE") {
      return { triggered: false, match: match! };
    }

    const elapsedMs = currentTime - match.turnStartedAt;
    const timeoutMs = match.turnTimeoutSeconds * 1000;

    if (elapsedMs >= timeoutMs) {
      // Forfeit active turn player
      const timedOutPlayer = match.activeTurnPlayerId;
      const winner = match.players.find(p => p !== timedOutPlayer) || match.players[0];

      match.status = "FORFEIT";
      match.winnerId = winner;
      match.loserId = timedOutPlayer;
      match.resolutionReason = "TIMEOUT_FORFEIT";
      match.updatedAt = currentTime;

      // Settle pot to winner
      if (match.wagerAmount && match.wagerAmount > 0 && match.currencyCode) {
        const pot = match.wagerAmount * match.players.length;
        EconomyService.creditWallet(match.titleId, winner, match.currencyCode, pot);
      }

      if (match.onPersistenceWrite) {
        match.onPersistenceWrite();
      }

      saveMatchInMemory(match);
      return { triggered: true, match };
    }

    return { triggered: false, match };
  }

  public static async listMatches(titleId?: string): Promise<TurnBasedMatch[]> {
    return listMatchesInMemory(titleId);
  }
}
