import { describe, it, expect, vi } from "vitest";
import { checkDockerDaemon, checkPortAvailability, getComposeConfig, verifyHealthcheck } from "../src/engine";
import net from "net";

describe("STORY-01 / TDD: Local-First Core Engine & 1-Command CLI Bootstrapper", () => {

  it("TEST-01-A [Happy Path]: should verify Docker daemon status", async () => {
    const isDockerRunning = await checkDockerDaemon();
    expect(typeof isDockerRunning).toBe("boolean");
  });

  it("TEST-01-A2 [Compose Config]: should validate root docker-compose.yml configuration", () => {
    const config = getComposeConfig();
    expect(config).toBeDefined();
    expect(config.services).toHaveProperty("nakama");
    expect(config.services).toHaveProperty("postgres");
    expect(config.services).toHaveProperty("redis");

    expect(config.services.nakama.image).toContain("heroiclabs/nakama");
    expect(config.services.postgres.image).toContain("postgres:16");
    expect(config.services.redis.image).toContain("redis:7");
  });

  it("TEST-01-B [Healthcheck]: should verify healthcheck endpoint logic", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ status: "ok" })
    });

    const isHealthy = await verifyHealthcheck("http://localhost:7350/v2/healthcheck", mockFetch);
    expect(isHealthy).toBe(true);
  });

  it("TEST-01-C [Failure Mode]: should detect port conflict when port 7350 is occupied", async () => {
    // Spin up a dummy server on an arbitrary test port
    const testPort = 19876;
    const server = net.createServer();
    await new Promise<void>((resolve) => server.listen(testPort, "127.0.0.1", () => resolve()));

    const isAvailable = await checkPortAvailability(testPort);
    expect(isAvailable).toBe(false);

    await new Promise<void>((resolve) => server.close(() => resolve()));
    const isAvailableAfterClose = await checkPortAvailability(testPort);
    expect(isAvailableAfterClose).toBe(true);
  });

  it("TEST-01-D [Air-Gap Check]: compose environment should define deterministic offline credentials", () => {
    const config = getComposeConfig();
    expect(config.services.postgres.environment).toContain("POSTGRES_DB=daksh");
    expect(config.services.postgres.environment).toContain("POSTGRES_PASSWORD=localdb");
  });

});
