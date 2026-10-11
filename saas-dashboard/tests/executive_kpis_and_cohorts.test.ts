import { describe, it, expect, beforeEach } from "vitest";
import {
  AnalyticsService,
  resetAnalyticsStorage,
  RbacForbiddenError,
  generateRfc4180Csv
} from "../lib/analytics";

describe("STORY-11 / TDD: Live Executive KPIs Dashboard (DAU, Retention, ARPU)", () => {
  const titleId = "TITLE_ANALYTICS_01";

  beforeEach(() => {
    resetAnalyticsStorage();
  });

  it("TEST-11-A [Happy Path]: Analytics aggregates KPI cards over 100,000 historical events in <250ms", async () => {
    const now = Date.now();
    const DAY_MS = 86400000;

    // Seed 100,000 lightweight event records across 2,000 players over 30 days
    const events = [];
    for (let i = 0; i < 100000; i++) {
      const dayOffset = (i % 30) * DAY_MS;
      events.push({
        titleId,
        playerId: `player_${i % 2000}`,
        eventName: i % 10 === 0 ? "iap_purchase" : "session_start",
        timestamp: now - dayOffset,
        revenueCents: i % 10 === 0 ? 499 : 0 // $4.99 purchase
      });
    }

    await AnalyticsService.seedHistoricalEvents(titleId, events);

    const start = performance.now();
    const kpis = await AnalyticsService.getExecutiveKpis(titleId, { role: "admin" });
    const duration = performance.now() - start;

    console.log(`Aggregated 100,000 events in ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(250); // Under 250ms SLA
    expect(kpis.dau).toBeGreaterThan(0);
    expect(kpis.wau).toBeGreaterThan(kpis.dau);
    expect(kpis.mau).toBeGreaterThanOrEqual(kpis.wau);
    expect(kpis.totalRevenueUsd).toBeGreaterThan(0);
    expect(kpis.arpuUsd).toBeGreaterThan(0);
  });

  it("TEST-11-B [Cohort Calculation]: D1/D7/D30 retention calculations match ground truth cohort formulas", async () => {
    const DAY_MS = 86400000;
    const baseCohortDate = "2026-09-01";
    const cohortStartTime = new Date("2026-09-01T00:00:00Z").getTime();

    // 100 users in cohort on Day 0
    const cohortPlayers = Array.from({ length: 100 }, (_, i) => `cohort_user_${i}`);

    const events = [];
    // Day 0: all 100 active
    for (const p of cohortPlayers) {
      events.push({ titleId, playerId: p, eventName: "signup", timestamp: cohortStartTime });
    }

    // Day 1: 50 players return (50% D1)
    for (let i = 0; i < 50; i++) {
      events.push({ titleId, playerId: cohortPlayers[i], eventName: "session_start", timestamp: cohortStartTime + 1 * DAY_MS });
    }

    // Day 7: 30 players return (30% D7)
    for (let i = 0; i < 30; i++) {
      events.push({ titleId, playerId: cohortPlayers[i], eventName: "session_start", timestamp: cohortStartTime + 7 * DAY_MS });
    }

    // Day 30: 15 players return (15% D30)
    for (let i = 0; i < 15; i++) {
      events.push({ titleId, playerId: cohortPlayers[i], eventName: "session_start", timestamp: cohortStartTime + 30 * DAY_MS });
    }

    await AnalyticsService.seedHistoricalEvents(titleId, events);

    const cohorts = await AnalyticsService.getRetentionCohorts(titleId);
    expect(cohorts.length).toBeGreaterThan(0);

    const cohortRow = cohorts.find(c => c.cohortDate === baseCohortDate);
    expect(cohortRow).toBeDefined();
    expect(cohortRow?.cohortSize).toBe(100);
    expect(cohortRow?.d1Percent).toBe(50.0);
    expect(cohortRow?.d7Percent).toBe(30.0);
    expect(cohortRow?.d30Percent).toBe(15.0);
  });

  it("TEST-11-C [RBAC Security]: Non-admin member querying ARPU endpoints receives RbacForbiddenError (HTTP 403)", async () => {
    // Non-admin viewer role attempting to access revenue / ARPU metrics
    await expect(
      AnalyticsService.getExecutiveKpis(titleId, { role: "viewer" })
    ).rejects.toThrow(RbacForbiddenError);

    // Developer role attempting to access revenue / ARPU metrics
    await expect(
      AnalyticsService.getExecutiveKpis(titleId, { role: "developer" })
    ).rejects.toThrow(RbacForbiddenError);

    // Studio Admin role successfully authorized
    const adminKpis = await AnalyticsService.getExecutiveKpis(titleId, { role: "admin" });
    expect(adminKpis).toBeDefined();
  });

  it("TEST-11-D [Export Verification]: CSV export streams valid RFC 4180 formatted data", () => {
    const rawData = [
      { date: "2026-10-01", metric: "DAU", value: 12500, notes: "Spike, promo launch" },
      { date: "2026-10-02", metric: "ARPU", value: 1.45, notes: 'Quote "Season Pass"' }
    ];

    const csv = generateRfc4180Csv(rawData);

    // Assert RFC 4180 compliance:
    // 1. Header row exists
    expect(csv).toContain("date,metric,value,notes");
    // 2. Embedded comma quotes field: "Spike, promo launch"
    expect(csv).toContain('"Spike, promo launch"');
    // 3. Embedded quotes escaped as double quotes: "Quote ""Season Pass"""
    expect(csv).toContain('"Quote ""Season Pass"""');
  });
});
