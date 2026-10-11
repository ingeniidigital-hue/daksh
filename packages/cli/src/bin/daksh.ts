#!/usr/bin/env node
import { Command } from "commander";
import { checkDockerDaemon, checkPortAvailability, startStack, stopStack, verifyHealthcheck } from "../engine";
import { exec } from "child_process";
import path from "path";

const program = new Command();

program
  .name("daksh")
  .description("Daksh Game BaaS 1-Command CLI Bootstrapper")
  .version("0.1.0");

program
  .command("dev")
  .description("Start the local Daksh game engine (Nakama, PostgreSQL, Redis) and launch Studio Dashboard")
  .action(async () => {
    console.log("🚀 Initializing Daksh Local-First Core Engine...");

    // 1. Check Docker daemon
    process.stdout.write("  ⏳ Checking Docker daemon status... ");
    const isDockerAlive = await checkDockerDaemon();
    if (!isDockerAlive) {
      console.log("\n❌ Docker daemon is not running.");
      console.log("   👉 Please start Docker Desktop or the system docker service and try again.\n");
      process.exit(1);
    }
    console.log("✅ Ready.");

    // 2. Check ports 7350, 5432, 6379
    const requiredPorts = [
      { port: 7350, service: "Nakama Game Engine API" },
      { port: 5432, service: "PostgreSQL Database" },
      { port: 6379, service: "Redis Cache" }
    ];

    for (const p of requiredPorts) {
      const free = await checkPortAvailability(p.port);
      if (!free) {
        console.warn(`  ⚠️ Port ${p.port} (${p.service}) appears occupied or in use.`);
      }
    }

    // 3. Boot containers via docker compose
    console.log("  📦 Booting containerized stack (Nakama 3.22, PostgreSQL 16, Redis 7)...");
    const composeFile = path.resolve(__dirname, "../../../docker-compose.yml");
    const started = await startStack(composeFile);
    if (!started) {
      console.log("❌ Failed to boot Docker Compose stack. Check docker-compose logs.");
      process.exit(1);
    }
    console.log("  ✅ Containers launched in detached mode.");

    // 4. Poll healthcheck
    process.stdout.write("  ⏳ Waiting for Nakama healthcheck on port 7350... ");
    let healthy = false;
    for (let i = 0; i < 30; i++) {
      healthy = await verifyHealthcheck("http://localhost:7350/v2/healthcheck");
      if (healthy) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    if (healthy) {
      console.log("✅ HTTP 200 OK (Engine Ready!)");
    } else {
      console.log("⚠️ Healthcheck took longer than expected, stack is still initializing.");
    }

    // 5. Studio dashboard info
    console.log("\n=======================================================");
    console.log("🎉 Daksh Core Engine is now running locally!");
    console.log("   • Game Engine API:    http://localhost:7350");
    console.log("   • PostgreSQL 16:     localhost:5432 (db: daksh, user: postgres)");
    console.log("   • Redis 7:           localhost:6379");
    console.log("   • Studio Dashboard:   http://localhost:3000");
    console.log("=======================================================\n");

    // Launch browser if GUI available
    const openCommand = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    exec(`${openCommand} http://localhost:3000`, () => {});
  });

program
  .command("down")
  .description("Stop local Daksh containers")
  .action(async () => {
    console.log("🛑 Stopping Daksh containers...");
    const composeFile = path.resolve(__dirname, "../../../docker-compose.yml");
    await stopStack(composeFile);
    console.log("✅ Daksh stack stopped.");
  });

program.parse(process.argv);
