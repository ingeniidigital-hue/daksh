"use client";

import { useState, useEffect } from "react";
import { 
  Bot, Sparkles, Terminal, Wrench, Play, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronUp, Layers, RefreshCw, ShoppingBag, Coins, 
  Database, ShieldAlert, Server, Activity, ArrowRight, X, Clock, Code
} from "lucide-react";
import MCPToolsModal from "./MCPToolsModal";

interface AIOrchestratorConsoleProps {
  titleId: string;
  titleName: string;
}

interface MCPExecutionRecord {
  id: string;
  timestamp: string;
  toolName: string;
  prompt?: string;
  request: any;
  response: any;
  isError: boolean;
  durationMs: number;
}

export default function AIOrchestratorConsole({ titleId, titleName }: AIOrchestratorConsoleProps) {
  const [prompt, setPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("catalog");
  const [lastExecution, setLastExecution] = useState<MCPExecutionRecord | null>(null);
  const [executionHistory, setExecutionHistory] = useState<MCPExecutionRecord[]>([]);
  const [showInspector, setShowInspector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Subsystem Orchestrator Menus & Presets
  const menuCategories = [
    {
      id: "catalog",
      label: "Catalog & Economy",
      icon: ShoppingBag,
      actions: [
        {
          label: "⚔️ Create Epic Dragon Armor (500 Gems)",
          tool: "daksh_create_catalog_item",
          args: {
            titleId,
            id: `item_dragon_armor_${Date.now().toString().slice(-4)}`,
            name: "Epic Dragon Armor",
            description: "Forged from elder dragon scales. High magic resistance.",
            category: "Armor",
            prices: { GEMS: 500 },
            metadata: { rarity: "EPIC", power: 85 }
          }
        },
        {
          label: "🗡️ Create Rare Mithril Sword (350 Gold)",
          tool: "daksh_create_catalog_item",
          args: {
            titleId,
            id: `item_mithril_sword_${Date.now().toString().slice(-4)}`,
            name: "Rare Mithril Sword",
            description: "Lightweight blade crafted with elven metallurgy.",
            category: "Weapons",
            prices: { GOLD: 350 },
            metadata: { rarity: "RARE", power: 60 }
          }
        },
        {
          label: "🔫 Create Cyber Plasma Rifle (800 Gold)",
          tool: "daksh_create_catalog_item",
          args: {
            titleId,
            id: `item_plasma_rifle_${Date.now().toString().slice(-4)}`,
            name: "Cyber Plasma Rifle",
            description: "High-velocity energy rifle with thermal sights.",
            category: "Weapons",
            prices: { GOLD: 800 },
            metadata: { rarity: "RARE", power: 75 }
          }
        },
        {
          label: "📋 Query All Catalog Items via MCP",
          tool: "daksh_list_catalog_items",
          args: { titleId }
        }
      ]
    },
    {
      id: "wallets",
      label: "Players & Currencies",
      icon: Coins,
      actions: [
        {
          label: "💰 Grant 1,000 Gold to Player_01",
          tool: "daksh_adjust_wallet",
          args: {
            titleId,
            playerId: "Player_01",
            currencyCode: "GOLD",
            amount: 1000
          }
        },
        {
          label: "💎 Grant 250 Gems to Player_01",
          tool: "daksh_adjust_wallet",
          args: {
            titleId,
            playerId: "Player_01",
            currencyCode: "GEMS",
            amount: 250
          }
        },
        {
          label: "🔍 Inspect Player_01 Wallet & Inventory",
          tool: "daksh_inspect_player",
          args: {
            titleId,
            playerId: "Player_01"
          }
        }
      ]
    },
    {
      id: "liveops",
      label: "LiveOps & Remote Config",
      icon: Database,
      actions: [
        {
          label: "⚡ Set Double XP Weekend (XP_Multiplier = 2.0)",
          tool: "daksh_set_title_data",
          args: {
            titleId,
            key: "XP_Multiplier",
            value: JSON.stringify({ multiplier: 2.0, event: "Double XP Weekend", active: true }),
            scope: "public",
            description: "LiveOps global experience rate"
          }
        },
        {
          label: "🎉 Set Season Event Banner ('Dragon Festival 2026')",
          tool: "daksh_set_title_data",
          args: {
            titleId,
            key: "Active_Season_Banner",
            value: JSON.stringify({ season: "Dragon Festival 2026", themeColor: "#e11d48", bannerUrl: "/assets/banners/dragon.png" }),
            scope: "public",
            description: "Active seasonal liveops theme"
          }
        },
        {
          label: "📖 Fetch All Public Title Configs",
          tool: "daksh_get_title_data",
          args: {
            titleId,
            scope: "public"
          }
        }
      ]
    },
    {
      id: "anticheat",
      label: "Anti-Cheat & Loot Drops",
      icon: ShieldAlert,
      actions: [
        {
          label: "🛡️ Ban IP 198.51.100.99 (Speedhack Quarantine)",
          tool: "daksh_ban_player",
          args: {
            titleId,
            ipOrPlayerId: "198.51.100.99",
            reason: "Detected memory manipulation / speedhack violation",
            durationDays: 30
          }
        },
        {
          label: "🎲 Roll Cryptographic Loot Drop (Loot Table #1)",
          tool: "daksh_roll_loot_drop",
          args: {
            titleId,
            tableId: "weapons_tier_1",
            pityCounter: 15,
            pityThreshold: 50
          }
        },
        {
          label: "🧪 Deploy A/B Experiment ('Store_Discount_v2')",
          tool: "daksh_create_ab_experiment",
          args: {
            titleId,
            name: "Holiday Store 20% Discount Test",
            featureKey: "store_discount_holiday",
            variants: ["Control_StandardPrice", "Variant_20PercentOff"]
          }
        }
      ]
    },
    {
      id: "infra",
      label: "Cluster & Infrastructure",
      icon: Server,
      actions: [
        {
          label: "🩺 Probe Cluster Health (Nakama, Postgres, Redis)",
          tool: "daksh_get_system_health",
          args: { timeoutMs: 3000 }
        },
        {
          label: "🚀 Scale Regional Fleet (5 Pods in us-east-1)",
          tool: "daksh_manage_server_fleet",
          args: {
            titleId,
            region: "us-east-1",
            action: "scale",
            replicas: 5
          }
        },
        {
          label: "⏰ Schedule Leaderboard Reset Cron",
          tool: "daksh_schedule_task",
          args: {
            titleId,
            name: "Weekly Leaderboard Roll & Reward Distribution",
            cronExpression: "0 0 * * 0",
            actionType: "RESET_LEADERBOARD"
          }
        }
      ]
    }
  ];

  // Execute an MCP Tool directly via JSON-RPC endpoint
  const executeMCPTool = async (toolName: string, args: any, originalPrompt?: string) => {
    setIsExecuting(true);
    setStatusMessage(`Calling MCP Tool: ${toolName}...`);
    const start = performance.now();

    try {
      const res = await fetch("/api/mcp/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: toolName,
          arguments: args
        })
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);

      const record: MCPExecutionRecord = {
        id: `exec_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        toolName,
        prompt: originalPrompt,
        request: { name: toolName, arguments: args },
        response: data,
        isError: Boolean(data.isError),
        durationMs: elapsed
      };

      setLastExecution(record);
      setExecutionHistory(prev => [record, ...prev.slice(0, 19)]);
      setShowInspector(true);

      // Synchronize client storage and dispatch live event bus
      syncClientState(toolName, args, data);
      window.dispatchEvent(new CustomEvent("daksh_data_updated", { detail: { tool: toolName, data } }));

      if (data.isError) {
        setStatusMessage(`Error executing ${toolName}`);
      } else {
        setStatusMessage(`✓ Executed ${toolName} via MCP in ${elapsed}ms`);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      const record: MCPExecutionRecord = {
        id: `exec_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        toolName,
        prompt: originalPrompt,
        request: { name: toolName, arguments: args },
        response: { error: err.message },
        isError: true,
        durationMs: elapsed
      };
      setLastExecution(record);
      setStatusMessage(`Failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Synchronize browser local storage so UI reflects updates immediately
  const syncClientState = (toolName: string, args: any, result: any) => {
    try {
      if (toolName === "daksh_create_catalog_item") {
        const saved = JSON.parse(localStorage.getItem(`catalog_items_${titleId}`) || "[]");
        saved.push({
          id: args.id,
          name: args.name,
          type: args.category || "Equipment",
          price: Object.values(args.prices || {})[0]?.toString() || "100",
          isStackable: true,
          customData: JSON.stringify(args.metadata || {}),
          imageUrls: ["", "", ""]
        });
        localStorage.setItem(`catalog_items_${titleId}`, JSON.stringify(saved));
      } else if (toolName === "daksh_ban_player") {
        const savedBans = JSON.parse(localStorage.getItem(`daksh_bans_${titleId}`) || "[]");
        savedBans.unshift({
          ip: args.ipOrPlayerId,
          reason: args.reason,
          bannedAt: "Just now (MCP Orchestrator)",
          expiresAt: args.durationDays ? `${args.durationDays} days` : "Permanent",
          status: "Active"
        });
        localStorage.setItem(`daksh_bans_${titleId}`, JSON.stringify(savedBans));
      } else if (toolName === "daksh_create_ab_experiment") {
        const savedExp = JSON.parse(localStorage.getItem(`daksh_experiments_${titleId}`) || "[]");
        savedExp.unshift({
          id: `exp_${Date.now().toString(36)}`,
          name: args.name,
          key: args.featureKey,
          status: "Running",
          split: "50% / 50%",
          audience: "100% All Players",
          created: "Just now (MCP)"
        });
        localStorage.setItem(`daksh_experiments_${titleId}`, JSON.stringify(savedExp));
      } else if (toolName === "daksh_schedule_task") {
        const savedTasks = JSON.parse(localStorage.getItem(`daksh_tasks_${titleId}`) || "[]");
        savedTasks.unshift({
          id: `task_${Date.now().toString(36)}`,
          name: args.name,
          cron: args.cronExpression,
          target: args.actionType,
          status: "Active",
          nextRun: "In 1 hour",
          lastRun: "Never"
        });
        localStorage.setItem(`daksh_tasks_${titleId}`, JSON.stringify(savedTasks));
      }
    } catch (e) {
      console.error("Local sync error:", e);
    }
  };

  // Handle Natural Language Prompt submission
  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const query = prompt.trim();
    setIsExecuting(true);
    setStatusMessage("AI Orchestrator analyzing prompt intent...");

    try {
      // First try to parse via AI intent parser
      const parseRes = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleId,
          prompt: query,
          execute: false
        })
      });

      const parseData = await parseRes.json();

      if (parseRes.ok && parseData.intent && parseData.intent.action !== "REJECTED") {
        const intent = parseData.intent;
        if (intent.action === "CREATE_CATALOG_ITEM") {
          await executeMCPTool("daksh_create_catalog_item", {
            titleId,
            ...intent.payload
          }, query);
        } else if (intent.action === "ADJUST_WALLET") {
          await executeMCPTool("daksh_adjust_wallet", {
            titleId,
            ...intent.payload
          }, query);
        } else if (intent.action === "SET_TITLE_DATA") {
          await executeMCPTool("daksh_set_title_data", {
            titleId,
            ...intent.payload
          }, query);
        }
      } else {
        // Fallback natural language heuristic matching to MCP tools
        const lower = query.toLowerCase();
        if (lower.includes("health") || lower.includes("cluster") || lower.includes("status")) {
          await executeMCPTool("daksh_get_system_health", { timeoutMs: 3000 }, query);
        } else if (lower.includes("ban") || lower.includes("quarantine")) {
          const matchIp = query.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
          const target = matchIp ? matchIp[0] : "suspicious_user_99";
          await executeMCPTool("daksh_ban_player", {
            titleId,
            ipOrPlayerId: target,
            reason: `Quarantined via AI Orchestrator command: "${query}"`,
            durationDays: 30
          }, query);
        } else if (lower.includes("loot") || lower.includes("drop")) {
          await executeMCPTool("daksh_roll_loot_drop", {
            titleId,
            tableId: "weapons_tier_1",
            pityCounter: 0,
            pityThreshold: 50
          }, query);
        } else if (lower.includes("catalog") || lower.includes("item")) {
          await executeMCPTool("daksh_list_catalog_items", { titleId }, query);
        } else {
          // If unrecognized, invoke health or list items as safe fallback
          await executeMCPTool("daksh_list_catalog_items", { titleId }, query);
        }
      }
      setPrompt("");
    } catch (err: any) {
      setStatusMessage(`Orchestrator error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-[#1e293b] border-b border-indigo-900/60 text-gray-200 px-4 py-3 sm:px-6 shadow-md transition-all">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Top Orchestrator Status & Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-700/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs sm:text-sm text-white tracking-wide">
                  Daksh AI Orchestrator
                </span>
                <span className="bg-indigo-950 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  MCP: JSON-RPC 2.0
                </span>
                <span className="hidden md:inline text-[11px] font-mono text-slate-400">
                  server: <strong className="text-slate-200">daksh-mcp</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsToolsModalOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-700 transition-colors"
              title="Inspect Model Context Protocol registered schemas"
            >
              <Wrench className="w-3.5 h-3.5 text-indigo-400" />
              <span>Browse MCP Tools (12)</span>
            </button>

            {executionHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-700 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Audit History ({executionHistory.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Subsystem Menus Above the Prompt Asking What to Do */}
        <div>
          <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select Orchestrator Operations Menu:</span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1.5 scrollbar-thin">
            {menuCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Pills for Active Category */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {menuCategories
              .find((c) => c.id === activeCategory)
              ?.actions.map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => executeMCPTool(act.tool, act.args)}
                  disabled={isExecuting}
                  className="bg-slate-900/90 hover:bg-indigo-950 text-slate-200 hover:text-white text-xs px-2.5 py-1 rounded border border-slate-700 hover:border-indigo-600 transition-all flex items-center space-x-1 disabled:opacity-50"
                >
                  <span>{act.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </button>
              ))}
          </div>
        </div>

        {/* Natural Language Prompt Box */}
        <form onSubmit={handlePromptSubmit} className="pt-1">
          <div className="relative flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isExecuting}
              placeholder={`What should the AI Orchestrator execute for ${titleName}? (e.g. 'Create an Epic Frost Bow for 450 Gold', 'Give 500 Gems to Player_01')...`}
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-400 rounded-md py-2 pl-3 pr-28 text-xs sm:text-sm font-sans transition-all"
            />
            <div className="absolute right-1.5 flex items-center space-x-1">
              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt("")}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isExecuting || !prompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center space-x-1"
              >
                {isExecuting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>Run (MCP)</span>
              </button>
            </div>
          </div>
        </form>

        {/* Status bar */}
        {statusMessage && (
          <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-between">
            <span className="truncate">{statusMessage}</span>
            {lastExecution && (
              <button
                onClick={() => setShowInspector(!showInspector)}
                className="text-indigo-400 hover:underline text-[10px] ml-2 shrink-0"
              >
                {showInspector ? "Hide JSON-RPC" : "Inspect JSON-RPC"}
              </button>
            )}
          </div>
        )}

        {/* Live MCP JSON-RPC Inspector Drawer */}
        {showInspector && lastExecution && (
          <div className="bg-slate-950 border border-slate-800 rounded p-3 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center space-x-2">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-[11px] font-bold text-white">
                  MCP Tool Call: {lastExecution.toolName}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  lastExecution.isError ? "bg-red-950 text-red-400 border border-red-800" : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                }`}>
                  {lastExecution.isError ? "ERROR" : "200 OK"} · {lastExecution.durationMs}ms
                </span>
              </div>
              <button
                onClick={() => setShowInspector(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
              <div>
                <div className="text-slate-400 mb-1 text-[10px] uppercase font-bold">Request (tools/call)</div>
                <pre className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-40">
                  {JSON.stringify(lastExecution.request, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-slate-400 mb-1 text-[10px] uppercase font-bold">Response Payload</div>
                <pre className="bg-slate-900 p-2 rounded border border-slate-800 text-emerald-400 overflow-x-auto max-h-40">
                  {JSON.stringify(lastExecution.response, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Audit History Drawer */}
        {showHistory && (
          <div className="bg-slate-950 border border-slate-800 rounded p-3 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white text-[11px]">Recent MCP Orchestration Audit Log</span>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white text-xs">
                Close
              </button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {executionHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 text-[11px] font-mono"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-slate-400">{item.timestamp}</span>
                    <span className="text-indigo-400 font-bold">{item.toolName}</span>
                    {item.prompt && (
                      <span className="text-slate-400 truncate max-w-xs">"{item.prompt}"</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-slate-400 text-[10px]">{item.durationMs}ms</span>
                    <span className={`text-[10px] px-1 rounded ${
                      item.isError ? "bg-red-950 text-red-400" : "bg-emerald-950 text-emerald-400"
                    }`}>
                      {item.isError ? "ERR" : "OK"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MCP Tools Specification Modal */}
      <MCPToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
      />
    </div>
  );
}
