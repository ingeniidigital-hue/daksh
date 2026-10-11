export interface TelemetryPayload {
  eventName: string;
  playerId: string;
  timestamp?: number;
  properties?: Record<string, any>;
}

export class DakshTelemetryClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async track(
    titleId: string,
    eventName: string,
    playerId: string,
    properties: Record<string, any> = {}
  ): Promise<{ status: number; acceptedCount: number; timestamp: number }> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/telemetry/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        playerId,
        timestamp: Date.now(),
        properties
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Telemetry track failed: HTTP ${res.status}`);
    }

    return await res.json();
  }

  async trackBatch(
    titleId: string,
    events: TelemetryPayload[]
  ): Promise<{ status: number; acceptedCount: number; timestamp: number }> {
    const prepared = events.map(e => ({
      ...e,
      timestamp: e.timestamp || Date.now(),
      properties: e.properties || {}
    }));

    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/telemetry/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prepared)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Telemetry batch track failed: HTTP ${res.status}`);
    }

    return await res.json();
  }

  async queryRecent(titleId: string, limit: number = 50): Promise<any[]> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/telemetry/events?limit=${limit}`
    );

    if (!res.ok) {
      throw new Error(`Failed to query telemetry: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.events;
  }
}
