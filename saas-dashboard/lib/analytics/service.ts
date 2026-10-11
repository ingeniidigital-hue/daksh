import {
  HistoricalEvent,
  ExecutiveKpis,
  RetentionCohort
} from "./types";
import { verifyAdminRole } from "./rbac";

interface TitleAnalyticsStorage {
  events: HistoricalEvent[];
}

const storage: Map<string, TitleAnalyticsStorage> = new Map();

function getTitleStorage(titleId: string): TitleAnalyticsStorage {
  let s = storage.get(titleId);
  if (!s) {
    s = { events: [] };
    storage.set(titleId, s);
  }
  return s;
}

export function resetAnalyticsStorage(): void {
  storage.clear();
}

export class AnalyticsService {
  static async seedHistoricalEvents(
    titleId: string,
    events: HistoricalEvent[]
  ): Promise<void> {
    const s = getTitleStorage(titleId);
    s.events.push(...events);
  }

  static async getExecutiveKpis(
    titleId: string,
    authCtx?: { role?: string }
  ): Promise<ExecutiveKpis> {
    // Enforce RBAC security
    verifyAdminRole(authCtx?.role);

    const s = getTitleStorage(titleId);
    const events = s.events;

    const now = Date.now();
    const DAY_MS = 86400000;
    const dauCutoff = now - 1 * DAY_MS;
    const wauCutoff = now - 7 * DAY_MS;
    const mauCutoff = now - 30 * DAY_MS;

    const dauSet = new Set<string>();
    const wauSet = new Set<string>();
    const mauSet = new Set<string>();
    const allUsersSet = new Set<string>();
    const payingUsersSet = new Set<string>();

    let totalRevenueCents = 0;

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const pId = e.playerId;
      allUsersSet.add(pId);

      const ts = e.timestamp;
      if (ts >= dauCutoff) dauSet.add(pId);
      if (ts >= wauCutoff) wauSet.add(pId);
      if (ts >= mauCutoff) mauSet.add(pId);

      if (e.revenueCents && e.revenueCents > 0) {
        totalRevenueCents += e.revenueCents;
        payingUsersSet.add(pId);
      }
    }

    const totalUsers = allUsersSet.size;
    const payingUsers = payingUsersSet.size;
    const totalRevenueUsd = Math.round(totalRevenueCents) / 100;
    const arpuUsd = totalUsers > 0 ? Number((totalRevenueUsd / totalUsers).toFixed(2)) : 0;
    const arppuUsd = payingUsers > 0 ? Number((totalRevenueUsd / payingUsers).toFixed(2)) : 0;

    return {
      dau: dauSet.size,
      wau: wauSet.size,
      mau: mauSet.size,
      totalRevenueUsd,
      arpuUsd,
      arppuUsd,
      totalUsers,
      payingUsers
    };
  }

  static async getRetentionCohorts(titleId: string): Promise<RetentionCohort[]> {
    const s = getTitleStorage(titleId);
    const events = s.events;

    const DAY_MS = 86400000;

    // 1. Determine first seen timestamp per user
    const firstSeenMap = new Map<string, number>();
    for (const e of events) {
      const prev = firstSeenMap.get(e.playerId);
      if (prev === undefined || e.timestamp < prev) {
        firstSeenMap.set(e.playerId, e.timestamp);
      }
    }

    // 2. Group users into cohort date buckets (YYYY-MM-DD)
    const cohortUsers = new Map<string, Set<string>>();
    for (const [playerId, firstTs] of firstSeenMap.entries()) {
      const dateStr = new Date(firstTs).toISOString().split("T")[0];
      let set = cohortUsers.get(dateStr);
      if (!set) {
        set = new Set();
        cohortUsers.set(dateStr, set);
      }
      set.add(playerId);
    }

    // 3. For each cohort, calculate D1, D7, D14, D30 retention
    const result: RetentionCohort[] = [];

    for (const [cohortDate, usersSet] of cohortUsers.entries()) {
      const cohortSize = usersSet.size;
      if (cohortSize === 0) continue;

      const d1Users = new Set<string>();
      const d7Users = new Set<string>();
      const d14Users = new Set<string>();
      const d30Users = new Set<string>();

      for (const e of events) {
        if (!usersSet.has(e.playerId)) continue;
        const firstTs = firstSeenMap.get(e.playerId)!;
        const diffDays = Math.floor((e.timestamp - firstTs) / DAY_MS);

        if (diffDays === 1) d1Users.add(e.playerId);
        if (diffDays === 7) d7Users.add(e.playerId);
        if (diffDays === 14) d14Users.add(e.playerId);
        if (diffDays === 30) d30Users.add(e.playerId);
      }

      result.push({
        cohortDate,
        cohortSize,
        d1Percent: Number(((d1Users.size / cohortSize) * 100).toFixed(1)),
        d7Percent: Number(((d7Users.size / cohortSize) * 100).toFixed(1)),
        d14Percent: Number(((d14Users.size / cohortSize) * 100).toFixed(1)),
        d30Percent: Number(((d30Users.size / cohortSize) * 100).toFixed(1))
      });
    }

    return result.sort((a, b) => b.cohortDate.localeCompare(a.cohortDate));
  }
}
