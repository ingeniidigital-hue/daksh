"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bot, Sparkles, Terminal, Wrench, Send, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronUp, Layers, RefreshCw, ShoppingBag, Coins, 
  Database, ShieldAlert, Server, Activity, ArrowRight, X, Clock, Code,
  Key, Trash2, Cpu, User, Gamepad2, Plus, Sliders
} from "lucide-react";
import MCPToolsModal from "./MCPToolsModal";
import ApiKeyModal from "./ApiKeyModal";

interface TitleRecord {
  id: string;
  name: string;
  status: string;
  players: string;
  secretKey?: string;
}

interface AIOrchestratorConsoleProps {
  titleId?: string;
  titleName?: string;
  isProjectSelector?: boolean;
  onOpenCreateTitle?: () => void;
  showInspectorToggle?: boolean;
  onToggleInspector?: () => void;
  isInspectorOpen?: boolean;
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
  isProjectSelectCard?: boolean;
}

function formatChatMessage(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    if (!line.trim()) return <div key={lineIdx} className="h-2" />;
    const boldParts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <div key={lineIdx} className="leading-relaxed">
        {boldParts.map((bPart, bIdx) => {
          const isBold = bPart.startsWith("**") && bPart.endsWith("**");
          const content = isBold ? bPart.slice(2, -2) : bPart;
          const codeParts = content.split(/(`.*?`)/g);
          const renderedContent = codeParts.map((cPart, cIdx) => {
            if (cPart.startsWith("`") && cPart.endsWith("`")) {
              return (
                <code key={cIdx} className="bg-slate-900 text-indigo-300 px-1 py-0.5 rounded font-mono text-[11px] border border-slate-700">
                  {cPart.slice(1, -1)}
                </code>
              );
            }
            return cPart;
          });

          if (isBold) {
            return <strong key={bIdx} className="font-bold text-white">{renderedContent}</strong>;
          }
          return <span key={bIdx}>{renderedContent}</span>;
        })}
      </div>
    );
  });
}

