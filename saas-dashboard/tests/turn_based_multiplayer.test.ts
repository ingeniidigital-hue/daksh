import { describe, it, expect, beforeEach } from "vitest";
import {
  TurnBasedMatchService,
  resetTurnBasedStorage
} from "../lib/multiplayer/turn-based";
import { EconomyService, resetEconomyStorage } from "../lib/economy";

describe("STORY-06 / TDD: Turn-Based Multiplayer Engine (Sync/Async)", () => {
  const titleId = "TITLE_TB_01";
  const player1 = "ply_alice_01";
  const player2 = "ply_bob_02";

  beforeEach(() => {
    resetTurnBasedStorage();
    resetEconomyStorage();
    // Setup initial player wallets for match stakes/rewards
    EconomyService.creditWallet(titleId, player1, "GOLD", 100);
    EconomyService.creditWallet(titleId, player2, "GOLD", 100);
  });

  it("TEST-06-A [Happy Path]: Player 1 submits valid move; move broadcasts to Player 2 and active turn token switches in <10ms", async () => {
    // 1. Create a 2-player turn-based match (e.g. Tic-Tac-Toe / Chess / Grid)
    const match = await TurnBasedMatchService.createMatch({
      titleId,
      players: [player1, player2],
      turnTimeoutSeconds: 30,
      wagerAmount: 50,
      currencyCode: "GOLD"
    });

    expect(match.status).toBe("ACTIVE");
    expect(match.activeTurnPlayerId).toBe(player1);
    expect(match.turnNumber).toBe(1);
    expect(match.moveHistory.length).toBe(0);

    // 2. Player 1 submits move: place token at grid position (0,0)
    const start = performance.now();
    const result = await TurnBasedMatchService.submitMove({
      matchId: match.matchId,
      playerId: player1,
      move: { action: "PLACE_MARK", x: 0, y: 0 }
    });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10); // Sub-10ms in-memory response
    expect(result.success).toBe(true);
    expect(result.match.activeTurnPlayerId).toBe(player2); // Turn switched to Player 2
    expect(result.match.turnNumber).toBe(2);
    expect(result.match.moveHistory.length).toBe(1);
    expect(result.match.boardState[0][0]).toBe(player1);

    // 3. Player 2 submits reply move: place token at grid position (1,1)
    const replyResult = await TurnBasedMatchService.submitMove({
      matchId: match.matchId,
      playerId: player2,
      move: { action: "PLACE_MARK", x: 1, y: 1 }
    });

    expect(replyResult.success).toBe(true);
    expect(replyResult.match.activeTurnPlayerId).toBe(player1); // Turn back to Player 1
    expect(replyResult.match.turnNumber).toBe(3);
    expect(replyResult.match.boardState[1][1]).toBe(player2);
  });

  it("TEST-06-B [Timeout Forfeit]: Player 1 fails to submit move within turn countdown; server triggers forfeit and declares Player 2 winner", async () => {
    const match = await TurnBasedMatchService.createMatch({
      titleId,
      players: [player1, player2],
      turnTimeoutSeconds: 30,
      wagerAmount: 50,
      currencyCode: "GOLD"
    });

    expect(match.activeTurnPlayerId).toBe(player1);

    // Simulate clock jump forward 31 seconds past the 30s turn timeout limit
    const expiredTime = Date.now() + 31 * 1000;
    const forfeitResult = await TurnBasedMatchService.checkTurnTimeoutWatchdog(match.matchId, expiredTime);

    expect(forfeitResult.triggered).toBe(true);
    expect(forfeitResult.match.status).toBe("FORFEIT");
    expect(forfeitResult.match.winnerId).toBe(player2);
    expect(forfeitResult.match.loserId).toBe(player1);
    expect(forfeitResult.match.resolutionReason).toBe("TIMEOUT_FORFEIT");

    // Match rewards settled atomically: Player 2 gets the pot (+100 Gold)
    const p2Balance = EconomyService.getPlayerBalance(titleId, player2, "GOLD");
    expect(p2Balance).toBe(150); // Initial 100 - 50 wager + 100 reward
  });

  it("TEST-06-C [Failure Mode & Security]: Player 2 submits move out of turn; server rejects with NOT_YOUR_TURN and zero state change", async () => {
    const match = await TurnBasedMatchService.createMatch({
      titleId,
      players: [player1, player2],
      turnTimeoutSeconds: 30
    });

    // Player 1 has active turn; Player 2 attempts to move prematurely
    await expect(
      TurnBasedMatchService.submitMove({
        matchId: match.matchId,
        playerId: player2, // Out of turn!
        move: { action: "PLACE_MARK", x: 0, y: 0 }
      })
    ).rejects.toThrow("NOT_YOUR_TURN: It is currently ply_alice_01's turn");

    // Verify board remains untouched
    const freshMatch = await TurnBasedMatchService.getMatch(match.matchId);
    expect(freshMatch?.turnNumber).toBe(1);
    expect(freshMatch?.activeTurnPlayerId).toBe(player1);
    expect(freshMatch?.boardState[0][0]).toBeNull();

    // Player 1 tries to submit an invalid/illegal move (out-of-bounds coordinate)
    await expect(
      TurnBasedMatchService.submitMove({
        matchId: match.matchId,
        playerId: player1,
        move: { action: "PLACE_MARK", x: 99, y: 99 } // Out of bounds!
      })
    ).rejects.toThrow("ILLEGAL_MOVE: Position coordinates out of bounds");
  });

  it("TEST-06-D [Zero DB Writes & Atomic Win Commit]: Active moves execute in-memory; DB persistence is called only on match end", async () => {
    let dbWriteCount = 0;
    const dbTracker = () => { dbWriteCount++; };

    const match = await TurnBasedMatchService.createMatch({
      titleId,
      players: [player1, player2],
      turnTimeoutSeconds: 30,
      onPersistenceWrite: dbTracker
    });

    // Initial match creation write
    expect(dbWriteCount).toBe(1);

    // Play 4 in-memory moves without touching database
    await TurnBasedMatchService.submitMove({ matchId: match.matchId, playerId: player1, move: { action: "PLACE_MARK", x: 0, y: 0 } });
    await TurnBasedMatchService.submitMove({ matchId: match.matchId, playerId: player2, move: { action: "PLACE_MARK", x: 1, y: 0 } });
    await TurnBasedMatchService.submitMove({ matchId: match.matchId, playerId: player1, move: { action: "PLACE_MARK", x: 0, y: 1 } });
    await TurnBasedMatchService.submitMove({ matchId: match.matchId, playerId: player2, move: { action: "PLACE_MARK", x: 1, y: 1 } });

    // Zero additional DB writes during active moves!
    expect(dbWriteCount).toBe(1);

    // Winning move for Player 1: completes row (0,0), (0,1), (0,2)
    const winResult = await TurnBasedMatchService.submitMove({
      matchId: match.matchId,
      playerId: player1,
      move: { action: "PLACE_MARK", x: 0, y: 2 }
    });

    expect(winResult.match.status).toBe("RESOLVED");
    expect(winResult.match.winnerId).toBe(player1);
    expect(winResult.match.resolutionReason).toBe("WIN_CONDITION_MET");

    // Atomic win settlement commits final state to DB exactly once
    expect(dbWriteCount).toBe(2);
  });
});
