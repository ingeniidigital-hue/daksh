import { NextResponse } from "next/server";
import net from "net";

function probeTcpPort(host: string, port: number, timeoutMs = 1500): Promise<{ reachable: boolean; latencyMs: number }> {
  const start = Date.now();
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      const latencyMs = Date.now() - start;
      isResolved = true;
      socket.destroy();
      resolve({ reachable: true, latencyMs });
    });

    socket.on("timeout", () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ reachable: false, latencyMs: Date.now() - start });
      }
    });

    socket.on("error", () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ reachable: false, latencyMs: Date.now() - start });
      }
    });

    socket.connect(port, host);
  });
}

async function probeNakamaHttp(url: string, timeoutMs = 2000): Promise<{ reachable: boolean; status: number; latencyMs: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return {
      reachable: res.ok || res.status === 200,
      status: res.status,
      latencyMs: Date.now() - start
    };
  } catch (e) {
    return {
      reachable: false,
      status: 0,
      latencyMs: Date.now() - start
    };
  }
}

export async function GET() {
  const [nakama, postgres, redis] = await Promise.all([
    probeNakamaHttp("http://127.0.0.1:7350/v2/healthcheck"),
    probeTcpPort("127.0.0.1", 5432),
    probeTcpPort("127.0.0.1", 6379)
  ]);

  const allHealthy = nakama.reachable && postgres.reachable && redis.reachable;

  return NextResponse.json({
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      nakama: {
        name: "Nakama Game Engine",
        port: 7350,
        status: nakama.reachable ? "online" : "offline",
        latencyMs: nakama.latencyMs,
        httpStatus: nakama.status
      },
      postgres: {
        name: "PostgreSQL 16",
        port: 5432,
        status: postgres.reachable ? "online" : "offline",
        latencyMs: postgres.latencyMs
      },
      redis: {
        name: "Redis 7 Cache",
        port: 6379,
        status: redis.reachable ? "online" : "offline",
        latencyMs: redis.latencyMs
      }
    }
  });
}
