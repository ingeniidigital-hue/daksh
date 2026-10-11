import { describe, it, expect, beforeEach } from "vitest";
import {
  LeaderboardService,
  resetLeaderboardStorage,
  AntiCheatViolationError
} from "../lib/leaderboards";
import {
  MatchmakingXRayService,
  resetXRayStorage
} from "../lib/multiplayer/xray";

describe("STORY-09 / TDD: Matchmaking X-Ray Admin Portal & Global Leaderboards", () => {
  const titleId = "TITLE_LEADERBOARD_01";
  const leaderboardId = "weekly_arena_trophies";

  beforeEach(() => {
    resetLeaderboardStorage();
    resetXRayStorage();
  });

  it("TEST-09-A [Happy Path]: Score submission updates ZSET and returns updated global rank in <5ms", async () => {
    // Initialize leaderboard
    await LeaderboardService.createLeaderboard({
      titleId,
      leaderboardId,
      name: "Weekly Arena Trophies",
      resetFrequency: "WEEKLY",
      sortOrder: "DESCENDING",
      maxScoreDelta: 2000
    });

    const start = performance.now();
    const result1 = await LeaderboardService.submitScore({
      titleId,
      leaderboardId,
      playerId: "player_phoenix",
      score: 2500
    });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5); // Sub-5ms execution
    expect(result1.rank).toBe(1);
    expect(result1.score).toBe(2500);
    expect(result1.totalPlayers).toBe(1);

    // Second player submits higher score
    const result2 = await LeaderboardService.submitScore({
      titleId,
      leaderboardId,
      playerId: "player_valkyrie",
      score: 3200
    });

    expect(result2.rank).toBe(1);
    expect(result2.score).toBe(3200);

    // Verify first player dropped to rank 2
    const rank1 = await LeaderboardService.getPlayerRank(titleId, leaderboardId, "player_phoenix");
    expect(rank1?.rank).toBe(2);
  });

  it("TEST-09-B [Tie-Breaking]: Two players with identical score of 5,000 are ranked deterministically by submission timestamp", async () => {
    await LeaderboardService.createLeaderboard({
      titleId,
      leaderboardId,
      name: "Weekly Arena Trophies",
      resetFrequency: "WEEKLY",
      sortOrder: "DESCENDING"
    });

    const baseTimestamp = 1700000000000;

    // Player Alpha submits 5000 first
    await LeaderboardService.submitScore({
      titleId,
      leaderboardId,
      playerId: "player_alpha",
      score: 5000,
      timestamp: baseTimestamp
    });

    // Player Beta submits 5000 500ms later
    await LeaderboardService.submitScore({
      titleId,
      leaderboardId,
      playerId: "player_beta",
      score: 5000,
      timestamp: baseTimestamp + 500
    });

    const rankAlpha = await LeaderboardService.getPlayerRank(titleId, leaderboardId, "player_alpha");
    const rankBeta = await LeaderboardService.getPlayerRank(titleId, leaderboardId, "player_beta");

    // Earlier submission takes higher rank (Rank 1)
    expect(rankAlpha?.rank).toBe(1);
    expect(rankBeta?.rank).toBe(2);

    // Verify top 2 entries
    const topEntries = await LeaderboardService.getTopScores(titleId, leaderboardId, 10);
    expect(topEntries.length).toBe(2);
    expect(topEntries[0].playerId).toBe("player_alpha");
    expect(topEntries[1].playerId).toBe("player_beta");
  });

  it("TEST-09-C [Live SSE Stream / Queue Telemetry]: Matchmaking X-Ray client receives real-time queue ticket counts via stream", async () => {
    let receivedPayload: any = null;

    const unsubscribe = MatchmakingXRayService.subscribeToTelemetry(titleId, payload => {
      receivedPayload = payload;
    });

    // Publish telemetry event from matchmaking queue
    MatchmakingXRayService.publishTelemetry(titleId, {
      activeQueuedTickets: 14,
      avgWaitTimeSeconds: 3.8,
      matchesFormedLastMinute: 6,
      regionalDistribution: { BOM: 8, FRA: 4, IAD: 2 }
    });

    expect(receivedPayload).not.toBeNull();
    expect(receivedPayload.activeQueuedTickets).toBe(14);
    expect(receivedPayload.avgWaitTimeSeconds).toBe(3.8);
    expect(receivedPayload.regionalDistribution.BOM).toBe(8);

    unsubscribe();
  });

  it("TEST-09-D [Anti-Cheat Failure Mode]: Score delta exceeding max theoretical rate is rejected with audit alert", async () => {
    await LeaderboardService.createLeaderboard({
      titleId,
      leaderboardId,
      name: "Weekly Arena Trophies",
      resetFrequency: "WEEKLY",
      sortOrder: "DESCENDING",
      maxScoreDelta: 1000 // Max allowed score jump per update
    });

    // Initial valid score
    await LeaderboardService.submitScore({
      titleId,
      leaderboardId,
      playerId: "suspicious_user",
      score: 1000
    });

    // Attempt impossible score jump: +49,000 delta
    await expect(
      LeaderboardService.submitScore({
        titleId,
        leaderboardId,
        playerId: "suspicious_user",
        score: 50000
      })
    ).rejects.toThrow(AntiCheatViolationError);

    // Verify score was NOT corrupted in the leaderboard
    const current = await LeaderboardService.getPlayerRank(titleId, leaderboardId, "suspicious_user");
    expect(current?.score).toBe(1000);

    // Verify audit alert was recorded
    const alerts = await LeaderboardService.getSecurityAlerts(titleId);
    expect(alerts.length).toBe(1);
    expect(alerts[0].playerId).toBe("suspicious_user");
    expect(alerts[0].reason).toContain("Score delta 49000 exceeds maximum allowable delta 1000");
  });

  it("TEST-09-E [500 Leaderboard Updates Gate]: 500 concurrent leaderboard updates processed deterministically under 200ms", async () => {
    await LeaderboardService.createLeaderboard({
      titleId,
      leaderboardId,
      name: "Load Test Board",
      resetFrequency: "ALL_TIME",
      sortOrder: "DESCENDING"
    });

    const start = performance.now();
    const promises: Promise<any>[] = [];

    for (let i = 0; i < 500; i++) {
      promises.push(
        LeaderboardService.submitScore({
          titleId,
          leaderboardId,
          playerId: `bot_${i}`,
          score: 1000 + i * 2, // Varied unique scores
          timestamp: Date.now() + i
        })
      );
    }

    await Promise.all(promises);
    const duration = performance.now() - start;
    console.log(`500 leaderboard submissions completed in ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(200);

    const top10 = await LeaderboardService.getTopScores(titleId, leaderboardId, 10);
    expect(top10.length).toBe(10);
    expect(top10[0].rank).toBe(1);
    expect(top10[0].playerId).toBe("bot_499");
    expect(top10[0].score).toBe(1000 + 499 * 2);
  });
});
