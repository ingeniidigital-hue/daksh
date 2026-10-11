export type ResetFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME";
export type SortOrder = "ASCENDING" | "DESCENDING";

export interface LeaderboardDefinition {
  titleId: string;
  leaderboardId: string;
  name: string;
  resetFrequency: ResetFrequency;
  sortOrder: SortOrder;
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
