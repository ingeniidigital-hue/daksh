import { describe, it, expect, beforeEach } from "vitest";
import {
  TelemetryIngestionService,
  resetTelemetryStorage,
  scrubPii,
  PayloadTooLargeError
} from "../lib/telemetry";

describe("STORY-10 / TDD: High-Volume Telemetry Ingestion (10,000 events/sec)", () => {
  const titleId = "TITLE_TELEMETRY_01";

  beforeEach(async () => {
    await resetTelemetryStorage();
  });

  it("TEST-10-A [Happy Path]: 10,000 simulated events/sec ingest and flush to storage with 0 dropped events", async () => {
    // Produce 10,000 gameplay events (kill, loot, death, level_up)
    const events = [];
    for (let i = 0; i < 10000; i++) {
      events.push({
        titleId,
        eventName: i % 4 === 0 ? "player_kill" : i % 4 === 1 ? "loot_pickup" : i % 4 === 2 ? "player_death" : "level_up",
        playerId: `player_${i % 200}`,
        timestamp: Date.now(),
        properties: {
          level: Math.floor(i / 100) + 1,
          zone: "verdant_plains",
          damageDealt: 150 + (i % 50)
        }
      });
    }

    const start = performance.now();
    // Ingest in 10 batches of 1,000
    for (let b = 0; b < 10; b++) {
      const chunk = events.slice(b * 1000, (b + 1) * 1000);
      const res = await TelemetryIngestionService.ingestBatch(titleId, chunk);
      expect(res.acceptedCount).toBe(1000);
    }

    // Force flush the buffer
    await TelemetryIngestionService.flushAll();
    const duration = performance.now() - start;

    console.log(`Ingested and flushed 10,000 telemetry events in ${duration.toFixed(2)}ms`);

    // Verify exactly 10,000 events persisted with 0 dropped
    const storedCount = await TelemetryIngestionService.getEventCount(titleId);
    expect(storedCount).toBe(10000);

    // Verify throughput > 10,000 events/sec (duration < 1000ms)
    expect(duration).toBeLessThan(1000);
  });

  it("TEST-10-B [Latency SLA]: Ingestion API accepts a 100-event batch in sub-5ms", async () => {
    const batch = Array.from({ length: 100 }, (_, i) => ({
      titleId,
      eventName: "match_heartbeat",
      playerId: `player_${i}`,
      timestamp: Date.now(),
      properties: { fps: 60, ping: 24 }
    }));

    const start = performance.now();
    const ack = await TelemetryIngestionService.ingestBatch(titleId, batch);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5); // Sub-5ms SLA
    expect(ack.status).toBe(202);
    expect(ack.acceptedCount).toBe(100);
  });

  it("TEST-10-C [PII Redaction]: Incoming telemetry payload containing raw IP and email address has fields scrubbed before persisting", async () => {
    const rawPayload = {
      ip: "192.168.1.105",
      user_email: "player_secret@example.com",
      passwordHash: "xyz987secret",
      sessionToken: "bearer_token_abc_123",
      authorization: "Bearer eyJhbGciOi...",
      action: "player_login",
      level: 15
    };

    const scrubbed = scrubPii(rawPayload);

    // Assert sensitive PII fields are replaced or stripped
    expect(scrubbed.ip).toBe("[REDACTED_IP]");
    expect(scrubbed.user_email).toBe("[REDACTED_EMAIL]");
    expect(scrubbed.passwordHash).toBe("[REDACTED_SECRET]");
    expect(scrubbed.sessionToken).toBe("[REDACTED_TOKEN]");
    expect(scrubbed.authorization).toBe("[REDACTED_HEADER]");
    // Non-PII retained
    expect(scrubbed.action).toBe("player_login");
    expect(scrubbed.level).toBe(15);

    // Ingest event with PII
    await TelemetryIngestionService.ingestEvent(titleId, {
      titleId,
      eventName: "auth_attempt",
      playerId: "pii_player",
      timestamp: Date.now(),
      properties: rawPayload
    });

    await TelemetryIngestionService.flushAll();

    const stored = await TelemetryIngestionService.queryRecentEvents(titleId, 1);
    expect(stored.length).toBe(1);
    expect(stored[0].properties.ip).toBe("[REDACTED_IP]");
    expect(stored[0].properties.user_email).toBe("[REDACTED_EMAIL]");
  });

  it("TEST-10-D [Failure Mode]: Event payload exceeding 4KB limit returns PayloadTooLargeError", async () => {
    // Generate massive payload > 4KB (e.g. 10KB string)
    const largeBlob = "x".repeat(1024 * 5); // 5KB

    await expect(
      TelemetryIngestionService.ingestEvent(titleId, {
        titleId,
        eventName: "huge_payload_event",
        playerId: "player_bad",
        timestamp: Date.now(),
        properties: { data: largeBlob }
      })
    ).rejects.toThrow(PayloadTooLargeError);
  });

  it("TEST-10-E [Ring Buffer Auto-Flush]: Buffer automatically flushes when reaching chunk size threshold (1,000 items)", async () => {
    let flushCount = 0;
    TelemetryIngestionService.onFlush(() => {
      flushCount++;
    });

    // Ingest 1,500 events
    const batch1 = Array.from({ length: 1000 }, (_, i) => ({
      titleId,
      eventName: "event_a",
      playerId: `p_${i}`,
      timestamp: Date.now(),
      properties: { count: i }
    }));

    await TelemetryIngestionService.ingestBatch(titleId, batch1);
    // Buffer reaches 1,000 -> triggers automatic flush
    expect(flushCount).toBeGreaterThanOrEqual(1);

    const batch2 = Array.from({ length: 500 }, (_, i) => ({
      titleId,
      eventName: "event_b",
      playerId: `p_${i + 1000}`,
      timestamp: Date.now(),
      properties: { count: i }
    }));
    await TelemetryIngestionService.ingestBatch(titleId, batch2);

    await TelemetryIngestionService.flushAll();
    const totalStored = await TelemetryIngestionService.getEventCount(titleId);
    expect(totalStored).toBe(1500);
  });
});
