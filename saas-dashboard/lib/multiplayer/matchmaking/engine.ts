import { randomUUID } from "crypto";
import {
  MatchmakingRuleset,
  MatchmakingTicket,
  MatchedLobby,
  PlayerMatchInfo,
  TeamInMatch
} from "./types";
import { getPairwiseFlexTolerance } from "./flexing";

export function findBestCompatibleRegion(
  tickets: MatchmakingTicket[],
  maxLatencyDelta: number
): string | null {
  // Collect all unique regions across all players
  const allRegions = new Set<string>();
  for (const ticket of tickets) {
    for (const player of ticket.players) {
      if (player.latencyMap) {
        for (const reg of Object.keys(player.latencyMap)) {
          allRegions.add(reg);
        }
      }
    }
  }

  // If no latency maps at all, fallback to default region
  if (allRegions.size === 0) {
    return "GLOBAL";
  }

  let bestRegion: string | null = null;
  let lowestAvgPing = Infinity;

  for (const region of allRegions) {
    let regionValid = true;
    let minPing = Infinity;
    let maxPing = -Infinity;
    let totalPing = 0;
    let playerCount = 0;

    for (const ticket of tickets) {
      for (const player of ticket.players) {
        if (!player.latencyMap || player.latencyMap[region] === undefined) {
          regionValid = false;
          break;
        }
        const ping = player.latencyMap[region];
        if (ping < minPing) minPing = ping;
        if (ping > maxPing) maxPing = ping;
        totalPing += ping;
        playerCount++;
      }
      if (!regionValid) break;
    }

    if (regionValid && playerCount > 0) {
      const delta = maxPing - minPing;
      if (delta <= maxLatencyDelta) {
        const avg = totalPing / playerCount;
        if (avg < lowestAvgPing) {
          lowestAvgPing = avg;
          bestRegion = region;
        }
      }
    }
  }

  return bestRegion;
}

