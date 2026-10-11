export interface CreateTurnMatchParams {
  titleId: string;
  players: string[];
  turnTimeoutSeconds?: number;
  wagerAmount?: number;
  currencyCode?: string;
  endpoint?: string;
}

export interface SubmitTurnMoveParams {
  titleId: string;
  matchId: string;
  playerId: string;
  action: string;
  x?: number;
  y?: number;
  payload?: any;
  endpoint?: string;
}

export class DakshTurnBased {
  /**
   * Creates a new turn-based multiplayer match room.
   */
  public static async createMatchAsync(params: CreateTurnMatchParams) {
    const endpoint = params.endpoint || "http://localhost:3000";
    const res = await fetch(`${endpoint}/api/titles/${params.titleId}/multiplayer/turn-based/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        players: params.players,
        turnTimeoutSeconds: params.turnTimeoutSeconds,
        wagerAmount: params.wagerAmount,
        currencyCode: params.currencyCode
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`[Daksh.TurnBased] Create match failed: ${data.error || res.statusText}`);
    }
    return data.match;
  }

  /**
   * Submits a move server-authoritatively.
   */
  public static async submitMoveAsync(params: SubmitTurnMoveParams) {
    const endpoint = params.endpoint || "http://localhost:3000";
    const res = await fetch(
      `${endpoint}/api/titles/${params.titleId}/multiplayer/turn-based/matches/${params.matchId}/move`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: params.playerId,
          move: {
            action: params.action,
            x: params.x,
            y: params.y,
            payload: params.payload
          }
        })
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`[Daksh.TurnBased] Submit move failed: ${data.error || res.statusText}`);
    }
    return data;
  }

  /**
   * Fetches the current live state of a turn-based match.
   */
  public static async getMatchAsync(titleId: string, matchId: string, endpoint = "http://localhost:3000") {
    const res = await fetch(`${endpoint}/api/titles/${titleId}/multiplayer/turn-based/matches/${matchId}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`[Daksh.TurnBased] Get match failed: ${data.error || res.statusText}`);
    }
    return data.match;
  }
}
