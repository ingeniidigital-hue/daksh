export interface PlayerMatchInfo {
  playerId: string;
  mmr: number;
  latencyMap?: Record<string, number>;
}

export interface FlexStep {
  afterSeconds: number;
  mmrTolerance: number;
  stageName: string;
}

export interface MatchmakingRuleset {
  rulesetId: string;
  titleId?: string;
  name: string;
  mode: "1v1" | "2v2" | "ffa" | "custom";
  teamCount: number;
  playersPerTeam: number;
  baseMmrTolerance: number;
  flexSteps: FlexStep[];
  maxLatencyDelta: number;
}

export interface MatchmakingTicket {
  ticketId: string;
  titleId: string;
  rulesetId: string;
  players: PlayerMatchInfo[];
  status: "QUEUED" | "MATCHED" | "CANCELLED";
  queueTimestamp: number;
  partyEffectiveMmr: number;
  matchId?: string;
  matchedRegion?: string;
  createdAt?: string;
}

export interface TeamInMatch {
  teamId: string;
  players: PlayerMatchInfo[];
}

export interface MatchedLobby {
  matchId: string;
  titleId: string;
  rulesetId: string;
  ticketIds: string[];
  totalPlayers: number;
  matchedRegion: string;
  averageMmr: number;
  flexStageTriggered?: string;
  teams: TeamInMatch[];
  createdAt: number;
}

export interface MatchmakingCycleResult {
  formedMatches: MatchedLobby[];
  remainingTicketsCount: number;
}
