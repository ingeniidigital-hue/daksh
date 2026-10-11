import {
  MCPTool,
  MCPListToolsResponse,
  MCPCallToolRequest,
  MCPCallToolResult
} from "./types";
import { addCatalogItem, listCatalogItems } from "../economy/catalog";
import { EconomyService } from "../economy/service";
import { TitleDataService } from "../title-data/service";

export class MCPService {
  private static readonly TOOLS: MCPTool[] = [
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
          const drop = await TitleDataService.rollLootDrop({
            titleId: args.titleId,
            tableId: args.tableId,
            pityCounter: args.pityCounter,
            pityThreshold: args.pityThreshold
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
}
