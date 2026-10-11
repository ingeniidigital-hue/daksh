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
                <code key={cIdx} className="bg-gray-100 text-blue-700 px-1.5 py-0.5 rounded font-mono text-[11px] border border-gray-300 font-semibold">
                  {cPart.slice(1, -1)}
                </code>
              );
            }
            return cPart;
          });

          if (isBold) {
            return <strong key={bIdx} className="font-bold text-gray-900">{renderedContent}</strong>;
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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 font-sans">
      
      {/* AdminLTE Card Container */}
      <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden flex flex-col">

        {/* AdminLTE Card Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-gray-800 tracking-tight">
                  Daksh LiveOps AI Orchestrator
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-medium px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Agent Active
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Model Context Protocol (MCP) · 12 Microservice Tools Connected
              </p>
            </div>
          </div>

          {/* Action Controls & Active Project Badge */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* Active Project Switcher / Indicator */}
            {!isProjectSelector ? (
              <Link
                href="/dashboard"
                className="flex items-center space-x-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 px-2.5 py-1 rounded text-xs border border-gray-300 font-medium transition-colors"
                title="Click to switch active game project"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-gray-800">{titleName}</span>
                <span className="text-[10px] font-mono text-gray-500">({titleId})</span>
                <span className="text-[10px] text-blue-600 font-bold ml-1">Switch ▾</span>
              </Link>
            ) : (
              <div className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded font-medium flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Project Selection Mode</span>
              </div>
            )}

            {/* API Key Modal Button */}
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="flex items-center space-x-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded border border-gray-300 transition-colors"
              title="Configure AI API Key or Simulation Mode"
            >
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-mono text-[11px] hidden md:inline truncate max-w-[100px]">{apiKey.slice(0, 10)}...</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-200">Sim</span>
            </button>

            {/* Browse MCP Tools */}
            <button
              onClick={() => setIsToolsModalOpen(true)}
              className="flex items-center space-x-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded border border-gray-300 transition-colors"
              title="Inspect Model Context Protocol registered schemas"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">MCP Tools (12)</span>
            </button>

            {/* Optional Manual Inspector Toggle */}
            {showInspectorToggle && onToggleInspector && (
              <button
                onClick={onToggleInspector}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                  isInspectorOpen 
                    ? "bg-blue-600 text-white border-blue-600 font-medium" 
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300"
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
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AdminLTE Direct Chat Messages Viewport */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-sans bg-[#fbfcfd] min-h-[460px] max-h-[580px] border-b border-gray-200 scrollbar-thin">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${
                msg.sender === "user" 
                  ? "bg-slate-700 text-white" 
                  : "bg-blue-600 text-white"
              }`}>
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className={`max-w-[88%] rounded-lg p-4 space-y-3 ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-gray-200 text-gray-800 shadow-2xs"
              }`}>
                
                {/* Header: Sender & Timestamp */}
                <div className={`flex items-center justify-between text-xs pb-1.5 border-b ${
                  msg.sender === "user"
                    ? "text-blue-100 border-blue-500/40"
                    : "text-gray-500 border-gray-100"
                }`}>
                  <span className="font-semibold">
                    {msg.sender === "user" ? "Studio Developer" : "Daksh AI Orchestrator"}
                  </span>
                  <span className="font-mono text-[10px]">{msg.timestamp}</span>
                </div>

                {/* Thought Process (Collapsible) */}
                {msg.thoughtProcess && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-[11px] font-mono text-gray-700">
                    <button 
                      onClick={() => setExpandedThoughtId(expandedThoughtId === msg.id ? null : msg.id)}
                      className="flex items-center justify-between w-full text-[10px] text-blue-600 hover:underline"
                    >
                      <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Simulation Reasoning & Planning</span>
                      </span>
                      <span>{expandedThoughtId === msg.id ? "▲ Hide" : "▼ Show"}</span>
                    </button>
                    {expandedThoughtId === msg.id && (
                      <div className="mt-2 whitespace-pre-line text-gray-700 text-[11px] leading-relaxed border-t border-gray-200 pt-2">
                        {msg.thoughtProcess}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Message Text */}
                <div className={`text-xs sm:text-[13px] leading-relaxed ${
                  msg.sender === "user" ? "text-white" : "text-gray-800"
                }`}>
                  {formatChatMessage(msg.text)}
                </div>

                {/* Interactive Project Selection Cards (Rendered if in project selection mode) */}
                {msg.isProjectSelectCard && (
                  <div className="pt-2 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Available Game Projects ({availableTitles.length}):
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableTitles.map((title) => (
                        <div
                          key={title.id}
                          className="bg-white border border-gray-300 hover:border-blue-500 rounded-lg p-4 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 text-sm">{title.name}</span>
                              <span className="font-mono text-[11px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                                {title.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>Nakama :7350 · PostgreSQL :5432</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end">
                            <Link
                              href={`/dashboard/${title.id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-xs"
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
                        className="bg-gray-50 hover:bg-blue-50/40 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg p-4 text-center transition-colors flex flex-col justify-center items-center py-6 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 mb-2 shadow-2xs">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs text-gray-800">Provision New Title</span>
                        <span className="text-[11px] text-gray-500 mt-0.5">Spin up isolated microservices</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Executed MCP Tool Cards */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1.5 pt-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Executed MCP Tools ({msg.toolCalls.length}):
                    </div>
                    {msg.toolCalls.map((tc, idx) => (
                      <div 
                        key={idx}
                        className="bg-slate-50 border-l-4 border-l-blue-600 border border-slate-200 rounded p-2.5 text-[11px] font-mono space-y-1 text-slate-800 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 font-bold flex items-center gap-1.5">
                            <Terminal className="w-3 h-3 text-blue-600" />
                            <span>{tc.toolName}</span>
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            tc.isError ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                            {tc.isError ? "ERROR" : "200 OK"} · {tc.latencyMs}ms
                          </span>
                        </div>
                        <div className="text-gray-600 text-[10px] truncate">
                          args: {JSON.stringify(tc.args)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simulation Summary Banner */}
                {msg.simulationResult && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded text-emerald-800 font-mono">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{msg.simulationResult.summary}</span>
                    </span>
                    {msg.simulationResult.latencyMs && (
                      <span className="text-gray-500 text-[10px]">{msg.simulationResult.latencyMs}ms</span>
                    )}
                  </div>
                )}

              </div>
            </div>
          ))}

          {/* Live Thinking Indicator */}
          {isProcessing && (
            <div className="flex items-center space-x-2 text-gray-700 text-xs py-1">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-3.5 py-2 flex items-center space-x-2.5 shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span className="font-medium text-gray-700">Listening & Simulating LiveOps through MCP...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Menus (Only when title is selected) */}
        {!isProjectSelector && (
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Operations Presets:</span>
              </span>
              <span className="text-gray-500 text-[11px]">Click preset to execute via MCP</span>
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
              {menuCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
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
                    className="bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-[11px] px-2.5 py-1 rounded border border-gray-200 hover:border-blue-400 transition-colors shadow-2xs flex items-center space-x-1 disabled:opacity-50"
                  >
                    <span>"{p}"</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Conversational Input Bar (AdminLTE Card Footer) */}
        <div className="p-3 sm:p-4 bg-gray-50">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center bg-white border border-gray-300 rounded shadow-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden"
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
              className="w-full bg-white text-gray-900 placeholder-gray-400 text-xs sm:text-sm px-3.5 py-2.5 outline-none"
            />
            {inputPrompt && (
              <button
                type="button"
                onClick={() => setInputPrompt("")}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isProcessing || !inputPrompt.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white text-xs font-semibold px-4 py-2.5 flex items-center space-x-1.5 transition-colors shrink-0"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>

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
