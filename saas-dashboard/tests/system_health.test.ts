import { describe, it, expect } from "vitest";
import { GET } from "../app/api/system/health/route";

describe("STORY-01 / Real System Health Probe API", () => {

  it("should probe local ports and return structured health status", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(["healthy", "degraded"]).toContain(data.status);
    expect(data).toHaveProperty("services");
    expect(data.services).toHaveProperty("nakama");
    expect(data.services).toHaveProperty("postgres");
    expect(data.services).toHaveProperty("redis");

    expect(data.services.nakama.port).toBe(7350);
    expect(data.services.postgres.port).toBe(5432);
    expect(data.services.redis.port).toBe(6379);

    expect(typeof data.services.nakama.latencyMs).toBe("number");
    expect(typeof data.services.postgres.latencyMs).toBe("number");
    expect(typeof data.services.redis.latencyMs).toBe("number");
  });

});
