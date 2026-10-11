# @daksh/mcp-server

Official **Model Context Protocol (MCP)** Server for the **Daksh Game BaaS** platform.

This server enables AI coding agents (Claude Desktop, Cursor, Antigravity, GitHub Copilot) to directly inspect, balance, test, and operate game titles using standard Model Context Protocol tool calling over `stdio` or `HTTP JSON-RPC 2.0`.

---

## Quick Setup

### 1. Claude Desktop Integration
Add the following to your `claude_desktop_config.json` (on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, on Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "daksh": {
      "command": "node",
      "args": ["/absolute/path/to/daksh/packages/mcp-server/bin/daksh-mcp.js"],
      "env": {
        "DAKSH_URL": "http://localhost:3000"
      }
    }
  }
}
```

### 2. Cursor / VS Code Integration
In `.cursor/mcp.json` or your MCP client configuration:
```json
{
  "mcpServers": {
    "daksh": {
      "command": "node",
      "args": ["packages/mcp-server/bin/daksh-mcp.js"]
    }
  }
}
```

---

## Available MCP Tools

| Tool Name | Description |
| :--- | :--- |
| `daksh_list_catalog_items` | Lists all items and pricing in PlayFab Economy V2 catalog. |
| `daksh_create_catalog_item` | Creates a new catalog item, armor, weapon, or consumable. |
| `daksh_adjust_wallet` | Directly credits virtual currency (Gold, Gems) to a player's wallet. |
| `daksh_inspect_player` | Inspects player wallets and inventory instances. |
| `daksh_get_title_data` | Retrieves Key-Value Remote Configuration Title Data. |
| `daksh_set_title_data` | Sets or updates remote configuration key-values. |
| `daksh_roll_loot_drop` | Evaluates a server-authoritative cryptographic loot drop. |
| `daksh_get_system_health` | Queries live infrastructure health (Nakama, Postgres, Redis). |
