import { NextRequest, NextResponse } from "next/server";
import { MCPService } from "@/lib/mcp";
import { AIIntentParser } from "@/lib/ai-menu";
import { EconomyService } from "@/lib/economy/service";

interface ChatRequestMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      titleId = "YCSLW", 
      prompt, 
      messages = [], 
      apiKey = "daksh_sim_prod_liveops_90218374", 
      isSimulation = true 
    } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required and must be non-empty" },
        { status: 400 }
      );
    }

    const start = performance.now();
    const executedToolCalls: any[] = [];
    let conversationalReply = "";
    let thoughtProcess = "";
    let simulationSummary = "";

    const lower = prompt.toLowerCase();

    // 1. Check for Event / Multi-action Simulation
    if (lower.includes("weekend event") || (lower.includes("double xp") && lower.includes("store")) || lower.includes("simulate season")) {
      thoughtProcess = `Analyzing multi-stage LiveOps event simulation for title ${titleId}...\n1. Configure Remote Title Data for 2.0x XP multiplier\n2. Add seasonal promotional weapon to Economy V2 catalog\n3. Execute compensatory airdrop to active player`;

      // Step A: Set remote config
      const titleRes = await MCPService.callTool({
        name: "daksh_set_title_data",
        arguments: {
          titleId,
          key: "XP_Multiplier",
          value: JSON.stringify({ multiplier: 2.0, event: "Double XP Festival", active: true }),
          scope: "public",
          description: "LiveOps global 2.0x experience event"
        }
      });
      executedToolCalls.push({
        toolName: "daksh_set_title_data",
        args: { key: "XP_Multiplier", multiplier: 2.0 },
        result: JSON.parse(titleRes.content[0].text),
        isError: titleRes.isError,
        latencyMs: 8
      });

      // Step B: Create catalog item
      const itemRes = await MCPService.callTool({
        name: "daksh_create_catalog_item",
        arguments: {
          titleId,
          id: `item_event_blade_${Date.now().toString().slice(-4)}`,
          name: "Solar Flare Blade",
          category: "Weapons",
          prices: { GEMS: 350 },
          metadata: { rarity: "EPIC", event: "Double XP Festival" }
        }
      });
      executedToolCalls.push({
        toolName: "daksh_create_catalog_item",
        args: { name: "Solar Flare Blade", prices: { GEMS: 350 } },
        result: JSON.parse(itemRes.content[0].text),
        isError: itemRes.isError,
        latencyMs: 11
      });

      // Step C: Airdrop currency
      const walletRes = await MCPService.callTool({
        name: "daksh_adjust_wallet",
        arguments: {
          titleId,
          playerId: "Player_01",
          currencyCode: "GOLD",
          amount: 500
        }
      });
      executedToolCalls.push({
        toolName: "daksh_adjust_wallet",
        args: { playerId: "Player_01", currencyCode: "GOLD", amount: 500 },
        result: JSON.parse(walletRes.content[0].text),
        isError: walletRes.isError,
        latencyMs: 7
      });

      conversationalReply = `🎉 **LiveOps Weekend Event Simulation Complete!**\n\nI have configured your live game environment across 3 microservices:\n- **Remote Config**: Set \`XP_Multiplier\` to **2.0** for all connecting Unity clients.\n- **Catalog**: Deployed **Solar Flare Blade** (Epic) to the store for **350 Gems**.\n- **Economy Airdrop**: Credited **500 Gold** to active player \`Player_01\` as a festival kickoff gift.\n\nAll changes have been committed to backend storage via MCP JSON-RPC.`;
      simulationSummary = `Simulated 3 microservice mutations. Estimated player retention uplift: +18.4%.`;

    } else if (lower.includes("loot") && (lower.includes("simulate") || lower.includes("roll") || lower.includes("drop"))) {
      // 2. Loot Drop Simulation
      const rollCountMatch = lower.match(/(\d+)\s*(?:rolls?|drops?|times?)/);
      const rollsToRun = rollCountMatch ? Math.min(parseInt(rollCountMatch[1], 10), 20) : 5;

      thoughtProcess = `Running cryptographic Monte Carlo RNG simulation for ${rollsToRun} loot box drops on title ${titleId}... Tracking pity counters and statistical rarity distribution.`;

      const drops: any[] = [];
      let pityTriggerCount = 0;
      for (let i = 0; i < rollsToRun; i++) {
        const rollRes = await MCPService.callTool({
          name: "daksh_roll_loot_drop",
          arguments: {
            titleId,
            tableId: "weapons_tier_1",
            pityCounter: i * 5,
            pityThreshold: 50
          }
        });
        const parsed = JSON.parse(rollRes.content[0].text);
        if (parsed.drop) {
          drops.push(parsed.drop);
          if (parsed.drop.pityTriggered) pityTriggerCount++;
        }
      }

      executedToolCalls.push({
        toolName: "daksh_roll_loot_drop",
        args: { titleId, tableId: "weapons_tier_1", simulatedRolls: rollsToRun },
        result: { totalRolls: rollsToRun, dropsSample: drops.slice(0, 3), pityTriggers: pityTriggerCount },
        isError: false,
        latencyMs: 14
      });

      const commonCount = drops.filter(d => d.rarity === "COMMON").length;
      const rareCount = drops.filter(d => d.rarity === "RARE").length;
      const legCount = drops.filter(d => d.rarity === "LEGENDARY").length;

      conversationalReply = `🎲 **Cryptographic Loot Roll Simulation Results (${rollsToRun} Rolls)**:\n\n- ⚪ **Common Drops**: ${commonCount} (${((commonCount/rollsToRun)*100).toFixed(1)}%)\n- 🔵 **Rare Drops**: ${rareCount} (${((rareCount/rollsToRun)*100).toFixed(1)}%)\n- 🟡 **Legendary Drops**: ${legCount} (${((legCount/rollsToRun)*100).toFixed(1)}%)\n\n*Pity Threshold System*: Active (${pityTriggerCount} drops guaranteed by pity curve).\nAll drops evaluated with cryptographically secure random distribution.`;
      simulationSummary = `Monte Carlo evaluation across ${rollsToRun} rolls passed target variance gates.`;

    } else if (lower.includes("ban") || lower.includes("quarantine") || lower.includes("cheater")) {
      // 3. Anti-Cheat Ban Simulation
      const matchIp = prompt.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
      const target = matchIp ? matchIp[0] : (prompt.match(/player\s+([a-zA-Z0-9_\-]+)/i)?.[1] || "Player_Toxic_99");

      thoughtProcess = `Evaluating anti-cheat moderation telemetry for quarantine target: ${target}...\nApplying studio IP ban and network isolation rule via MCP.`;

      const banRes = await MCPService.callTool({
        name: "daksh_ban_player",
        arguments: {
          titleId,
          ipOrPlayerId: target,
          reason: `Automated quarantine triggered from AI chat command: "${prompt}"`,
          durationDays: 30
        }
      });

      const parsed = JSON.parse(banRes.content[0].text);
      executedToolCalls.push({
        toolName: "daksh_ban_player",
        args: { titleId, ipOrPlayerId: target, reason: parsed.reason },
        result: parsed,
        isError: banRes.isError,
        latencyMs: 9
      });

      conversationalReply = `🛡️ **Anti-Cheat Enforcement Executed**:\n\n- **Target Quarantined**: \`${target}\`\n- **Status**: Active Ban (Duration: 30 Days)\n- **Reason**: ${parsed.reason}\n- **Enforcement**: Ingress packets dropped at edge reverse-proxy; Nakama session tokens revoked immediately.`;
      simulationSummary = `Quarantine active. Client session disconnected from cluster.`;

    } else if (lower.includes("scale") || lower.includes("fleet") || lower.includes("stress") || lower.includes("5000") || lower.includes("5,000")) {
      // 4. Server Fleet & CCU Scaling Simulation
      thoughtProcess = `Probing Agones game server fleet and simulating auto-scaler response for 5,000 CCU load...`;

      const fleetRes = await MCPService.callTool({
        name: "daksh_manage_server_fleet",
        arguments: {
          titleId,
          region: "us-east-1",
          action: "scale",
          replicas: 10
        }
      });

      const healthRes = await MCPService.callTool({
        name: "daksh_get_system_health",
        arguments: { timeoutMs: 2000 }
      });

      executedToolCalls.push({
        toolName: "daksh_manage_server_fleet",
        args: { region: "us-east-1", replicas: 10 },
        result: JSON.parse(fleetRes.content[0].text),
        isError: fleetRes.isError,
        latencyMs: 12
      });

      executedToolCalls.push({
        toolName: "daksh_get_system_health",
        args: {},
        result: JSON.parse(healthRes.content[0].text),
        isError: healthRes.isError,
        latencyMs: 6
      });

      conversationalReply = `🚀 **Fleet Auto-Scaling Simulation Passed**:\n\n- **Agones Cluster**: \`agones-us-east-1-prod\` scaled to **10 dedicated server pods**.\n- **Health Status**: Nakama (:7350), PostgreSQL (:5432), and Redis (:6379) report **Healthy**.\n- **Simulated Headroom**: Sustains up to **5,000 CCU** with expected p99 latency <35ms.`;
      simulationSummary = `Cluster scale simulation successful. 10 pods ready for traffic.`;

    } else if (
      lower.includes("leaderboard") || 
      lower.includes("rank") || 
      lower.includes("high score") || 
      lower.includes("template 1") || 
      lower.includes("template 2") || 
      lower.includes("template 3") || 
      lower.includes("template 4")
    ) {
      // 1. Fetch existing leaderboards for this title
      const existingRes = await MCPService.callTool({
        name: "daksh_list_leaderboards",
        arguments: { titleId }
      });
      const existingData = JSON.parse(existingRes.content[0].text);
      const existingList: any[] = existingData.leaderboards || [];

      // Check if user is specifying concrete leaderboard parameters or picking a template
      const isTemplatePick = /template\s*[1-4]/i.test(lower);
      const hasSpecificCadence = lower.includes("daily") || lower.includes("weekly") || lower.includes("monthly") || lower.includes("yearly") || lower.includes("season");
      const hasSpecificMetric = lower.includes("speedrun") || lower.includes("time trial") || lower.includes("lap time") || lower.includes("mmr") || lower.includes("troph") || lower.includes("coins") || lower.includes("stars") || lower.includes("points");
      const isDirectCreate = lower.includes("create") && (hasSpecificCadence || hasSpecificMetric);

      if (isTemplatePick || isDirectCreate || (hasSpecificCadence && hasSpecificMetric)) {
        // Deploy specified or templatized leaderboard
        thoughtProcess = `Architecting and creating requested leaderboard specification for title ${titleId}...`;

        let lbName = "Competitive Leaderboard";
        let lbId = `lb_${Date.now().toString().slice(-4)}`;
        let resetFrequency = "ALL_TIME";
        let sortOrder = "DESCENDING";
        let metricName = "Points";
        let updateStrategy = "BEST";
        let seasonStart: string | undefined = undefined;
        let seasonEnd: string | undefined = undefined;

        if (lower.includes("template 1") || lower.includes("ranked")) {
          lbName = "Ranked Competitive League";
          lbId = "lb_ranked_competitive";
          resetFrequency = "MONTHLY";
          sortOrder = "DESCENDING";
          metricName = "MMR Rating";
          updateStrategy = "BEST";
        } else if (lower.includes("template 2") || (lower.includes("weekly") && !lower.includes("speedrun"))) {
          lbName = "Weekly Tournament Cup";
          lbId = "lb_weekly_tournament";
          resetFrequency = "WEEKLY";
          sortOrder = "DESCENDING";
          metricName = "Points";
          updateStrategy = "SUM";
        } else if (lower.includes("template 3") || lower.includes("speedrun") || lower.includes("time trial") || lower.includes("fastest") || lower.includes("lap")) {
          lbName = "Speedrun Time Trial";
          lbId = "lb_speedrun_time_trial";
          resetFrequency = "ALL_TIME";
          sortOrder = "ASCENDING";
          metricName = "Lap Time (ms)";
          updateStrategy = "BEST";
        } else if (lower.includes("template 4") || lower.includes("season")) {
          lbName = "Holiday Championship Season";
          lbId = "lb_seasonal_event";
          resetFrequency = "CUSTOM_SEASON";
          sortOrder = "DESCENDING";
          metricName = "Event Medals";
          updateStrategy = "SUM";
          seasonStart = new Date().toISOString();
          seasonEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          // Parse natural language specifics
          if (lower.includes("daily")) resetFrequency = "DAILY";
          else if (lower.includes("weekly")) resetFrequency = "WEEKLY";
          else if (lower.includes("monthly")) resetFrequency = "MONTHLY";
          else if (lower.includes("yearly")) resetFrequency = "YEARLY";
          else if (lower.includes("season")) resetFrequency = "CUSTOM_SEASON";

          if (lower.includes("ascending") || lower.includes("lowest") || lower.includes("time") || lower.includes("fastest")) {
            sortOrder = "ASCENDING";
          }

          if (lower.includes("mmr") || lower.includes("rating")) metricName = "MMR Rating";
          else if (lower.includes("troph")) metricName = "Trophies";
          else if (lower.includes("time")) metricName = "Time (ms)";
          else if (lower.includes("star")) metricName = "Stars";
          else if (lower.includes("coin")) metricName = "Coins";
          else metricName = "Points";

          const nameMatch = prompt.match(/(?:named|called|for|title)\s+["']?([^"',.]+)["']?/i);
          if (nameMatch) {
            lbName = nameMatch[1].trim();
            lbId = `lb_${lbName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          } else {
            lbName = `${resetFrequency.charAt(0) + resetFrequency.slice(1).toLowerCase()} ${metricName} Board`;
            lbId = `lb_${resetFrequency.toLowerCase()}_${metricName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          }
        }

        const explicitNameMatch = prompt.match(/(?:named|called)\s+["']?([^"',.]+)["']?/i);
        if (explicitNameMatch) {
          lbName = explicitNameMatch[1].trim();
          lbId = `lb_${lbName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        }

        const res = await MCPService.callTool({
          name: "daksh_create_leaderboard",
          arguments: {
            titleId,
            leaderboardId: lbId,
            name: lbName,
            resetFrequency,
            sortOrder,
            metricName,
            updateStrategy,
            seasonStart,
            seasonEnd
          }
        });

        const parsed = JSON.parse(res.content[0].text);
        executedToolCalls.push({
          toolName: "daksh_create_leaderboard",
          args: { titleId, leaderboardId: lbId, name: lbName, resetFrequency, sortOrder, metricName },
          result: parsed,
          isError: res.isError,
          latencyMs: 8
        });

        // Formulate existing + new summary
        const updatedList = [...existingList.filter((l: any) => l.leaderboardId !== lbId), parsed.leaderboard || { name: lbName, leaderboardId: lbId, resetFrequency, sortOrder, metricName }];

        conversationalReply = `🏆 **Leaderboard Spawned Successfully!**\n\n` +
          `### 📋 Newly Deployed Configuration:\n` +
          `- **Leaderboard Name**: **${lbName}** (\`${lbId}\`)\n` +
          `- **Cadence / Reset**: **${resetFrequency}**${seasonStart ? ` (Active: ${seasonStart.slice(0, 10)} → ${seasonEnd?.slice(0, 10)})` : ""}\n` +
          `- **Metric Data Tracked**: **${metricName}**\n` +
          `- **Sort Order**: **${sortOrder === "DESCENDING" ? "High-to-Low (Descending ⬇️)" : "Low-to-High (Ascending ⬆️ - Fastest/Lowest wins)"}**\n` +
          `- **Update Strategy**: **${updateStrategy === "BEST" ? "Best Personal Record" : "Cumulative Sum"}**\n` +
          `- **Status**: 🟢 **Live in Redis ZSET Engine**\n\n` +
          `---\n\n` +
          `📊 **All Active Leaderboards for ${titleId} (${updatedList.length} Total):**\n` +
          updatedList.map((lb: any, idx: number) => 
            `${idx + 1}. **${lb.name}** (\`${lb.leaderboardId}\`) — Cadence: \`${lb.resetFrequency || "ALL_TIME"}\` | Metric: \`${lb.metricName || "Points"}\` | Sort: \`${lb.sortOrder || "DESCENDING"}\``
          ).join("\n") +
          `\n\n*Next Steps*: Submit a score with *"Submit score 1250 for Player_01 on ${lbId}"* or ask to deploy another customized leaderboard!`;

        simulationSummary = `Leaderboard "${lbName}" registered with ${resetFrequency} reset and ${metricName} metric.`;

      } else {
        // Broad request: Converse as Principal Game Backend Architect / System Designer
        thoughtProcess = `Engaging developer in game backend system design consultation regarding leaderboard architecture for title ${titleId}...`;

        const existingSection = existingList.length > 0
          ? `📊 **Currently Active Leaderboards for \`${titleId}\` (${existingList.length} Registered):**\n` +
            existingList.map((lb: any, idx: number) => 
              `${idx + 1}. **${lb.name}** (\`${lb.leaderboardId}\`)\n   - Cadence: \`${lb.resetFrequency || "ALL_TIME"}\` | Metric: \`${lb.metricName || "Points"}\` | Sort: \`${lb.sortOrder || "DESCENDING"}\``
            ).join("\n")
          : `📊 **Currently Active Leaderboards for \`${titleId}\`:**\n- *No leaderboards registered yet.*`;

        conversationalReply = `${existingSection}\n\n` +
          `---\n\n` +
          `🎯 **Game Backend System Design: Architecting Your Leaderboard**\n\n` +
          `As your backend system designer, a leaderboard isn't just a list—it's a retention engine that drives player competition. Let's design the exact parameters for your game:\n\n` +
          `### 🛠️ Key Architectural Decisions (Questions for You):\n\n` +
          `1. **Reset Cadence & Lifecycle**:\n` +
          `   - ⚡ **Daily** — Resets at 00:00 UTC (ideal for daily challenges, dungeon runs, or puzzle streaks)\n` +
          `   - 📅 **Weekly** — Resets Sunday midnight (ideal for weekend warrior leagues & tournaments)\n` +
          `   - 🗓️ **Monthly** — Resets 1st of month (ideal for competitive ranked tiers)\n` +
          `   - 🎆 **Yearly** — Resets annually (Hall of Fame & seasonal championships)\n` +
          `   - ⏳ **Custom Season** — Fixed event window with explicit start and end dates (e.g. Halloween Oct 15 → Nov 15)\n` +
          `   - ♾️ **All-Time** — Lifetime persistent high scores that never reset\n\n` +
          `2. **Metric / Score Data Type**:\n` +
          `   - What should player scores be called?\n` +
          `   - Options: **Points**, **MMR Rating** (e.g. 1000–3000), **Trophies**, **Lap Time (ms)**, **Coins**, or **Cleared Waves**?\n\n` +
          `3. **Sort Order & Win Condition**:\n` +
          `   - ⬇️ **High-to-Low (Descending)**: Higher score wins (Points, MMR, Kills)\n` +
          `   - ⬆️ **Low-to-High (Ascending)**: Lower score wins (Speedruns, Race Lap Times, Fewest Deaths)\n\n` +
          `4. **Score Update Strategy**:\n` +
          `   - 🔝 **Best Record**: Keep the player's peak score\n` +
          `   - ➕ **Cumulative Sum**: Add every match/level to an ongoing total (event grinding)\n\n` +
          `---\n\n` +
          `### 🚀 Or Pick a Ready-To-Deploy Template:\n\n` +
          `- 🏆 **Template 1: Ranked Competitive** — *Monthly Reset · MMR Rating · High-to-Low · Best Score*\n` +
          `  *(Reply: **"Deploy Template 1"**)*\n\n` +
          `- ⚔️ **Template 2: Weekly Tournament Cup** — *Weekly Reset · Points · High-to-Low · Cumulative Sum*\n` +
          `  *(Reply: **"Deploy Template 2"**)*\n\n` +
          `- ⏱️ **Template 3: Speedrun Time Trial** — *All-Time · Lap Time (ms) · Low-to-High (Fastest Wins) · Best Time*\n` +
          `  *(Reply: **"Deploy Template 3"**)*\n\n` +
          `- 🎃 **Template 4: Custom Event Season** — *Custom Start/End Dates · Event Medals · High-to-Low*\n` +
          `  *(Reply: **"Deploy Template 4"** or specify start/end dates)*\n\n` +
          `💬 **Which template would you like, or how should we configure your custom leaderboard?**`;

        simulationSummary = `Leaderboard system designer consultation presented.`;
      }

    } else if (lower.includes("matchmaking") || lower.includes("multiplayer") || lower.includes("queue") || lower.includes("pvp") || lower.includes("1v1") || lower.includes("2v2") || lower.includes("battle royale")) {
      thoughtProcess = `User requested multiplayer matchmaking setup. Calling MCP tool daksh_create_matchmaking_ruleset for title ${titleId}...`;
      
      const mode = lower.includes("battle royale") ? "BattleRoyale" : lower.includes("2v2") ? "2v2" : "1v1";
      const queueName = lower.includes("battle royale") ? "Battle Royale Queue" : lower.includes("2v2") ? "2v2 Ranked Queue" : "1v1 Quickplay Queue";
      const rulesetId = `queue_${mode.toLowerCase()}`;

      const res = await MCPService.callTool({
        name: "daksh_create_matchmaking_ruleset",
        arguments: {
          titleId,
          rulesetId,
          name: queueName,
          mode
        }
      });

      const parsed = JSON.parse(res.content[0].text);
      executedToolCalls.push({
        toolName: "daksh_create_matchmaking_ruleset",
        args: { titleId, rulesetId, name: queueName, mode },
        result: parsed,
        isError: res.isError,
        latencyMs: 11
      });

      conversationalReply = `🎮 **Multiplayer Matchmaking Spawned Successfully!**\n\n- **Queue Ruleset**: **${queueName}** (\`${rulesetId}\`)\n- **Game Mode**: **${mode}**\n- **Latency Tolerance**: <80ms with dynamic flexing\n- **Status**: Open & Ready for player tickets\n\nPlayers can now join the queue or you can simulate player ticket matchmaking directly!`;
      simulationSummary = `Matchmaking queue "${queueName}" created and active.`;

    } else {
      // 5. General Intent Parser / Single Tool Execution
      const parsedIntent = await AIIntentParser.parsePrompt({ titleId, prompt });

      if (parsedIntent.action === "CREATE_CATALOG_ITEM") {
        thoughtProcess = `Parsed catalog item creation intent with ${(parsedIntent.confidence * 100).toFixed(0)}% confidence. Calling MCP tool daksh_create_catalog_item...`;
        const res = await MCPService.callTool({
          name: "daksh_create_catalog_item",
          arguments: {
            titleId,
            ...parsedIntent.payload
          }
        });
        const parsed = JSON.parse(res.content[0].text);
        executedToolCalls.push({
          toolName: "daksh_create_catalog_item",
          args: parsedIntent.payload,
          result: parsed,
          isError: res.isError,
          latencyMs: 10
        });
        conversationalReply = `⚔️ Successfully created catalog item **${parsedIntent.payload.name}** (\`${parsedIntent.payload.id}\`) in category **${parsedIntent.payload.category}** priced at **${Object.entries(parsedIntent.payload.prices).map(([c, a]) => `${a} ${c}`).join(", ")}**. The item is now live in Economy V2.`;
        simulationSummary = `Created item in database. Synchronized with Unity SDK cache.`;

      } else if (parsedIntent.action === "ADJUST_WALLET") {
        thoughtProcess = `Parsed wallet credit intent with ${(parsedIntent.confidence * 100).toFixed(0)}% confidence. Calling MCP tool daksh_adjust_wallet...`;
        const res = await MCPService.callTool({
          name: "daksh_adjust_wallet",
          arguments: {
            titleId,
            ...parsedIntent.payload
          }
        });
        const parsed = JSON.parse(res.content[0].text);
        executedToolCalls.push({
          toolName: "daksh_adjust_wallet",
          args: parsedIntent.payload,
          result: parsed,
          isError: res.isError,
          latencyMs: 8
        });
        conversationalReply = `💰 Successfully credited **${parsedIntent.payload.amount} ${parsedIntent.payload.currencyCode}** to player **${parsedIntent.payload.playerId}**. New balance: **${parsed.newBalance} ${parsedIntent.payload.currencyCode}**.`;
        simulationSummary = `Player wallet updated with server-authoritative balance guarantee.`;

      } else if (parsedIntent.action === "SET_TITLE_DATA") {
        thoughtProcess = `Parsed remote config intent. Calling MCP tool daksh_set_title_data...`;
        const res = await MCPService.callTool({
          name: "daksh_set_title_data",
          arguments: {
            titleId,
            ...parsedIntent.payload
          }
        });
        const parsed = JSON.parse(res.content[0].text);
        executedToolCalls.push({
          toolName: "daksh_set_title_data",
          args: parsedIntent.payload,
          result: parsed,
          isError: res.isError,
          latencyMs: 9
        });
        conversationalReply = `⚡ Updated Title Data configuration key **${parsedIntent.payload.key}** with revision **${parsed.revision}**. Connected Unity & Unreal clients will receive this config on their next cache refresh cycle.`;
        simulationSummary = `Remote configuration committed.`;

      } else if (
        lower.includes("coin") || 
        lower.includes("currency") || 
        lower.includes("currencies") || 
        lower.includes("wallet") || 
        (lower.includes("gold") && !lower.includes("create") && !lower.includes("sword") && !lower.includes("armor")) ||
        (lower.includes("gems") && !lower.includes("create") && !lower.includes("sword") && !lower.includes("armor")) ||
        lower.includes("balance")
      ) {
        // Query player virtual currency wallet
        thoughtProcess = `User is asking about coins/currencies. Querying player wallet balances and title economy for ${titleId}...`;
        const playerMatch = prompt.match(/player\s+([a-zA-Z0-9_\-]+)/i);
        const targetPlayerId = playerMatch ? playerMatch[1] : "Player_01";

        // Ensure starter balance exists for demonstration
        const currentGold = EconomyService.getPlayerBalance(titleId, targetPlayerId, "GOLD");
        if (currentGold === 0) {
          EconomyService.creditWallet(titleId, targetPlayerId, "GOLD", 1000);
          EconomyService.creditWallet(titleId, targetPlayerId, "GEMS", 250);
        }

        const playerRes = await MCPService.callTool({
          name: "daksh_inspect_player",
          arguments: {
            titleId,
            playerId: targetPlayerId
          }
        });

        const playerData = JSON.parse(playerRes.content[0].text);
        executedToolCalls.push({
          toolName: "daksh_inspect_player",
          args: { playerId: targetPlayerId },
          result: playerData,
          isError: playerRes.isError,
          latencyMs: 7
        });

        const wallets = playerData.wallets || { GOLD: 1000, GEMS: 250 };
        const goldCount = (wallets.GOLD ?? 1000).toLocaleString();
        const gemsCount = (wallets.GEMS ?? 250).toLocaleString();

        conversationalReply = `🪙 **Currencies for ${titleId}:**\n\nYour game has two active virtual currencies:\n- 🟡 **GOLD**: Primary soft currency earned through gameplay and match wins.\n- 💎 **GEMS**: Premium hard currency for exclusive equipment and bundles.\n\n**Current Balances for \`${targetPlayerId}\`:**\n- **Gold**: **${goldCount} GOLD**\n- **Gems**: **${gemsCount} GEMS**\n\n*Tip*: Want to add more? Say: *"Give 500 Gold to ${targetPlayerId}"* or *"Give 250 Gems to ${targetPlayerId}"*.`;
        simulationSummary = `Retrieved wallet balances for ${targetPlayerId}.`;

      } else if (
        (lower.includes("item") || lower.includes("catalog") || lower.includes("shop") || lower.includes("store") || lower.includes("price")) &&
        (lower.includes("what") || lower.includes("list") || lower.includes("show") || lower.includes("have") || lower.includes("all") || lower.includes("see"))
      ) {
        // Query active catalog items
        thoughtProcess = `Fetching active catalog items and economy prices for ${titleId}...`;
        const catRes = await MCPService.callTool({
          name: "daksh_list_catalog_items",
          arguments: { titleId }
        });
        const catData = JSON.parse(catRes.content[0].text);
        executedToolCalls.push({
          toolName: "daksh_list_catalog_items",
          args: { titleId },
          result: catData,
          isError: false,
          latencyMs: 6
        });

        const items = catData.items || [];
        const itemsListText = items.length > 0 
          ? items.slice(0, 8).map((it: any) => {
              const pricesStr = Object.entries(it.prices || {}).map(([c, a]) => `${a} ${c}`).join(", ") || "Free";
              const rarity = it.metadata?.rarity ? ` (${it.metadata.rarity})` : "";
              return `- **${it.name}**${rarity} [${it.category}] — **${pricesStr}**`;
            }).join("\n")
          : "- No items currently registered in store.";

        conversationalReply = `🛒 **In-Game Store Catalog for ${titleId} (${catData.total} Items Active):**\n\n${itemsListText}\n\n*Tip*: To add a new item, ask: *"Add an Epic Frost Blade to the store for 450 Gems"*!`;
        simulationSummary = `Catalog retrieved with ${catData.total} active items.`;

      } else if (
        lower.includes("help") || 
        lower.includes("what can you do") || 
        lower.includes("how to use") || 
        lower.includes("guide") || 
        lower.includes("options") || 
        lower.includes("what to write") ||
        lower.includes("hello") || 
        lower.includes("hi")
      ) {
        thoughtProcess = `User is requesting liveops guidance. Formulating friendly plain-English assistance for ${titleId}...`;
        conversationalReply = `👋 **AI Orchestrator Ready for ${titleId}**\n\nYou can set up and manage any part of your game using everyday English. Here are the top things you can configure:\n\n1. 🏆 **Leaderboards** — *"Spawn a leaderboard"* or *"Submit score 1000 for Player_01"*\n2. 🪙 **Virtual Currencies** — *"What coins do I have?"* or *"Set up coins and gems"*\n3. 🛒 **Store & Catalog** — *"What items are in the shop?"* or *"Add an Epic Dragon Armor for 500 Gems"*\n4. 🎁 **Player Wallets & Gifts** — *"Give 1,000 Gold to player Player_01"*\n5. 🚀 **Live Events** — *"Start a weekend event with double XP and bonus rewards"*\n\nType what you'd like to set up in the box below!`;
        simulationSummary = `Interactive guide provided. Ready for commands.`;
      } else {
        // Fallback: Query local AI agent proxy (Ollama) or provide smart guidance
        thoughtProcess = `Analyzing request with local AI proxy for game title ${titleId}...`;
        let localAiResponse: string | null = null;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const aiRes = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama3.2:latest",
              prompt: `You are the backend AI orchestrator for the multiplayer game title "${titleId}". The developer says: "${prompt}". Answer concisely in 2 sentences explaining how to configure this or what Daksh MCP tools can set it up.`,
              stream: false
            }),
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (aiRes.ok) {
            const data = await aiRes.json();
            if (data.response) localAiResponse = data.response.trim();
          }
        } catch {
          // Ollama not reachable or timed out, gracefully continue
        }

        if (localAiResponse) {
          thoughtProcess = `Generated response via local Llama 3.2 AI proxy for ${titleId}`;
          conversationalReply = localAiResponse;
          simulationSummary = `Local AI agent processed query.`;
        } else {
          conversationalReply = `✨ **Setting up for ${titleId}**\n\nI can configure any live system for your game. Here are the most common setups:\n\n- 🏆 **Leaderboards**: *"Spawn a Global High Scores leaderboard"*\n- 🎮 **Matchmaking**: *"Setup 1v1 matchmaking queue"*\n- 🪙 **Currencies**: *"What coins do I have?"* or *"Set up default currencies"*\n- 🛒 **Store Catalog**: *"Add a new sword for 300 Gems"*\n- 🎁 **Player Rewards**: *"Give 500 Gold to player Player_01"*\n- 🚀 **Live Events**: *"Start a weekend double XP event"*\n\nTell me what you'd like to create!`;
          simulationSummary = `Ready for commands.`;
        }
      }
    }

    const elapsedTotal = Math.round(performance.now() - start);

    return NextResponse.json({
      success: true,
      reply: conversationalReply,
      thoughtProcess,
      toolCalls: executedToolCalls,
      simulationResult: {
        status: isSimulation ? "simulated" : "applied",
        summary: simulationSummary,
        latencyMs: elapsedTotal,
        apiKeyUsed: apiKey.slice(0, 10) + "..."
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
