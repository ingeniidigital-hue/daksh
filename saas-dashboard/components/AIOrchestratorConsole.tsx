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
import ModeSwitcher from "./ModeSwitcher";

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
    <div className="flex-1 flex flex-col h-full bg-white text-gray-800 font-sans overflow-hidden relative">
      
      {/* Top Header */}
      <header className="h-14 border-b border-gray-100 px-6 flex items-center justify-between shrink-0 bg-white sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900 text-sm tracking-tight">Daksh</span>
            <span className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
              LiveOps
            </span>
          </div>

          <div className="h-4 w-px bg-gray-200"></div>

          {/* Active Project Pill */}
          {!isProjectSelector ? (
            <Link
              href="/dashboard"
              className="flex items-center space-x-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
              title="Switch active game project"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-gray-900">{titleName}</span>
              <span className="text-[11px] text-gray-500 font-mono">({titleId})</span>
              <span className="text-[11px] text-blue-600 font-semibold ml-0.5">Switch ▾</span>
            </Link>
          ) : (
            <div className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-gray-500" />
              <span>Project Select</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Switcher: Manual vs AI */}
          <ModeSwitcher />

          {/* MCP Tools Button */}
          <button
            onClick={() => setIsToolsModalOpen(true)}
            className="flex items-center space-x-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <Wrench className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">12 Tools</span>
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="flex items-center space-x-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-mono text-[11px] hidden md:inline truncate max-w-[80px]">{apiKey.slice(0, 10)}...</span>
          </button>

          {/* Optional Manual Inspector Toggle */}
          {showInspectorToggle && onToggleInspector && (
            <button
              onClick={onToggleInspector}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                isInspectorOpen 
                  ? "bg-gray-900 text-white border-gray-900 font-medium" 
                  : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
              }`}
              title="Toggle manual raw tables inspector"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isInspectorOpen ? "Hide Inspector" : "Inspector"}</span>
            </button>
          )}

          {/* Clear Chat */}
          <button
            onClick={clearChat}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main ChatGPT Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-8 scrollbar-thin">
        <div className="max-w-3xl mx-auto w-full space-y-8">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "orchestrator" && (
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
              )}

              <div className={`space-y-3 ${
                msg.sender === "user"
                  ? "bg-[#f4f4f4] text-gray-900 rounded-3xl px-5 py-3 max-w-[80%] text-sm sm:text-[15px] leading-relaxed shadow-2xs"
                  : "flex-1 max-w-[90%] text-sm sm:text-[15px] text-gray-800 leading-relaxed"
              }`}>
                {/* Assistant header line */}
                {msg.sender === "orchestrator" && (
                  <div className="flex items-center space-x-2 text-xs text-gray-400 font-medium">
                    <span className="text-gray-900 font-semibold">Daksh</span>
                    <span>·</span>
                    <span className="font-mono text-[11px]">{msg.timestamp}</span>
                  </div>
                )}

                {/* Thought Process (Collapsible) */}
                {msg.thoughtProcess && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600">
                    <button 
                      onClick={() => setExpandedThoughtId(expandedThoughtId === msg.id ? null : msg.id)}
                      className="flex items-center justify-between w-full text-xs text-gray-500 hover:text-gray-900"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                        <span>Simulation Reasoning</span>
                      </span>
                      <span>{expandedThoughtId === msg.id ? "▲ Hide" : "▼ Expand"}</span>
                    </button>
                    {expandedThoughtId === msg.id && (
                      <div className="mt-2 whitespace-pre-line text-gray-600 text-xs leading-relaxed border-t border-gray-200 pt-2 font-mono">
                        {msg.thoughtProcess}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div className="space-y-1">
                  {formatChatMessage(msg.text)}
                </div>

                {/* Project Selection Cards */}
                {msg.isProjectSelectCard && (
                  <div className="pt-4 space-y-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Select Game Project:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {availableTitles.map((title) => (
                        <div
                          key={title.id}
                          className="bg-white border border-gray-200 hover:border-gray-900 rounded-2xl p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900 text-base">{title.name}</span>
                              <span className="font-mono text-xs bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-full border border-gray-200">
                                {title.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>Nakama :7350 · PostgreSQL :5432</span>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end">
                            <Link
                              href={`/dashboard/${title.id}`}
                              className="bg-gray-900 group-hover:bg-black text-white font-medium text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <span>Select Project</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}

                      {/* Provision New Title Card */}
                      <button
                        onClick={onOpenCreateTitle}
                        className="bg-gray-50 hover:bg-white border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-2xl p-5 text-center transition-all flex flex-col justify-center items-center py-6 cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 mb-2 shadow-xs">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs text-gray-900">Provision New Title</span>
                        <span className="text-[11px] text-gray-500 mt-0.5">Spin up isolated microservices</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Executed MCP Tool Cards */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {msg.toolCalls.map((tc, idx) => (
                      <div 
                        key={idx}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono space-y-1 text-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-semibold flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-blue-600" />
                            <span>{tc.toolName}</span>
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-medium ${
                            tc.isError ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {tc.isError ? "Error" : "Success"} · {tc.latencyMs}ms
                          </span>
                        </div>
                        <div className="text-gray-500 text-[11px] truncate">
                          args: {JSON.stringify(tc.args)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Simulation Summary Banner */}
                {msg.simulationResult && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl text-emerald-900 font-medium">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{msg.simulationResult.summary}</span>
                    </span>
                    {msg.simulationResult.latencyMs && (
                      <span className="text-gray-500 text-[11px] font-mono">{msg.simulationResult.latencyMs}ms</span>
                    )}
                  </div>
                )}

              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isProcessing && (
            <div className="flex items-center space-x-3 text-gray-500 text-sm py-2">
              <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>
              <span className="animate-pulse">Thinking & executing via MCP...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Signature ChatGPT Bottom Floating Input Area */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md pt-2 pb-5 px-4 border-t border-gray-100">
        <div className="max-w-3xl mx-auto w-full space-y-2.5">
          
          {/* Suggestion Chips */}
          {!isProjectSelector && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {menuCategories
                .find((c) => c.id === activeCategory)
                ?.prompts.slice(0, 3).map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    disabled={isProcessing}
                    className="bg-white hover:bg-gray-50 text-gray-700 text-xs px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 transition-all shadow-2xs whitespace-nowrap"
                  >
                    <span>"{p}"</span>
                  </button>
                ))}
            </div>
          )}

          {/* Input Pill */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center bg-white border border-gray-300 focus-within:border-gray-900 focus-within:shadow-md rounded-3xl p-1.5 pl-4 transition-all shadow-xs"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isProcessing}
              placeholder={
                isProjectSelector 
                  ? "Select a project above or type a command..." 
                  : `Ask Daksh to manage liveops, simulate events for ${titleName}...`
              }
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm outline-none py-1.5"
            />
            {inputPrompt && (
              <button
                type="button"
                onClick={() => setInputPrompt("")}
                className="text-gray-400 hover:text-gray-600 p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isProcessing || !inputPrompt.trim()}
              className="w-8 h-8 rounded-full bg-gray-900 hover:bg-black disabled:bg-gray-100 disabled:text-gray-300 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>

          <div className="text-[11px] text-gray-400 text-center font-sans">
            Daksh LiveOps AI Orchestrator · Autonomous microservice management via Model Context Protocol
          </div>
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
