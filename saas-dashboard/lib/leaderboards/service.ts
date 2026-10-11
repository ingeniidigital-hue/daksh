import {
  LeaderboardDefinition,
  LeaderboardEntry,
  ScoreSubmissionResult,
  SecurityAlert
} from "./types";
import { MemorySortedSet } from "./zset";
import { AntiCheatViolationError, validateScoreDelta } from "./anti-cheat";

interface TitleLeaderboards {
  definitions: Map<string, LeaderboardDefinition>;
  sets: Map<string, MemorySortedSet>;
  alerts: SecurityAlert[];
}

const storage: Map<string, TitleLeaderboards> = new Map();

function getTitleStorage(titleId: string): TitleLeaderboards {
  let s = storage.get(titleId);
  if (!s) {
    s = {
      definitions: new Map(),
      sets: new Map(),
      alerts: []
    };
    storage.set(titleId, s);
  }
  return s;
}

export function resetLeaderboardStorage(): void {
  storage.clear();
}

export class LeaderboardService {
  static async createLeaderboard(def: LeaderboardDefinition): Promise<LeaderboardDefinition> {
    const s = getTitleStorage(def.titleId);
    s.definitions.set(def.leaderboardId, {
      ...def,
      createdAt: new Date().toISOString()
    });
    s.sets.set(def.leaderboardId, new MemorySortedSet(def.sortOrder || "DESCENDING"));
    return def;
  }

  static async getLeaderboard(
    titleId: string,
    leaderboardId: string
  ): Promise<LeaderboardDefinition | null> {
    const s = getTitleStorage(titleId);
    return s.definitions.get(leaderboardId) || null;
  }

  static async listLeaderboards(titleId: string): Promise<LeaderboardDefinition[]> {
    const s = getTitleStorage(titleId);
    return Array.from(s.definitions.values());
  }

  static async submitScore(params: {
    titleId: string;
    leaderboardId: string;
    playerId: string;
    score: number;
    timestamp?: number;
    metadata?: Record<string, any>;
  }): Promise<ScoreSubmissionResult> {
    const s = getTitleStorage(params.titleId);
    let def = s.definitions.get(params.leaderboardId);
    if (!def) {
      // Auto-create default all-time descending leaderboard if not explicitly defined
      def = {
        titleId: params.titleId,
        leaderboardId: params.leaderboardId,
        name: params.leaderboardId,
        resetFrequency: "ALL_TIME",
        sortOrder: "DESCENDING"
      };
      s.definitions.set(params.leaderboardId, def);
      s.sets.set(params.leaderboardId, new MemorySortedSet("DESCENDING"));
    }

    let zset = s.sets.get(params.leaderboardId);
    if (!zset) {
      zset = new MemorySortedSet(def.sortOrder);
      s.sets.set(params.leaderboardId, zset);
    }

    const currentEntry = zset.get(params.playerId);
    const previousScore = currentEntry?.score;

    // Anti-cheat verification
    const alert = validateScoreDelta({
      titleId: params.titleId,
      leaderboardId: params.leaderboardId,
      playerId: params.playerId,
      newScore: params.score,
      previousScore,
      maxScoreDelta: def.maxScoreDelta
    });

    if (alert) {
      s.alerts.push(alert);
      throw new AntiCheatViolationError(
        alert.reason,
        alert.attemptedDelta,
        def.maxScoreDelta || 0
      );
    }

    const timestamp = params.timestamp ?? Date.now();
    zset.insertOrUpdate(params.playerId, params.score, timestamp, params.metadata);

    const rankInfo = zset.getRank(params.playerId);
    if (!rankInfo) {
      throw new Error("Failed to calculate rank after score insertion");
    }

    return {
      playerId: params.playerId,
      score: params.score,
      rank: rankInfo.rank,
      totalPlayers: rankInfo.totalPlayers,
      timestamp
    };
  }

  static async getPlayerRank(
    titleId: string,
    leaderboardId: string,
    playerId: string
  ): Promise<LeaderboardEntry | null> {
    const s = getTitleStorage(titleId);
    const zset = s.sets.get(leaderboardId);
    if (!zset) return null;

    const rankInfo = zset.getRank(playerId);
    return rankInfo ? rankInfo.entry : null;
  }

  static async getTopScores(
    titleId: string,
    leaderboardId: string,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const s = getTitleStorage(titleId);
    const zset = s.sets.get(leaderboardId);
    if (!zset) return [];
    return zset.getTop(limit);
  }

  static async getSecurityAlerts(titleId: string): Promise<SecurityAlert[]> {
    const s = getTitleStorage(titleId);
    return [...s.alerts];
  }
}
