export type MatchStatus = "WAITING" | "ACTIVE" | "RESOLVED" | "FORFEIT" | "DRAW";

export interface TurnMove {
  action: string;
  playerId: string;
  x?: number;
  y?: number;
  payload?: any;
  timestamp: number;
}

export interface TurnBasedMatch {
  matchId: string;
  titleId: string;
  status: MatchStatus;
  players: string[];
  activeTurnPlayerId: string;
  turnNumber: number;
  turnTimeoutSeconds: number;
  turnStartedAt: number;
  boardState: (string | null)[][];
  moveHistory: TurnMove[];
  winnerId: string | null;
  loserId: string | null;
  resolutionReason: string | null;
  wagerAmount?: number;
  currencyCode?: string;
  onPersistenceWrite?: () => void;
  createdAt: number;
  updatedAt: number;
}

export interface CreateMatchRequest {
  titleId: string;
  players: string[];
  turnTimeoutSeconds?: number;
  wagerAmount?: number;
  currencyCode?: string;
  onPersistenceWrite?: () => void;
}

export interface SubmitMoveRequest {
  matchId: string;
  playerId: string;
  move: {
    action: string;
    x?: number;
    y?: number;
    payload?: any;
  };
}
