export interface CloudDeploymentInfo {
  titleId: string;
  status: string;
  provisionedRegions: string[];
  uptimeSla: string;
  tier: string;
  activeCcu: number;
  avgTickrateHz: number;
  deployedAt: number;
}

export interface AllocatedServerInfo {
  serverId: string;
  titleId: string;
  region: string;
  ip: string;
  port: number;
  status: string;
  gameMode: string;
}

export class DakshCloudClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async deployCloud(titleId: string, options: { regions?: string[]; tier?: string } = {}): Promise<CloudDeploymentInfo> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/cloud/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Deploy failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.deployment;
  }

  async getDeployment(titleId: string): Promise<CloudDeploymentInfo | null> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/cloud/deploy`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.deployed ? data.deployment : null;
  }

  async allocateServer(
    titleId: string,
    region: string = "bom",
    gameMode: string = "standard"
  ): Promise<AllocatedServerInfo> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/cloud/servers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region, gameMode })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Allocation failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.server;
  }

  async routeNearest(latencyMap: Record<string, number>): Promise<{ selectedRegion: string; expectedPingMs: number }> {
    const res = await fetch(`${this.baseUrl}/api/titles/any/cloud/routing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latencyMap })
    });

    if (!res.ok) {
      throw new Error(`Routing failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.route;
  }
}
