"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bot, Sparkles, Terminal, Wrench, Send, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronUp, Layers, RefreshCw, ShoppingBag, Coins, 
  Database, ShieldAlert, Server, Activity, ArrowRight, X, Clock, Code,
  Key, Trash2, Cpu, User, CornerDownLeft, Check
} from "lucide-react";
import MCPToolsModal from "./MCPToolsModal";
import ApiKeyModal from "./ApiKeyModal";

interface AIOrchestratorConsoleProps {
  titleId: string;
  titleName: string;
}

interface ToolExecutionInfo {
  toolName: string;
  args: any;
  result: any;
  isError: boolean;
  latencyMs: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "orchestrator";
  timestamp: string;
  text: string;
  thoughtProcess?: string;
  toolCalls?: ToolExecutionInfo[];
  simulationResult?: {
    status: string;
    summary: string;
    latencyMs?: number;
  };
}

export default function AIOrchestratorConsole({ titleId, titleName }: AIOrchestratorConsoleProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState("daksh_sim_prod_liveops_90218374");
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("catalog");
  const [expandedThoughtId, setExpandedThoughtId] = useState<string | null>(null);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat message history with initial greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      sender: "orchestrator",
      timestamp: "Just now",
      text: `👋 **Welcome to the Daksh LiveOps Chat Orchestrator for ${titleName} (${titleId})!**\n\nI am listening. I can autonomously plan, simulate, and execute game operations across your microservices using the **Model Context Protocol (MCP)**. You can ask me to simulate economy events, balance drop rates, configure items, grant currencies, or test anti-cheat bans.`,
      simulationResult: {
        status: "ready",
        summary: "12 MCP tools connected & ready for autonomous execution."
      }
    }
  ]);

  // Load saved API Key
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("daksh_ai_api_key");
      if (savedKey) setApiKey(savedKey);
    } catch (e) {}
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Subsystem Preset Menus above Chat Input
  const menuCategories = [
    {
      id: "catalog",
      label: "Catalog & Store",
      icon: ShoppingBag,
      prompts: [
        "Create an Epic Dragon Armor for 500 Gems",
        "Create a Rare Mithril Sword for 350 Gold",
        "Create a Cyber Plasma Rifle for 800 Gold",
        "List all catalog items and prices"
      ]
    },
    {
      id: "simulation",
      label: "LiveOps Simulations",
      icon: Sparkles,
      prompts: [
        "Simulate a weekend event with double XP, an event blade, and 500 gold airdrop",
        "Simulate 10 cryptographic loot drops with pity tracking",
        "Simulate 5,000 CCU fleet auto-scaling in us-east-1"
      ]
    },
    {
      id: "wallets",
      label: "Players & Currencies",
      icon: Coins,
      prompts: [
        "Give 1000 Gold to player Player_01",
        "Give 250 Gems to player Player_01",
        "Inspect wallet and inventory of Player_01"
      ]
    },
    {
      id: "config",
      label: "Remote Config & Title Data",
      icon: Database,
      prompts: [
        "Set config XP_Multiplier to 2.0",
        "Set config Active_Season to 'Dragon_Festival_2026'",
        "Fetch all public title configuration data"
      ]
    },
    {
      id: "moderation",
      label: "Anti-Cheat & Fleet",
      icon: ShieldAlert,
      prompts: [
        "Ban IP 198.51.100.99 for speedhacking",
        "Probe cluster health of Nakama, Postgres, and Redis",
        "Scale regional server fleet to 8 pods in ap-south-1"
      ]
    }
  ];

  // Send a message / prompt to the AI Orchestrator
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isProcessing) return;

    // Add user message to chat immediately
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleId,
          prompt: query,
          apiKey,
          isSimulation: true,
          messages: messages.slice(-4).map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text
          }))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to execute orchestration simulation");
      }

      // Add AI response to chat
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "orchestrator",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.reply,
        thoughtProcess: data.thoughtProcess,
        toolCalls: data.toolCalls,
        simulationResult: data.simulationResult
      };

      setMessages(prev => [...prev, aiMsg]);

      // Synchronize client storage for created items / bans
      if (data.toolCalls && data.toolCalls.length > 0) {
        for (const tc of data.toolCalls) {
          syncClientState(tc.toolName, tc.args, tc.result);
        }
        window.dispatchEvent(new CustomEvent("daksh_data_updated", { detail: { toolCalls: data.toolCalls } }));
      }

    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "orchestrator",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `⚠️ **Simulation Error**: ${err.message}`,
        simulationResult: {
          status: "error",
          summary: "Execution halted. No state changed."
        }
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sync client storage for live UI updates
  const syncClientState = (toolName: string, args: any, result: any) => {
    try {
      if (toolName === "daksh_create_catalog_item") {
        const saved = JSON.parse(localStorage.getItem(`catalog_items_${titleId}`) || "[]");
        saved.push({
          id: args.id || result?.item?.id || `item_${Date.now()}`,
          name: args.name || result?.item?.name,
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
          ip: args.ipOrPlayerId || "198.51.100.99",
          reason: args.reason || "Automated quarantine via AI chat",
          bannedAt: "Just now (MCP Orchestrator)",
          expiresAt: "30 days",
          status: "Active"
        });
        localStorage.setItem(`daksh_bans_${titleId}`, JSON.stringify(savedBans));
      }
    } catch (e) {
      console.error("Local sync error:", e);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg_welcome",
        sender: "orchestrator",
        timestamp: "Just now",
        text: `👋 **Chat reset for ${titleName}**. I am listening and ready to simulate or execute your next LiveOps command via MCP.`,
        simulationResult: {
          status: "ready",
          summary: "Orchestrator ready."
        }
      }
    ]);
  };

  return (
    <div className="bg-[#1e293b] border-b border-indigo-900/60 text-gray-200 px-4 py-3 sm:px-6 shadow-md transition-all">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Top Chat Orchestrator Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-700/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white tracking-wide">
                  Daksh LiveOps AI Chat Orchestrator
                </span>
                <span className="bg-indigo-950 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Listening & Simulating
                </span>
                <span className="hidden lg:inline text-[11px] font-mono text-slate-400">
                  server: <strong className="text-slate-200">daksh-mcp (12 tools)</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* API Key Pill Button */}
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800 text-indigo-300 hover:text-white text-xs px-2.5 py-1 rounded border border-indigo-800/60 transition-colors"
              title="Configure AI API Key or Simulation Mode"
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-[11px] truncate max-w-[120px]">{apiKey.slice(0, 10)}...</span>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1 py-0.2 rounded border border-indigo-700">Sim</span>
            </button>

            {/* Browse MCP Tools */}
            <button
              onClick={() => setIsToolsModalOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-700 transition-colors"
              title="Inspect Model Context Protocol registered schemas"
            >
              <Wrench className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">MCP Tools (12)</span>
            </button>

            {/* Clear Chat */}
            <button
              onClick={clearChat}
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Expand / Minimize */}
            <button
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
              title={isChatExpanded ? "Collapse chat" : "Expand chat"}
            >
              {isChatExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isChatExpanded && (
          <>
            {/* Conversational Chat Thread Box */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 sm:p-4 max-h-[360px] overflow-y-auto space-y-3.5 text-xs font-sans scrollbar-thin">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.sender === "user" 
                      ? "bg-slate-700 text-slate-200 border border-slate-600" 
                      : "bg-indigo-600 text-white shadow-xs"
                  }`}>
                    {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] rounded-lg p-3 space-y-2 ${
                    msg.sender === "user"
                      ? "bg-indigo-950/80 border border-indigo-800/80 text-white"
                      : "bg-slate-900 border border-slate-800 text-slate-200"
                  }`}>
                    
                    {/* Timestamp & Sender */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 gap-2 border-b border-slate-800/60 pb-1">
                      <span className="font-semibold text-slate-300">
                        {msg.sender === "user" ? "Studio Developer" : "Daksh AI Orchestrator"}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Thought Process (Collapsible) */}
                    {msg.thoughtProcess && (
                      <div className="bg-slate-950/90 border border-slate-800/90 rounded p-2 text-[11px] font-mono text-indigo-300">
                        <button 
                          onClick={() => setExpandedThoughtId(expandedThoughtId === msg.id ? null : msg.id)}
                          className="flex items-center justify-between w-full text-[10px] text-indigo-400 hover:underline"
                        >
                          <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                            <Cpu className="w-3 h-3" />
                            <span>Simulation Reasoning</span>
                          </span>
                          <span>{expandedThoughtId === msg.id ? "▲ Hide" : "▼ Show"}</span>
                        </button>
                        {expandedThoughtId === msg.id && (
                          <div className="mt-1.5 whitespace-pre-line text-slate-300 text-[11px] leading-relaxed">
                            {msg.thoughtProcess}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main text content */}
                    <div className="whitespace-pre-line text-xs sm:text-[13px] leading-relaxed">
                      {msg.text}
                    </div>

                    {/* Executed MCP Tool Cards */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Executed MCP Tools ({msg.toolCalls.length}):
                        </div>
                        {msg.toolCalls.map((tc, idx) => (
                          <div 
                            key={idx}
                            className="bg-slate-950 border border-slate-800 rounded p-2 text-[11px] font-mono space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-indigo-400 font-bold flex items-center gap-1">
                                <Terminal className="w-3 h-3 text-indigo-400" />
                                <span>{tc.toolName}</span>
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                                tc.isError ? "bg-red-950 text-red-400" : "bg-emerald-950 text-emerald-400"
                              }`}>
                                {tc.isError ? "ERROR" : "200 OK"} · {tc.latencyMs}ms
                              </span>
                            </div>
                            <div className="text-slate-400 text-[10px] truncate">
                              args: {JSON.stringify(tc.args)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Simulation Result Banner */}
                    {msg.simulationResult && (
                      <div className="flex items-center justify-between text-[11px] bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded text-emerald-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{msg.simulationResult.summary}</span>
                        </span>
                        {msg.simulationResult.latencyMs && (
                          <span className="text-slate-400 text-[10px]">{msg.simulationResult.latencyMs}ms</span>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              ))}

              {/* Typing / Simulating Indicator */}
              {isProcessing && (
                <div className="flex items-center space-x-2 text-indigo-300 text-xs py-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Listening & Simulating LiveOps through MCP...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Menus Above Input Asking What to Do */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Interactive Quick Action Menus:</span>
                </span>
                <span className="text-[10px] text-slate-400">Click any preset to simulate</span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-thin">
                {menuCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Prompt Suggestions */}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {menuCategories
                  .find((c) => c.id === activeCategory)
                  ?.prompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p)}
                      disabled={isProcessing}
                      className="bg-slate-900/90 hover:bg-indigo-950 text-slate-300 hover:text-white text-[11px] px-2.5 py-1 rounded border border-slate-700 hover:border-indigo-600 transition-all flex items-center space-x-1 disabled:opacity-50"
                    >
                      <span>"{p}"</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Chat Input Box */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center pt-1"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={isProcessing}
                placeholder={`Ask the Orchestrator to simulate or execute (e.g. 'Simulate a weekend event with double XP', 'Grant 500 Gold')...`}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-400 rounded-md py-2.5 pl-3.5 pr-24 text-xs sm:text-sm font-sans transition-all"
              />
              <div className="absolute right-1.5 flex items-center space-x-1">
                {inputPrompt && (
                  <button
                    type="button"
                    onClick={() => setInputPrompt("")}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isProcessing || !inputPrompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center space-x-1"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          </>
        )}

      </div>

      {/* MCP Tools Specification Modal */}
      <MCPToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
      />

      {/* API Key Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={(newKey) => {
          setApiKey(newKey);
          localStorage.setItem("daksh_ai_api_key", newKey);
        }}
      />
    </div>
  );
}
