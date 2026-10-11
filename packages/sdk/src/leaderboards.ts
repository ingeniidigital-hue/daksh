export interface LeaderboardEntry {
  playerId: string;
  score: number;
  rank: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ScoreSubmissionResponse {
  success: boolean;
  playerId: string;
  score: number;
  rank: number;
  totalPlayers: number;
  timestamp: number;
}

export class DakshLeaderboardClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async submitScore(
    titleId: string,
    leaderboardId: string,
    playerId: string,
    score: number,
    metadata?: Record<string, any>
  ): Promise<ScoreSubmissionResponse> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/leaderboards/${leaderboardId}/scores`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, score, metadata })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Score submission failed: HTTP ${res.status}`);
    }

    return await res.json();
  }

  async getPlayerRank(
    titleId: string,
    leaderboardId: string,
    playerId: string
  ): Promise<LeaderboardEntry> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/leaderboards/${leaderboardId}/scores?playerId=${playerId}`
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch rank: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.entry;
  }

  async getTopScores(
    titleId: string,
    leaderboardId: string,
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/leaderboards/${leaderboardId}/scores?limit=${limit}`
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch top scores: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.topScores;
  }

  async listLeaderboards(titleId: string): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/leaderboards`);
    if (!res.ok) {
      throw new Error(`Failed to list leaderboards: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.leaderboards;
  }

  async createLeaderboard(titleId: string, config: {
    leaderboardId: string;
    name: string;
    resetFrequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME";
    sortOrder?: "ASCENDING" | "DESCENDING";
    maxScoreDelta?: number;
  }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/leaderboards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create leaderboard: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.leaderboard;
  }

  async getSecurityAlerts(titleId: string): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/leaderboards/alerts`);
    if (!res.ok) {
      throw new Error(`Failed to fetch security alerts: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.alerts;
  }
}