export default function AIOrchestratorConsole({ 
  titleId = "YCSLW", 
  titleName = "Main Game Title",
  isProjectSelector = false,
  onOpenCreateTitle,
  showInspectorToggle = false,
  onToggleInspector,
  isInspectorOpen = false
}: AIOrchestratorConsoleProps) {
  const router = useRouter();
  const [inputPrompt, setInputPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState("daksh_sim_prod_liveops_90218374");
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("catalog");
  const [expandedThoughtId, setExpandedThoughtId] = useState<string | null>(null);
  const [availableTitles, setAvailableTitles] = useState<TitleRecord[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load available titles from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("daksh_titles");
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((t: any) => t.id !== "TITLE_CYBERPUNK" && t.id !== "TITLE_MYTHIC");
        setAvailableTitles(filtered);
      } else {
        const defaultTitle = [{ id: "YCSLW", name: "Main Game Title", status: "Healthy", players: "0 CCU" }];
        setAvailableTitles(defaultTitle);
      }
    } catch (e) {
      setAvailableTitles([{ id: "YCSLW", name: "Main Game Title", status: "Healthy", players: "0 CCU" }]);
    }
  }, []);

  // Initial chat state depending on whether it's root project selector or project active
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (isProjectSelector) {
      return [
        {
          id: "msg_select_project",
          sender: "orchestrator",
          timestamp: "Just now",
          text: `👋 **Welcome to Daksh LiveOps AI Orchestrator.**\n\nI am listening and ready to autonomously manage your game infrastructure via the **Model Context Protocol (MCP)**.\n\n👉 **Please select your game project below to begin:**`,
          isProjectSelectCard: true,
          simulationResult: {
            status: "ready",
            summary: "12 MCP microservice tools connected."
          }
        }
      ];
    }

    return [
      {
        id: "msg_welcome",
        sender: "orchestrator",
        timestamp: "Just now",
        text: `👋 **Connected to Project: ${titleName} (\`${titleId}\`)**\n\nMicroservices verified: Nakama v3.22, PostgreSQL 16, and Redis 7.2 are **Operational**.\nAll **12 MCP tools** are loaded and active. What would you like to simulate or execute today?`,
        simulationResult: {
          status: "connected",
          summary: `Active project: ${titleName} (${titleId})`
        }
      }
    ];
  });

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

  // Send prompt to AI chat route
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isProcessing) return;

    // Check if user is asking to select project via chat
    if (query.toLowerCase().includes("select project") || query.toLowerCase().includes("open project")) {
      const targetTitle = availableTitles.find(t => 
        query.toLowerCase().includes(t.id.toLowerCase()) || 
        query.toLowerCase().includes(t.name.toLowerCase())
      ) || availableTitles[0];

      if (targetTitle) {
        router.push(`/dashboard/${targetTitle.id}`);
        return;
      }
    }

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
    <div className="flex-1 flex flex-col bg-[#0b1329] text-gray-200 min-h-[calc(100vh-3.5rem)] font-sans">
      
      {/* Top AI Control Bar */}
      <div className="bg-[#111c38] border-b border-slate-800 px-4 py-2.5 sm:px-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white tracking-wide">
                Daksh LiveOps AI Orchestrator
              </span>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                AI Agent Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Model Context Protocol · 12 LiveOps Microservice Tools Connected
            </p>
          </div>
        </div>

        {/* Action Controls & Active Project Badge */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Active Project Switcher / Indicator */}
          {!isProjectSelector ? (
            <Link
              href="/dashboard"
              className="flex items-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white px-2.5 py-1 rounded text-xs border border-slate-700 transition-colors"
              title="Click to switch active game project"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-white">{titleName}</span>
              <span className="text-[10px] font-mono text-slate-400">({titleId})</span>
              <span className="text-[10px] text-indigo-400 font-bold ml-1">Switch ▾</span>
            </Link>
          ) : (
            <div className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded font-medium flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Project Selection Mode</span>
            </div>
          )}

          {/* API Key Modal Button */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800 text-indigo-300 hover:text-white text-xs px-2.5 py-1 rounded border border-indigo-900/80 transition-colors"
            title="Configure AI API Key or Simulation Mode"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-[11px] hidden md:inline truncate max-w-[100px]">{apiKey.slice(0, 10)}...</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1 py-0.2 rounded border border-indigo-800">Sim</span>
          </button>

          {/* Browse MCP Tools */}
          <button
            onClick={() => setIsToolsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs px-2.5 py-1 rounded border border-slate-700 transition-colors"
            title="Inspect Model Context Protocol registered schemas"
          >
            <Wrench className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">MCP Tools (12)</span>
          </button>

          {/* Optional Manual Inspector Toggle */}
          {showInspectorToggle && onToggleInspector && (
            <button
              onClick={onToggleInspector}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                isInspectorOpen 
                  ? "bg-indigo-600 text-white border-indigo-500 font-medium" 
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700"
              }`}
              title="Toggle manual raw tables inspector"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{isInspectorOpen ? "Hide Inspector" : "Manual Inspector"}</span>
            </button>
          )}

          {/* Clear Chat */}
          <button
            onClick={clearChat}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Clean Chat & Simulation Area */}
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-4 overflow-hidden">
        
        {/* Chat Stream Viewport */}
        <div className="flex-1 bg-[#0f172a]/90 border border-slate-800/80 rounded-xl p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-sans shadow-inner scrollbar-thin">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.sender === "user" 
                  ? "bg-slate-700 text-slate-200 border border-slate-600" 
                  : "bg-indigo-600 text-white shadow-sm"
              }`}>
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className={`max-w-[88%] rounded-xl p-3.5 sm:p-4 space-y-2.5 ${
                msg.sender === "user"
                  ? "bg-indigo-950/80 border border-indigo-800/80 text-white"
                  : "bg-[#18233c] border border-slate-800 text-slate-200 shadow-sm"
              }`}>
                
                {/* Header: Sender & Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 gap-2 border-b border-slate-700/50 pb-1.5">
                  <span className="font-semibold text-slate-300">
                    {msg.sender === "user" ? "Studio Developer" : "Daksh AI Orchestrator"}
                  </span>
                  <span className="font-mono text-[10px]">{msg.timestamp}</span>
                </div>

                {/* Thought Process (Collapsible) */}
                {msg.thoughtProcess && (
                  <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-indigo-300">
                    <button 
                      onClick={() => setExpandedThoughtId(expandedThoughtId === msg.id ? null : msg.id)}
                      className="flex items-center justify-between w-full text-[10px] text-indigo-400 hover:underline"
                    >
                      <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Simulation Reasoning & Planning</span>
                      </span>
                      <span>{expandedThoughtId === msg.id ? "▲ Hide" : "▼ Show"}</span>
                    </button>
                    {expandedThoughtId === msg.id && (
                      <div className="mt-2 whitespace-pre-line text-slate-300 text-[11px] leading-relaxed border-t border-slate-800 pt-2">
                        {msg.thoughtProcess}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Message Text */}
                <div className="text-xs sm:text-[13px] leading-relaxed">
                  {formatChatMessage(msg.text)}
                </div>

                {/* Interactive Project Selection Cards (Rendered if in project selection mode) */}
                {msg.isProjectSelectCard && (
                  <div className="pt-2 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                      Available Game Projects ({availableTitles.length}):
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availableTitles.map((title) => (
                        <div
                          key={title.id}
                          className="bg-[#0f172a] border border-slate-700 hover:border-indigo-500 rounded-lg p-3 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-sm">{title.name}</span>
                              <span className="font-mono text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800">
                                {title.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Nakama :7350 · Postgres :5432</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-end">
                            <Link
                              href={`/dashboard/${title.id}`}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <span>Manage Project</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}

                      {/* Provision New Title Card */}
                      <button
                        onClick={onOpenCreateTitle}
                        className="bg-[#0f172a]/60 hover:bg-[#0f172a] border border-dashed border-slate-700 hover:border-slate-500 rounded-lg p-3 text-left transition-colors flex flex-col justify-center items-center py-6"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 mb-2">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs text-slate-200">Provision New Title</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Spin up isolated microservices</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Executed MCP Tool Cards */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5 pt-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Executed MCP Tools ({msg.toolCalls.length}):
                    </div>
                    {msg.toolCalls.map((tc, idx) => (
                      <div 
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-400 font-bold flex items-center gap-1.5">
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

                {/* Simulation Summary Banner */}
                {msg.simulationResult && (
                  <div className="flex items-center justify-between text-[11px] bg-slate-950/70 border border-slate-800/80 px-3 py-1.5 rounded-lg text-emerald-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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

          {/* Live Thinking Indicator */}
          {isProcessing && (
            <div className="flex items-center space-x-2 text-indigo-300 text-xs py-1">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-[#18233c] border border-slate-800 rounded-xl px-3.5 py-2 flex items-center space-x-2.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span className="font-medium text-slate-300">Listening & Simulating LiveOps through MCP...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Menus (Only when title is selected) */}
        {!isProjectSelector && (
          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Operations Presets:</span>
              </span>
              <span className="text-slate-400">Click any preset to execute via MCP</span>
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
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
                        : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {menuCategories
                .find((c) => c.id === activeCategory)
                ?.prompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    disabled={isProcessing}
                    className="bg-[#111c38] hover:bg-indigo-950 text-slate-300 hover:text-white text-[11px] px-2.5 py-1 rounded-md border border-slate-800 hover:border-indigo-600 transition-all flex items-center space-x-1 disabled:opacity-50"
                  >
                    <span>"{p}"</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Conversational Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center shrink-0"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isProcessing}
            placeholder={
              isProjectSelector 
                ? "Type a command or click a project above (e.g. 'Select project YCSLW')..."
                : `Ask the Orchestrator to simulate or execute for ${titleName} (e.g. 'Simulate weekend double XP event', 'Grant 500 Gold')...`
            }
            className="w-full bg-[#111c38] border border-slate-700/90 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-400 rounded-xl py-3 pl-4 pr-24 text-xs sm:text-sm font-sans shadow-sm transition-all"
          />
          <div className="absolute right-2 flex items-center space-x-1">
            {inputPrompt && (
              <button
                type="button"
                onClick={() => setInputPrompt("")}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isProcessing || !inputPrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
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
