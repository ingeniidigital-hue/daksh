export type ResetFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "ALL_TIME" | "CUSTOM_SEASON";
export type SortOrder = "ASCENDING" | "DESCENDING";
export type UpdateStrategy = "BEST" | "SUM" | "LATEST";

export interface LeaderboardDefinition {
  titleId: string;
  leaderboardId: string;
  name: string;
  resetFrequency: ResetFrequency;
  sortOrder: SortOrder;
  metricName?: string;
  updateStrategy?: UpdateStrategy;
  seasonStart?: string;
  seasonEnd?: string;
  maxScoreDelta?: number;
  createdAt?: string;
}

export interface LeaderboardEntry {
  playerId: string;
  score: number;
  rank: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ScoreSubmissionResult {
  playerId: string;
  score: number;
  rank: number;
  totalPlayers: number;
  timestamp: number;
}

export interface SecurityAlert {
  alertId: string;
  titleId: string;
  leaderboardId: string;
  playerId: string;
  reason: string;
  attemptedScore: number;
  previousScore?: number;
  attemptedDelta: number;
  timestamp: number;
}
