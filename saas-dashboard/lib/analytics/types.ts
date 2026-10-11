export type UserRole = "admin" | "studio_owner" | "finance" | "developer" | "viewer";

export interface HistoricalEvent {
  titleId: string;
  playerId: string;
  eventName: string;
  timestamp: number;
  revenueCents?: number;
}

export interface ExecutiveKpis {
  dau: number;
  wau: number;
  mau: number;
  totalRevenueUsd: number;
  arpuUsd: number;
  arppuUsd: number;
  totalUsers: number;
  payingUsers: number;
}

export interface RetentionCohort {
  cohortDate: string;
  cohortSize: number;
  d1Percent: number;
  d7Percent: number;
  d14Percent?: number;
  d30Percent: number;
}
