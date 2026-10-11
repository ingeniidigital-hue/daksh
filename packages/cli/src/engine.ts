import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import net from "net";

/**
 * Checks if the local Docker daemon is running and responsive.
 */
export async function checkDockerDaemon(): Promise<boolean> {
  return new Promise((resolve) => {
    exec("docker info", { timeout: 3000 }, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Checks if a specific network port is free or occupied on localhost.
 */
export async function checkPortAvailability(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

/**
 * Parses and returns the root docker-compose.yml configuration as a structured object.
 */
export function getComposeConfig(composeFilePath?: string): any {
  const filePath = composeFilePath || path.resolve(__dirname, "../../../docker-compose.yml");
  if (!fs.existsSync(filePath)) {
    throw new Error(`docker-compose.yml not found at: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");

  // Lightweight YAML parser for compose services to avoid external heavy parser
  const services: Record<string, any> = {};
  const lines = raw.split("\n");
  let currentService = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const serviceMatch = line.match(/^  ([a-zA-Z0-9_-]+):/);
    if (serviceMatch) {
      currentService = serviceMatch[1];
      services[currentService] = { environment: [] };
      continue;
    }

    if (currentService) {
      const imageMatch = line.match(/image:\s*([^\s]+)/);
      if (imageMatch) {
        services[currentService].image = imageMatch[1];
      }
      const envMatch = line.match(/- ([A-Z0-9_]+=.+)/);
      if (envMatch) {
        services[currentService].environment.push(envMatch[1]);
      }
    }
  }

  return { services };
}

/**
 * Verifies that the Nakama healthcheck endpoint returns HTTP 200 within a timeout.
 */
export async function verifyHealthcheck(
  url: string = "http://localhost:7350/v2/healthcheck",
  customFetch?: any
): Promise<boolean> {
  const fetchFn = customFetch || globalThis.fetch;
  try {
    const res = await fetchFn(url);
    return res.status === 200 || res.ok === true;
  } catch (err) {
    return false;
  }
}

/**
 * Boots the containerized stack in detached mode using docker compose.
 */
export async function startStack(composePath?: string): Promise<boolean> {
  const fileArg = composePath ? `-f "${composePath}"` : "";
  return new Promise((resolve) => {
    exec(`docker compose ${fileArg} up -d`, (err) => {
      resolve(!err);
    });
  });
}

/**
 * Stops the containerized stack.
 */
export async function stopStack(composePath?: string): Promise<boolean> {
  const fileArg = composePath ? `-f "${composePath}"` : "";
  return new Promise((resolve) => {
    exec(`docker compose ${fileArg} down`, (err) => {
      resolve(!err);
    });
  });
}
