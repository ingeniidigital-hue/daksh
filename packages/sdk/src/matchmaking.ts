export interface MatchmakingPlayer {
  playerId: string;
  mmr: number;
  latencyMap?: Record<string, number>;
}

export interface MatchTicketResponse {
  ticketId: string;
  titleId: string;
  rulesetId: string;
  players: MatchmakingPlayer[];
  status: "QUEUED" | "MATCHED" | "CANCELLED";
  queueTimestamp: number;
  partyEffectiveMmr: number;
  matchId?: string;
  matchedRegion?: string;
}

export class DakshMatchmakingClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async queueForMatch(
    titleId: string,
    rulesetId: string,
    players: MatchmakingPlayer[]
  ): Promise<MatchTicketResponse> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/multiplayer/matchmaking/tickets`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rulesetId, players })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to queue for match: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.ticket;
  }

  async pollMatchStatus(titleId: string, ticketId: string): Promise<MatchTicketResponse> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/multiplayer/matchmaking/tickets?ticketId=${ticketId}`
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to poll ticket: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.ticket;
  }

  async cancelQueue(titleId: string, ticketId: string): Promise<boolean> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/multiplayer/matchmaking/tickets?ticketId=${ticketId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    return data.success === true;
  }

  async getRulesets(titleId: string): Promise<any[]> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/multiplayer/matchmaking/rulesets`
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch rulesets: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.rulesets;
  }

  async triggerMatchmakingCycle(titleId: string, rulesetId: string): Promise<any> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/multiplayer/matchmaking/cycle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rulesetId })
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to trigger matchmaking cycle: HTTP ${res.status}`);
    }

    return await res.json();
  }
}
