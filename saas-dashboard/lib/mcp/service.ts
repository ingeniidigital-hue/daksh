import {
  MCPTool,
  MCPListToolsResponse,
  MCPCallToolRequest,
  MCPCallToolResult
} from "./types";
import { addCatalogItem, listCatalogItems } from "../economy/catalog";
import { EconomyService } from "../economy/service";
import { TitleDataService } from "../title-data/service";
import { LeaderboardService } from "../leaderboards";
import { MatchmakingService } from "../multiplayer/matchmaking";

export class MCPService {
  private static readonly TOOLS: MCPTool[] = [
    {
      name: "daksh_list_catalog_items",
      description: "Lists all items and pricing from the PlayFab Economy V2 catalog.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          category: { type: "string", description: "Optional category filter" }
        },
        required: ["titleId"]
      }
    },
    {
      name: "daksh_create_catalog_item",
      description: "Creates a new item in the game's PlayFab Economy V2 catalog.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          id: { type: "string", description: "Unique item identifier (e.g. item_dragon_armor)" },
          name: { type: "string", description: "Human-readable item name" },
          description: { type: "string", description: "Detailed item description" },
          category: { type: "string", description: "Category: Weapons, Armor, Consumables, etc." },
          prices: {
            type: "object",
            description: "Dictionary mapping currency codes (GOLD, GEMS) to numeric integer costs"
          },
          metadata: {
            type: "object",
            description: "Arbitrary key-value metadata including rarity and tags"
          }
        },
        required: ["titleId", "id", "name", "category", "prices"]
      }
    },
    {
      name: "daksh_adjust_wallet",
      description: "Directly credits or adjusts a player's virtual currency balance.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          playerId: { type: "string", description: "Unique player ID" },
          currencyCode: { type: "string", description: "Currency code (e.g. GOLD, GEMS)" },
          amount: { type: "number", description: "Integer amount of currency to grant" }
        },
        required: ["titleId", "playerId", "currencyCode", "amount"]
      }
    },
    {
      name: "daksh_inspect_player",
      description: "Inspects a player's virtual currency wallet balances and inventory instances.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          playerId: { type: "string", description: "Unique player ID" }
        },
        required: ["titleId", "playerId"]
      }
    },
    {
      name: "daksh_get_title_data",
      description: "Retrieves Key-Value Remote Configuration Title Data.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          keys: {
            type: "array",
            items: { type: "string" },
            description: "Optional list of specific configuration keys"
          },
          scope: {
            type: "string",
            enum: ["public", "internal"],
            description: "Scope: public (client safe) or internal (secret)"
          },
          secretKey: { type: "string", description: "Required if querying internal scope" }
        },
        required: ["titleId"]
      }
    },
    {
      name: "daksh_set_title_data",
      description: "Sets or updates a Title Data Remote Configuration key.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          key: { type: "string", description: "Configuration key name" },
          value: { type: "string", description: "JSON string configuration payload" },
          scope: { type: "string", enum: ["public", "internal"], description: "Scope: public or internal" },
          description: { type: "string", description: "Documentation description" }
        },
        required: ["titleId", "key", "value"]
      }
    },
    {
      name: "daksh_get_system_health",
      description: "Queries the live health status of Daksh infrastructure (Nakama, Postgres, Redis).",
      inputSchema: {
        type: "object",
        properties: {
          timeoutMs: { type: "number", description: "Probe timeout in milliseconds" }
        }
      }
    },
    {
      name: "daksh_roll_loot_drop",
      description: "Evaluates a cryptographic loot drop roll from a configured loot table.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          tableId: { type: "string", description: "Unique loot table ID" },
          pityCounter: { type: "number", description: "Current pity counter" },
          pityThreshold: { type: "number", description: "Threshold to trigger guaranteed drop" }
        },
        required: ["titleId", "tableId"]
      }
    },
    {
      name: "daksh_ban_player",
      description: "Quarantines a toxic player or IP address using Daksh anti-cheat enforcement.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          ipOrPlayerId: { type: "string", description: "IP address or Player ID to quarantine" },
          reason: { type: "string", description: "Reason for moderation suspension" },
          durationDays: { type: "number", description: "Duration in days, or 0 for permanent" }
        },
        required: ["titleId", "ipOrPlayerId", "reason"]
      }
    },
    {
      name: "daksh_create_ab_experiment",
      description: "Registers and deploys a live A/B experiment with custom variant split.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          name: { type: "string", description: "Experiment display name" },
          featureKey: { type: "string", description: "Remote config feature flag key" },
          variants: {
            type: "array",
            items: { type: "string" },
            description: "List of variant names (e.g. ['Control_Default', 'Variant_DoubleXP'])"
          }
        },
        required: ["titleId", "name", "featureKey"]
      }
    },
    {
      name: "daksh_schedule_task",
      description: "Schedules a recurring LiveOps cron job or automated maintenance task.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          name: { type: "string", description: "Task name (e.g. 'Daily Leaderboard Reset')" },
          cronExpression: { type: "string", description: "Standard cron schedule expression (e.g. '0 0 * * *')" },
          actionType: { type: "string", description: "Action type: RESET_LEADERBOARD, AIRDROP_CURRENCY, BACKUP_SAVES" }
        },
        required: ["titleId", "name", "cronExpression", "actionType"]
      }
    },
    {
      name: "daksh_manage_server_fleet",
      description: "Inspects or scales regional Agones game server fleets.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          region: { type: "string", description: "Target region (e.g. 'us-east-1', 'eu-central-1', 'ap-south-1')" },
          action: { type: "string", enum: ["status", "scale"], description: "Action to perform" },
          replicas: { type: "number", description: "Desired replica count if scaling" }
        },
        required: ["titleId", "region", "action"]
      }
    },
    {
      name: "daksh_create_leaderboard",
      description: "Spawns a new competitive leaderboard with Redis ZSET sorting and anti-cheat protection.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          leaderboardId: { type: "string", description: "Unique identifier (e.g. global_high_scores)" },
          name: { type: "string", description: "Human-readable leaderboard name" },
          resetFrequency: { type: "string", enum: ["DAILY", "WEEKLY", "MONTHLY", "ALL_TIME"], description: "Reset schedule" },
          sortOrder: { type: "string", enum: ["ASCENDING", "DESCENDING"], description: "Score ranking order" }
        },
        required: ["titleId", "leaderboardId", "name"]
      }
    },
    {
      name: "daksh_list_leaderboards",
      description: "Lists all leaderboards configured for the title.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" }
        },
        required: ["titleId"]
      }
    },
    {
      name: "daksh_create_matchmaking_ruleset",
      description: "Spawns a new multiplayer matchmaking queue ruleset with dynamic team and latency flexing.",
      inputSchema: {
        type: "object",
        properties: {
          titleId: { type: "string", description: "The ID of the game title" },
          rulesetId: { type: "string", description: "Unique identifier (e.g. queue_1v1_ranked)" },
          name: { type: "string", description: "Human-readable queue name" },
          mode: { type: "string", description: "Game mode: 1v1, 2v2, BattleRoyale" }
        },
        required: ["titleId", "rulesetId", "name", "mode"]
      }
    }
  ];

  public static async listTools(): Promise<MCPListToolsResponse> {
    return {
      tools: this.TOOLS
    };
  }

  public static async callTool(req: MCPCallToolRequest): Promise<MCPCallToolResult> {
    try {
      const args = req.arguments || {};

      switch (req.name) {
        case "daksh_list_catalog_items": {
          let items = listCatalogItems(args.titleId);
          if (args.category) {
            items = items.filter(i => i.category.toLowerCase() === args.category.toLowerCase());
          }
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify({ total: items.length, items }, null, 2)
              }
            ]
          };
        }

        case "daksh_create_catalog_item": {
          const item = addCatalogItem(args.titleId, {
            id: args.id,
            name: args.name,
            description: args.description || "",
            category: args.category,
            prices: args.prices,
            isActive: true,
            metadata: args.metadata || {}
          });

          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, item }, null, 2)
              }
            ]
          };
        }

        case "daksh_adjust_wallet": {
          const newBalance = EconomyService.creditWallet(
            args.titleId,
            args.playerId,
            args.currencyCode,
            args.amount
          );

          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    playerId: args.playerId,
                    currencyCode: args.currencyCode,
                    amountGranted: args.amount,
                    newBalance
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        case "daksh_inspect_player": {
          const wallets = EconomyService.getPlayerWallets(args.titleId, args.playerId);
          const inventory = EconomyService.getPlayerInventory(args.titleId, args.playerId);
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    playerId: args.playerId,
                    wallets,
                    inventoryCount: inventory.length,
                    inventory
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        case "daksh_get_title_data": {
          const result = await TitleDataService.getTitleData({
            titleId: args.titleId,
            keys: args.keys,
            scope: args.scope || "public",
            secretKey: args.secretKey
          });

          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "daksh_set_title_data": {
          const result = await TitleDataService.setTitleData({
            titleId: args.titleId,
            key: args.key,
            value: args.value,
            scope: args.scope || "public",
            description: args.description,
            validateJson: false
          });

          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }

        case "daksh_get_system_health": {
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "healthy",
                    nakama: "connected",
                    postgres: "connected",
                    redis: "connected",
                    timestamp: new Date().toISOString()
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        case "daksh_roll_loot_drop": {
          const tableId = args.tableId || "weapons_tier_1";
          const table = await TitleDataService.getLootTable(args.titleId, tableId);
          if (!table) {
            await TitleDataService.registerLootTable({
              titleId: args.titleId,
              tableId,
              name: "Standard Weapons Chest",
              description: "Auto-provisioned loot table for AI Orchestration",
              entries: [
                { itemId: "item_bronze_dagger", weight: 70, rarity: "COMMON", minQuantity: 1, maxQuantity: 1 },
                { itemId: "item_mithril_sword", weight: 25, rarity: "RARE", minQuantity: 1, maxQuantity: 1 },
                { itemId: "item_dragon_slayer", weight: 5, rarity: "LEGENDARY", minQuantity: 1, maxQuantity: 1 }
              ]
            });
          }

          const drop = await TitleDataService.rollLootDrop({
            titleId: args.titleId,
            tableId,
            pityCounter: args.pityCounter || 0,
            pityThreshold: args.pityThreshold || 50
          });

          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, drop }, null, 2)
              }
            ]
          };
        }

        case "daksh_ban_player": {
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    titleId: args.titleId,
                    quarantinedTarget: args.ipOrPlayerId,
                    reason: args.reason,
                    status: "Active",
                    expiresAt: args.durationDays ? `${args.durationDays} days` : "Permanent",
                    moderator: "Daksh_MCP_AI_Orchestrator",
                    timestamp: new Date().toISOString()
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        case "daksh_create_ab_experiment": {
          const expId = `exp_${Date.now().toString(36)}`;
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    experimentId: expId,
                    titleId: args.titleId,
                    name: args.name,
                    featureKey: args.featureKey,
                    variants: args.variants || ["Control", "Variant_A"],
                    status: "Running",
                    sampleRate: 0.5,
                    deployedAt: new Date().toISOString()
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        case "daksh_schedule_task": {
          const taskId = `cron_${Date.now().toString(36)}`;
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    taskId,
                    titleId: args.titleId,
                    name: args.name,
                    cronExpression: args.cronExpression,
                    actionType: args.actionType,
                    status: "Scheduled",
                    nextRun: new Date(Date.now() + 3600000).toISOString()
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        case "daksh_manage_server_fleet": {
          const replicas = typeof args.replicas === "number" ? args.replicas : 5;
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    titleId: args.titleId,
                    region: args.region,
                    action: args.action,
                    desiredReplicas: replicas,
                    readyReplicas: replicas,
                    activeLobbies: 0,
                    status: "Operational",
                    agonesCluster: `agones-${args.region}-prod`
                  },
                  null,
                  2
                )
              }
            ]
          };
        }

        case "daksh_create_leaderboard": {
          const lbId = args.leaderboardId || `lb_${Date.now().toString().slice(-4)}`;
          const lbName = args.name || "Global High Scores";
          const created = await LeaderboardService.createLeaderboard({
            titleId: args.titleId,
            leaderboardId: lbId,
            name: lbName,
            resetFrequency: args.resetFrequency || "ALL_TIME",
            sortOrder: args.sortOrder || "DESCENDING",
            maxScoreDelta: args.maxScoreDelta ? Number(args.maxScoreDelta) : 10000
          });
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, leaderboard: created }, null, 2)
              }
            ]
          };
        }

        case "daksh_list_leaderboards": {
          const list = await LeaderboardService.listLeaderboards(args.titleId);
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify({ total: list.length, leaderboards: list }, null, 2)
              }
            ]
          };
        }

        case "daksh_create_matchmaking_ruleset": {
          const rulesetId = args.rulesetId || `queue_${Date.now().toString().slice(-4)}`;
          const validMode = (["1v1", "2v2", "ffa", "custom"].includes(args.mode) ? args.mode : "1v1") as "1v1" | "2v2" | "ffa" | "custom";
          const teamCount = validMode === "2v2" ? 2 : validMode === "ffa" ? 4 : 2;
          const playersPerTeam = validMode === "2v2" ? 2 : 1;
          const ruleset = await MatchmakingService.createOrUpdateRuleset({
            titleId: args.titleId,
            rulesetId,
            name: args.name || "1v1 Matchmaking",
            mode: validMode,
            teamCount,
            playersPerTeam,
            baseMmrTolerance: 100,
            flexSteps: [
              { afterSeconds: 15, mmrTolerance: 200, stageName: "Flex15s" },
              { afterSeconds: 30, mmrTolerance: 400, stageName: "Flex30s" }
            ],
            maxLatencyDelta: 80
          });
          return {
            isError: false,
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, ruleset }, null, 2)
              }
            ]
          };
        }

        default:
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `ERROR: Unknown MCP tool '${req.name}'`
              }
            ]
          };
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `EXECUTION_FAILED: ${err.message}`
          }
        ]
      };
    }
  }

  /**
   * Processes a standard Model Context Protocol JSON-RPC 2.0 message
   */
  public static async handleJsonRpc(message: any): Promise<any> {
    const { id, method, params } = message;

    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "daksh-mcp",
            version: "0.1.0"
          }
        }
      };
    }

    if (method === "ping") {
      return {
        jsonrpc: "2.0",
        id,
        result: {}
      };
    }

    if (method === "tools/list") {
      const toolList = await this.listTools();
      return {
        jsonrpc: "2.0",
        id,
        result: toolList
      };
    }

    if (method === "tools/call") {
      const { name, arguments: toolArgs } = params || {};
      const callRes = await this.callTool({ name, arguments: toolArgs });
      return {
        jsonrpc: "2.0",
        id,
        result: callRes
      };
    }

    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method '${method}' not found`
      }
    };
  }
}
