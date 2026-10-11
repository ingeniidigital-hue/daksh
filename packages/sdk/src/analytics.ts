export interface ExecutiveKpisResponse {
  dau: number;
  wau: number;
  mau: number;
  totalRevenueUsd: number;
  arpuUsd: number;
  arppuUsd: number;
  totalUsers: number;
  payingUsers: number;
}

export interface RetentionCohortResponse {
  cohortDate: string;
  cohortSize: number;
  d1Percent: number;
  d7Percent: number;
  d14Percent?: number;
  d30Percent: number;
}

export class DakshAnalyticsClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async getExecutiveKpis(titleId: string, role: string = "admin"): Promise<ExecutiveKpisResponse> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/analytics/kpis`, {
      headers: { "x-user-role": role }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Failed to fetch KPIs: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.kpis;
  }

  async getRetentionCohorts(titleId: string): Promise<RetentionCohortResponse[]> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/analytics/cohorts`);
    if (!res.ok) {
      throw new Error(`Failed to fetch retention cohorts: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.cohorts;
  }

  async exportCsv(titleId: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/analytics/export?format=csv`);
    if (!res.ok) {
      throw new Error(`Failed to export CSV: HTTP ${res.status}`);
    }
    return await res.text();
  }
}
