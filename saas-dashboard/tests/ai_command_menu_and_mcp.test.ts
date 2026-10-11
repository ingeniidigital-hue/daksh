import { describe, it, expect, beforeEach } from "vitest";
import {
  AIIntentParser,
  AICommandExecutor
} from "../lib/ai-menu";
import { MCPService } from "../lib/mcp";
import { resetEconomyStorage } from "../lib/economy";

describe("STORY-05 / TDD: AI Command Menu (Cmd+K) & Open MCP Server", () => {
  const titleId = "TITLE_AI_CMD_01";

  beforeEach(() => {
    resetEconomyStorage();
  });

  it("TEST-05-A [Happy Path]: Prompt 'Create an Epic Dragon Armor for 500 Gems' parses into valid catalog item JSON in <1.5s", async () => {
    const prompt = "Create an Epic Dragon Armor for 500 Gems";
    const start = performance.now();

    const intent = await AIIntentParser.parsePrompt({
      titleId,
      prompt
    });

    const elapsed = performance.now() - start;
    console.log(`AI Prompt parsed in ${elapsed.toFixed(2)}ms`);

    expect(elapsed).toBeLessThan(1500); // Sub-1.5s requirement
    expect(intent.action).toBe("CREATE_CATALOG_ITEM");
    expect(intent.confidence).toBeGreaterThanOrEqual(0.85);

    const payload = intent.payload;
    expect(payload.name).toBe("Epic Dragon Armor");
    expect(payload.category).toBeDefined();
    expect(payload.prices).toEqual({ GEMS: 500 });
    expect(payload.metadata.rarity).toBe("EPIC");

    // Execute the parsed intent into production storage
    const execution = await AICommandExecutor.executeIntent(titleId, intent);
    expect(execution.success).toBe(true);
    expect(execution.eventDispatched).toBe("daksh_data_updated");
    expect(execution.data.item.name).toBe("Epic Dragon Armor");
  });

  it("TEST-05-B [MCP Endpoint]: GET /api/mcp/tools returns MCP tool definitions conforming to the Model Context Protocol schema", async () => {
    const mcpResponse = await MCPService.listTools();

    expect(mcpResponse).toBeDefined();
    expect(mcpResponse.tools).toBeInstanceOf(Array);
    expect(mcpResponse.tools.length).toBeGreaterThanOrEqual(4);

    // Verify MCP Tool Spec schema conformance
    for (const tool of mcpResponse.tools) {
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.inputSchema.properties).toBeDefined();
    }

    const toolNames = mcpResponse.tools.map(t => t.name);
    expect(toolNames).toContain("daksh_create_catalog_item");
    expect(toolNames).toContain("daksh_adjust_wallet");
    expect(toolNames).toContain("daksh_set_title_data");
    expect(toolNames).toContain("daksh_get_system_health");

    // Test calling an MCP tool
    const callResult = await MCPService.callTool({
      name: "daksh_create_catalog_item",
      arguments: {
        titleId,
        id: "item_mcp_blaster",
        name: "MCP Plasma Blaster",
        category: "Weapons",
        prices: { GOLD: 250 },
        metadata: { rarity: "RARE" }
      }
    });

    expect(callResult.isError).toBe(false);
    expect(callResult.content).toBeInstanceOf(Array);
    expect(callResult.content[0].type).toBe("text");
    const parsedText = JSON.parse(callResult.content[0].text);
    expect(parsedText.success).toBe(true);
    expect(parsedText.item.id).toBe("item_mcp_blaster");
  });

  it("TEST-05-C [Failure Mode]: Gibberish or malicious prompt injection is sanitized and safely rejected with suggestions", async () => {
    // 1. Malicious SQL / Command injection attempt
    const maliciousPrompt = "DROP TABLE users;-- <script>alert('xss')</script> SELECT * FROM secrets";
    const maliciousResult = await AIIntentParser.parsePrompt({
      titleId,
      prompt: maliciousPrompt
    });

    expect(maliciousResult.action).toBe("REJECTED");
    expect(maliciousResult.error).toBeDefined();
    expect(maliciousResult.suggestions).toBeInstanceOf(Array);
    expect(maliciousResult.suggestions.length).toBeGreaterThan(0);

    // 2. Gibberish prompt
    const gibberishPrompt = "asdfkjhqwerty zzzzz123 999";
    const gibberishResult = await AIIntentParser.parsePrompt({
      titleId,
      prompt: gibberishPrompt
    });

    expect(gibberishResult.action).toBe("REJECTED");
    expect(gibberishResult.error).toContain("Unable to recognize game operations intent");
    expect(gibberishResult.suggestions).toContain("Try: 'Create an Epic Sword for 200 Gold'");
  });

  it("TEST-05-D [Event Dispatch]: Successful AI creation emits daksh_data_updated and UI reflects the new item without browser reload", async () => {
    const prompt = "Give 1000 Gold to player hero_99";
    const intent = await AIIntentParser.parsePrompt({
      titleId,
      prompt
    });

    expect(intent.action).toBe("ADJUST_WALLET");
    expect(intent.payload.currencyCode).toBe("GOLD");
    expect(intent.payload.amount).toBe(1000);
    expect(intent.payload.playerId).toBe("hero_99");

    const exec = await AICommandExecutor.executeIntent(titleId, intent);
    expect(exec.success).toBe(true);
    expect(exec.eventDispatched).toBe("daksh_data_updated");
    expect(exec.eventPayload).toEqual({
      entity: "wallet",
      action: "credit",
      targetId: "hero_99",
      amount: 1000
    });
  });
});
