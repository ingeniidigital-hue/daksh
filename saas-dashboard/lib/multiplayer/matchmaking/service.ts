import { randomUUID } from "crypto";
import {
  MatchmakingRuleset,
  MatchmakingTicket,
  MatchedLobby,
  MatchmakingCycleResult,
  PlayerMatchInfo
} from "./types";
import { DEFAULT_RULESETS } from "./ruleset";
import { executeMatchmakingLoop } from "./engine";

interface MatchmakingStore {
  tickets: Map<string, MatchmakingTicket>;
  matches: Map<string, MatchedLobby>;
  rulesets: Map<string, MatchmakingRuleset>;
}

const globalStore: MatchmakingStore = {
  tickets: new Map(),
  matches: new Map(),
  rulesets: new Map(Object.entries(DEFAULT_RULESETS))
};

export function resetMatchmakingStorage(): void {
  globalStore.tickets.clear();
  globalStore.matches.clear();
  globalStore.rulesets = new Map(Object.entries(DEFAULT_RULESETS));
}

export class MatchmakingService {
  static async createTicket(params: {
    titleId: string;
    rulesetId: string;
    players: PlayerMatchInfo[];
    queueTimestamp?: number;
  }): Promise<MatchmakingTicket> {
    if (!params.players || params.players.length === 0) {
      throw new Error("Matchmaking ticket must contain at least 1 player");
    }

    const partyEffectiveMmr = Math.round(
      params.players.reduce((sum, p) => sum + p.mmr, 0) / params.players.length
    );

    const ticket: MatchmakingTicket = {
      ticketId: `tkt_${randomUUID()}`,
      titleId: params.titleId,
      rulesetId: params.rulesetId,
      players: params.players,
      status: "QUEUED",
      queueTimestamp: params.queueTimestamp ?? Date.now(),
      partyEffectiveMmr,
      createdAt: new Date().toISOString()
    };

    globalStore.tickets.set(ticket.ticketId, ticket);
    return ticket;
  }

  static async getTicket(ticketId: string): Promise<MatchmakingTicket | null> {
    return globalStore.tickets.get(ticketId) || null;
  }

  static async cancelTicket(ticketId: string): Promise<boolean> {
    const ticket = globalStore.tickets.get(ticketId);
    if (!ticket) return false;
    if (ticket.status === "MATCHED") return false;

    ticket.status = "CANCELLED";
    globalStore.tickets.set(ticketId, ticket);
    return true;
  }

  static async getRuleset(
    titleId: string,
    rulesetId: string
  ): Promise<MatchmakingRuleset | null> {
    return globalStore.rulesets.get(rulesetId) || null;
  }

  static async listRulesets(titleId: string): Promise<MatchmakingRuleset[]> {
    return Array.from(globalStore.rulesets.values()).filter(
      r => !r.titleId || r.titleId === titleId
    );
  }

  static async createOrUpdateRuleset(
    ruleset: MatchmakingRuleset
  ): Promise<MatchmakingRuleset> {
    globalStore.rulesets.set(ruleset.rulesetId, ruleset);
    return ruleset;
  }

  static async getMatch(matchId: string): Promise<MatchedLobby | null> {
    return globalStore.matches.get(matchId) || null;
  }

  static async listMatches(titleId: string): Promise<MatchedLobby[]> {
    return Array.from(globalStore.matches.values()).filter(m => m.titleId === titleId);
  }

  static async runMatchmakingCycle(
    titleId: string,
    rulesetId: string,
    currentTime: number = Date.now()
  ): Promise<MatchmakingCycleResult> {
    const ruleset = await this.getRuleset(titleId, rulesetId);
    if (!ruleset) {
      throw new Error(`Ruleset ${rulesetId} not found`);
    }

    const titleTickets = Array.from(globalStore.tickets.values()).filter(
      t => t.titleId === titleId && t.rulesetId === rulesetId && t.status === "QUEUED"
    );

    const { formedMatches, remainingTickets } = executeMatchmakingLoop(
      titleTickets,
      ruleset,
      currentTime
    );

    // Commit matches and update ticket statuses
    for (const match of formedMatches) {
      globalStore.matches.set(match.matchId, match);
      for (const tId of match.ticketIds) {
        const ticket = globalStore.tickets.get(tId);
        if (ticket) {
          ticket.status = "MATCHED";
          ticket.matchId = match.matchId;
          ticket.matchedRegion = match.matchedRegion;
          globalStore.tickets.set(tId, ticket);
        }
      }
    }

    return {
      formedMatches,
      remainingTicketsCount: remainingTickets.length
    };
  }
}