export function executeMatchmakingLoop(
  tickets: MatchmakingTicket[],
  ruleset: MatchmakingRuleset,
  currentTime: number = Date.now()
): { formedMatches: MatchedLobby[]; remainingTickets: MatchmakingTicket[] } {
  const queuedTickets = tickets
    .filter(t => t.status === "QUEUED" && t.rulesetId === ruleset.rulesetId)
    .sort((a, b) => a.queueTimestamp - b.queueTimestamp);

  const matchedLobbies: MatchedLobby[] = [];
  const usedTicketIds = new Set<string>();

  if (ruleset.mode === "1v1" || (ruleset.teamCount === 2 && ruleset.playersPerTeam === 1)) {
    // 1v1 Matching
    for (let i = 0; i < queuedTickets.length; i++) {
      const ticketA = queuedTickets[i];
      if (usedTicketIds.has(ticketA.ticketId)) continue;

      let bestCandidate: MatchmakingTicket | null = null;
      let bestRegionCandidate: string | null = null;
      let bestFlexStage: string | undefined = undefined;
      let minMmrDiff = Infinity;

      for (let j = 0; j < queuedTickets.length; j++) {
        if (i === j) continue;
        const ticketB = queuedTickets[j];
        if (usedTicketIds.has(ticketB.ticketId)) continue;

        // Check regional latency compatibility
        const validRegion = findBestCompatibleRegion([ticketA, ticketB], ruleset.maxLatencyDelta);
        if (!validRegion) continue;

        // Check MMR tolerance with flexing
        const flex = getPairwiseFlexTolerance(ticketA, ticketB, ruleset, currentTime);
        const mmrDiff = Math.abs(ticketA.partyEffectiveMmr - ticketB.partyEffectiveMmr);

        if (mmrDiff <= flex.mmrTolerance) {
          if (mmrDiff < minMmrDiff) {
            minMmrDiff = mmrDiff;
            bestCandidate = ticketB;
            bestRegionCandidate = validRegion;
            bestFlexStage = flex.stageName;
          }
        }
      }

      if (bestCandidate && bestRegionCandidate) {
        usedTicketIds.add(ticketA.ticketId);
        usedTicketIds.add(bestCandidate.ticketId);

        const allPlayers = [...ticketA.players, ...bestCandidate.players];
        const avgMmr = Math.round(
          allPlayers.reduce((sum, p) => sum + p.mmr, 0) / allPlayers.length
        );

        const lobby: MatchedLobby = {
          matchId: `match_${randomUUID()}`,
          titleId: ticketA.titleId,
          rulesetId: ruleset.rulesetId,
          ticketIds: [ticketA.ticketId, bestCandidate.ticketId],
          totalPlayers: 2,
          matchedRegion: bestRegionCandidate,
          averageMmr: avgMmr,
          flexStageTriggered: bestFlexStage,
          teams: [
            { teamId: "team_1", players: ticketA.players },
            { teamId: "team_2", players: bestCandidate.players }
          ],
          createdAt: Date.now()
        };

        matchedLobbies.push(lobby);
      }
    }
  } else if (ruleset.mode === "2v2" || (ruleset.teamCount === 2 && ruleset.playersPerTeam === 2)) {
    // 2v2 Matching: Party Batching & Anti-Smurf
    // Separate parties of 2 and solo players
    const partiesOf2 = queuedTickets.filter(
      t => !usedTicketIds.has(t.ticketId) && t.players.length === 2
    );
    const solos = queuedTickets.filter(
      t => !usedTicketIds.has(t.ticketId) && t.players.length === 1
    );

    // Case 1: Match Party of 2 vs Two Solos
    for (const party of partiesOf2) {
      if (usedTicketIds.has(party.ticketId)) continue;

      // Find two solos that together match regional latency and MMR
      const availableSolos = solos.filter(s => !usedTicketIds.has(s.ticketId));
      if (availableSolos.length < 2) break;

      let foundSoloPair: [MatchmakingTicket, MatchmakingTicket] | null = null;
      let bestRegion: string | null = null;
      let minDiff = Infinity;

      for (let s1 = 0; s1 < availableSolos.length; s1++) {
        for (let s2 = s1 + 1; s2 < availableSolos.length; s2++) {
          const candidateSolos = [availableSolos[s1], availableSolos[s2]];
          const allThree = [party, candidateSolos[0], candidateSolos[1]];

          const region = findBestCompatibleRegion(allThree, ruleset.maxLatencyDelta);
          if (!region) continue;

          const team2Mmr = Math.round(
            (candidateSolos[0].partyEffectiveMmr + candidateSolos[1].partyEffectiveMmr) / 2
          );
          const mmrDiff = Math.abs(party.partyEffectiveMmr - team2Mmr);

          const maxFlex = Math.max(
            party.queueTimestamp,
            candidateSolos[0].queueTimestamp,
            candidateSolos[1].queueTimestamp
          );
          // Pairwise tolerance from oldest ticket
          const oldestTicket = [party, ...candidateSolos].reduce((prev, curr) =>
            curr.queueTimestamp < prev.queueTimestamp ? curr : prev
          );
          const flex = getPairwiseFlexTolerance(party, oldestTicket, ruleset, currentTime);

          if (mmrDiff <= Math.max(ruleset.baseMmrTolerance, flex.mmrTolerance)) {
            if (mmrDiff < minDiff) {
              minDiff = mmrDiff;
              foundSoloPair = [candidateSolos[0], candidateSolos[1]];
              bestRegion = region;
            }
          }
        }
        if (foundSoloPair) break;
      }

      if (foundSoloPair && bestRegion) {
        usedTicketIds.add(party.ticketId);
        usedTicketIds.add(foundSoloPair[0].ticketId);
        usedTicketIds.add(foundSoloPair[1].ticketId);

        const allPlayers = [
          ...party.players,
          ...foundSoloPair[0].players,
          ...foundSoloPair[1].players
        ];
        const avgMmr = Math.round(
          allPlayers.reduce((sum, p) => sum + p.mmr, 0) / allPlayers.length
        );

        const lobby: MatchedLobby = {
          matchId: `match_${randomUUID()}`,
          titleId: party.titleId,
          rulesetId: ruleset.rulesetId,
          ticketIds: [party.ticketId, foundSoloPair[0].ticketId, foundSoloPair[1].ticketId],
          totalPlayers: 4,
          matchedRegion: bestRegion,
          averageMmr: avgMmr,
          teams: [
            { teamId: "team_1", players: party.players },
            {
              teamId: "team_2",
              players: [...foundSoloPair[0].players, ...foundSoloPair[1].players]
            }
          ],
          createdAt: Date.now()
        };

        matchedLobbies.push(lobby);
      }
    }

    // Case 2: Match Four Solos (2 vs 2)
    const remainingSolos = solos.filter(s => !usedTicketIds.has(s.ticketId));
    while (remainingSolos.length >= 4) {
      const candidateBatch = remainingSolos.splice(0, 4);
      const region = findBestCompatibleRegion(candidateBatch, ruleset.maxLatencyDelta);
      if (region) {
        candidateBatch.forEach(t => usedTicketIds.add(t.ticketId));
        const allPlayers = candidateBatch.flatMap(t => t.players);
        const avgMmr = Math.round(
          allPlayers.reduce((sum, p) => sum + p.mmr, 0) / allPlayers.length
        );

        const lobby: MatchedLobby = {
          matchId: `match_${randomUUID()}`,
          titleId: candidateBatch[0].titleId,
          rulesetId: ruleset.rulesetId,
          ticketIds: candidateBatch.map(t => t.ticketId),
          totalPlayers: 4,
          matchedRegion: region,
          averageMmr: avgMmr,
          teams: [
            {
              teamId: "team_1",
              players: [...candidateBatch[0].players, ...candidateBatch[1].players]
            },
            {
              teamId: "team_2",
              players: [...candidateBatch[2].players, ...candidateBatch[3].players]
            }
          ],
          createdAt: Date.now()
        };
        matchedLobbies.push(lobby);
      }
    }
  }

  const remainingTickets = queuedTickets.filter(t => !usedTicketIds.has(t.ticketId));

  return {
    formedMatches: matchedLobbies,
    remainingTickets
  };
}
