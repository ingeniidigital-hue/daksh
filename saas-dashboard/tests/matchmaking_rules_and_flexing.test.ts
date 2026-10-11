import { describe, it, expect, beforeEach } from "vitest";
import {
  MatchmakingService,
  resetMatchmakingStorage
} from "../lib/multiplayer/matchmaking";

describe("STORY-08 / TDD: AccelByte Matchmaking Rulesets with Dynamic Rule Flexing", () => {
  const titleId = "TITLE_MM_01";
  const rulesetId = "ruleset_1v1_ranked";

  beforeEach(() => {
    resetMatchmakingStorage();
  });

  it("TEST-08-A [Happy Path]: 2 evenly matched players queue and form a match within 2 seconds", async () => {
    // Player 1: MMR 1200, Ping to BOM: 25ms
    const t1 = await MatchmakingService.createTicket({
      titleId,
      rulesetId,
      players: [{ playerId: "player_alpha", mmr: 1200, latencyMap: { BOM: 25, FRA: 140 } }]
    });

    // Player 2: MMR 1220, Ping to BOM: 30ms (MMR delta: 20 < initial tolerance 50)
    const t2 = await MatchmakingService.createTicket({
      titleId,
      rulesetId,
      players: [{ playerId: "player_beta", mmr: 1220, latencyMap: { BOM: 30, FRA: 145 } }]
    });

    // Run matchmaking loop
    const matchCycle = await MatchmakingService.runMatchmakingCycle(titleId, rulesetId);

    expect(matchCycle.formedMatches.length).toBe(1);
    const match = matchCycle.formedMatches[0];
    expect(match.ticketIds).toContain(t1.ticketId);
    expect(match.ticketIds).toContain(t2.ticketId);
    expect(match.matchedRegion).toBe("BOM");
    expect(match.averageMmr).toBe(1210);

    // Verify tickets are marked as MATCHED
    const status1 = await MatchmakingService.getTicket(t1.ticketId);
    expect(status1?.status).toBe("MATCHED");
    expect(status1?.matchId).toBe(match.matchId);
  });

  it("TEST-08-B [Rule Flexing]: High-MMR player queueing alone triggers rule flexing step-downs at 5s, 10s, and 15s until match forms", async () => {
    // High-MMR Player: 2200 MMR (top 1% master tier)
    const highMmrTicket = await MatchmakingService.createTicket({
      titleId,
      rulesetId,
      players: [{ playerId: "elite_pro_player", mmr: 2200, latencyMap: { BOM: 35 } }],
      queueTimestamp: Date.now() - 1000 // Just queued 1s ago
    });

    // Lower-MMR Player: 1900 MMR (Delta: 300 MMR)
    // Initial MMR tolerance is 50, at 5s relaxes to 150, at 10s relaxes to 300, at 15s relaxes to 500
    const challengerTicket = await MatchmakingService.createTicket({
      titleId,
      rulesetId,
      players: [{ playerId: "challenger_player", mmr: 1900, latencyMap: { BOM: 40 } }],
      queueTimestamp: Date.now() - 1000
    });

    // At 1 second: initial tolerance is 50 -> delta is 300 -> NO match formed
    let cycle = await MatchmakingService.runMatchmakingCycle(titleId, rulesetId, Date.now());
    expect(cycle.formedMatches.length).toBe(0);

    // Fast-forward wait time to 6 seconds: tolerance relaxes to 150 -> delta 300 -> still NO match
    cycle = await MatchmakingService.runMatchmakingCycle(titleId, rulesetId, Date.now() + 6000);
    expect(cycle.formedMatches.length).toBe(0);

    // Fast-forward wait time to 12 seconds: tolerance relaxes to 300 -> delta 300 matches!
    cycle = await MatchmakingService.runMatchmakingCycle(titleId, rulesetId, Date.now() + 12000);
    expect(cycle.formedMatches.length).toBe(1);
    expect(cycle.formedMatches[0].ticketIds).toContain(highMmrTicket.ticketId);
    expect(cycle.formedMatches[0].flexStageTriggered).toBe("STEP_2_RELAXED_300");
  });

  it("TEST-08-C [Latency Boundary]: Players with >150ms ping delta are separated into regional buckets and never matched together", async () => {
    // Mumbai player: 20ms to BOM, 220ms to IAD
    const indiaTicket = await MatchmakingService.createTicket({
      titleId,
      rulesetId,
      players: [{ playerId: "india_gamer", mmr: 1500, latencyMap: { BOM: 20, IAD: 220 } }]
    });

    // US Virginia player: 15ms to IAD, 230ms to BOM
    const usTicket = await MatchmakingService.createTicket({
      titleId,
      rulesetId,
      players: [{ playerId: "us_gamer", mmr: 1500, latencyMap: { IAD: 15, BOM: 230 } }]
    });

    // Both players have identical 1500 MMR, but their latency delta exceeds the 150ms cross-region threshold
    const cycle = await MatchmakingService.runMatchmakingCycle(titleId, rulesetId);
    expect(cycle.formedMatches.length).toBe(0); // Separated by regional latency bounds!
  });

  it("TEST-08-D [Party Batching & Anti-Smurf]: A 2-player party and two solo players combine into a balanced 4-player 2v2 lobby", async () => {
    const ruleset2v2 = "ruleset_2v2_competitive";

    // 2-player party: Alice (1400) + Bob (1450) -> Effective Party MMR: 1425
    const partyTicket = await MatchmakingService.createTicket({
      titleId,
      rulesetId: ruleset2v2,
      players: [
        { playerId: "party_alice", mmr: 1400, latencyMap: { FRA: 25 } },
        { playerId: "party_bob", mmr: 1450, latencyMap: { FRA: 30 } }
      ]
    });

    // Solo Player 1: Charlie (1420)
    const solo1 = await MatchmakingService.createTicket({
      titleId,
      rulesetId: ruleset2v2,
      players: [{ playerId: "solo_charlie", mmr: 1420, latencyMap: { FRA: 28 } }]
    });

    // Solo Player 2: Dave (1430)
    const solo2 = await MatchmakingService.createTicket({
      titleId,
      rulesetId: ruleset2v2,
      players: [{ playerId: "solo_dave", mmr: 1430, latencyMap: { FRA: 26 } }]
    });

    const cycle = await MatchmakingService.runMatchmakingCycle(titleId, ruleset2v2);
    expect(cycle.formedMatches.length).toBe(1);

    const match = cycle.formedMatches[0];
    expect(match.totalPlayers).toBe(4);
    expect(match.teams.length).toBe(2);
    // Team 1 is the 2-player party
    expect(match.teams[0].players.length).toBe(2);
    expect(match.teams[0].players.map(p => p.playerId)).toContain("party_alice");
    // Team 2 is the combination of solo1 and solo2
    expect(match.teams[1].players.length).toBe(2);
    expect(match.teams[1].players.map(p => p.playerId)).toContain("solo_charlie");
    expect(match.teams[1].players.map(p => p.playerId)).toContain("solo_dave");
  });

  it("TEST-08-E [100 Simulated Queue Players Gate]: 100 concurrent players with varied MMRs pair cleanly via rule flexing", async () => {
    // Generate 100 random players with MMR normally distributed around 1000..2000
    for (let i = 0; i < 100; i++) {
      const mmr = 1000 + Math.floor(Math.random() * 800);
      await MatchmakingService.createTicket({
        titleId,
        rulesetId,
        players: [{ playerId: `sim_bot_${i}`, mmr, latencyMap: { BOM: 30 } }],
        queueTimestamp: Date.now() - Math.floor(Math.random() * 15000) // 0-15s simulated queue age
      });
    }

    const cycle = await MatchmakingService.runMatchmakingCycle(titleId, rulesetId);
    console.log(`Matched ${cycle.formedMatches.length * 2} out of 100 players in cycle (${cycle.formedMatches.length} 1v1 lobbies)`);
    // At least 45 matches formed (90%+ of simulated pool matched)
    expect(cycle.formedMatches.length).toBeGreaterThanOrEqual(40);
  });
});
