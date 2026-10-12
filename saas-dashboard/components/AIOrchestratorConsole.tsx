"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Terminal, Wrench, Send, CheckCircle2, 
  RefreshCw, Database, ArrowRight, X, 
  Cpu, Plus
} from "lucide-react";
import MCPToolsModal from "./MCPToolsModal";

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

interface LeaderboardRankPreview {
  rank: number;
  player: string;
  score: string;
}

interface InteractiveCard {
  id: string;
  title: string;
  badge?: string;
  description: string;
  previewRanks?: LeaderboardRankPreview[];
  icon?: string;
  prompt: string;
}

interface SuggestedAction {
  label: string;
  prompt: string;
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
  interactiveCards?: InteractiveCard[];
  suggestedActions?: SuggestedAction[];
}

function formatChatMessage(text: string) {
  // First split out ``` code blocks
  const chunks = text.split(/(```[\s\S]*?```)/g);

  return chunks.map((chunk, chunkIdx) => {
    if (chunk.startsWith("```") && chunk.endsWith("```")) {
      const firstLineBreak = chunk.indexOf("\n");
      const lang = firstLineBreak !== -1 ? chunk.slice(3, firstLineBreak).trim() : "";
      const code = firstLineBreak !== -1 ? chunk.slice(firstLineBreak + 1, -3) : chunk.slice(3, -3);

      return (
        <div key={chunkIdx} className="my-3 rounded-2xl overflow-hidden border border-gray-800 bg-[#0d1117] shadow-sm text-left">
          <div className="bg-[#161b22] px-4 py-2 text-[11px] font-mono font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between border-b border-gray-800">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              <span>{lang || "code"}</span>
            </span>
            <span className="text-[10px] text-gray-500 font-sans normal-case">copy & paste into project</span>
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed select-all">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }

    const lines = chunk.split("\n");
    return (
      <div key={chunkIdx} className="space-y-1">
        {lines.map((rawLine, lineIdx) => {
          let line = rawLine;

          // Markdown Headings
          if (line.trim().startsWith("### ")) {
            return (
              <h3 key={lineIdx} className="text-lg font-bold text-gray-900 tracking-tight mt-3 mb-1">
                {line.trim().slice(4)}
              </h3>
            );
          }
          if (line.trim().startsWith("## ")) {
            return (
              <h2 key={lineIdx} className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mt-3 mb-1">
                {line.trim().slice(3)}
              </h2>
            );
          }
          if (line.trim().startsWith("# ")) {
            return (
              <h1 key={lineIdx} className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mt-3 mb-1">
                {line.trim().slice(2)}
              </h1>
            );
          }

          // Bold formatting: **text**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formattedParts = parts.map((part, partIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={partIdx} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            // Inline code formatting: `code`
            const subParts = part.split(/(`.*?`)/g);
            return subParts.map((subPart, subIdx) => {
              if (subPart.startsWith("`") && subPart.endsWith("`")) {
                return (
                  <code key={`${partIdx}-${subIdx}`} className="bg-gray-100 text-gray-800 text-[12px] px-1.5 py-0.5 rounded font-mono border border-gray-200">
                    {subPart.slice(1, -1)}
                  </code>
                );
              }
              return subPart;
            });
          });

          // Bullet points
          if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
            return (
              <div key={lineIdx} className="flex items-start space-x-2 my-1 pl-1">
                <span className="text-gray-400 mt-1 select-none">•</span>
                <span className="flex-1">{formattedParts}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.trim().match(/^(\d+)\.\s+/);
          if (numMatch) {
            return (
              <div key={lineIdx} className="flex items-start space-x-2 my-1 pl-1">
                <span className="text-blue-600 font-semibold text-xs mt-0.5 select-none">{numMatch[1]}.</span>
                <span className="flex-1">{formattedParts}</span>
              </div>
            );
          }

          if (line.trim() === "") {
            return <div key={lineIdx} className="h-1.5"></div>;
          }

          return <p key={lineIdx} className="text-sm sm:text-base leading-relaxed text-gray-700">{formattedParts}</p>;
        })}
      </div>
    );
  });
}

export default function AIOrchestratorConsole({ 
  titleId = "", 
  titleName = "",
  isProjectSelector = false,
  onOpenCreateTitle
}: AIOrchestratorConsoleProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState("daksh_sim_prod_liveops_90218374");
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [availableTitles, setAvailableTitles] = useState<TitleRecord[]>([]);

  // Onboarding & provisioning state
  const [quickTitleName, setQuickTitleName] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
        setAvailableTitles([]);
      }
    } catch (e) {
      setAvailableTitles([]);
    }
  }, []);

  // Compute clean display title name (avoid raw IDs like YCSLW)
  const displayTitleName = useMemo(() => {
    if (titleName && titleName !== titleId && titleName !== "Main Game Title") {
      return titleName;
    }
    const found = availableTitles.find(t => t.id === titleId);
    if (found?.name) return found.name;

    try {
      const saved = localStorage.getItem("daksh_titles");
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = parsed.find((t: any) => t.id === titleId);
        if (match?.name) return match.name;
      }
    } catch (e) {}

    return titleName || titleId || "Game Project";
  }, [titleName, titleId, availableTitles]);

  // Load saved API Key
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("daksh_ai_api_key");
      if (savedKey) setApiKey(savedKey);
    } catch (e) {}
  }, []);

  // Auto-scroll chat to start of new AI responses, or bottom for user
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.sender === "orchestrator") {
      const el = document.getElementById(`msg-${lastMsg.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Quick title creation & direct k8s provision handler
  const handleQuickProvision = async (nameToProvision: string) => {
    if (!nameToProvision.trim() || isProvisioning) return;
    setIsProvisioning(true);

    const cleanAlnum = nameToProvision.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const shortTitleId = (cleanAlnum.length >= 3 ? cleanAlnum.substring(0, 5) : Math.random().toString(36).substring(2, 7)).toUpperCase();
    const randomHex = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const uniqueSecret = `sk_live_${shortTitleId}_${randomHex}`;

    const newTitleRecord = {
      id: shortTitleId,
      name: nameToProvision.trim(),
      status: "Healthy",
      players: "0 CCU",
      secretKey: uniqueSecret
    };

    const updated = [...availableTitles, newTitleRecord];
    localStorage.setItem("daksh_titles", JSON.stringify(updated));
    setAvailableTitles(updated);

    try {
      await fetch("/api/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId: shortTitleId, secretKey: uniqueSecret })
      });
    } catch (e) {}

    setIsProvisioning(false);
    router.push(`/dashboard/${shortTitleId}`);
  };

  // Reset entire environment to replay journey from the start
  const handleStartFresh = async () => {
    if (typeof window !== "undefined" && !window.confirm("Reset all user accounts and data to start fresh? The Kubernetes engine will stay running.")) {
      return;
    }
    setIsResetting(true);
    try {
      await fetch("/api/reset", { method: "POST" });
    } catch (e) {}

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    setIsResetting(false);
    window.location.href = "/dashboard";
  };

  // Send prompt to AI chat route
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isProcessing) return;

    // IF ON ROOT PROJECT SELECTOR AND THERE ARE NO PROJECTS YET: The user is answering what their game name is!
    if (isProjectSelector && availableTitles.length === 0) {
      const userMsg: ChatMessage = {
        id: `usr_${Date.now()}`,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: query
      };
      setMessages(prev => [...prev, userMsg]);
      setInputPrompt("");
      setIsProcessing(true);

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "orchestrator",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `**Creating project "${query}"...**\n\nProvisioning isolated database and game server microservices...`
      };
      setMessages(prev => [...prev, aiMsg]);

      await handleQuickProvision(query);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();

    // 1. Clear chat shortcut
    if (lowerQuery === "clear" || lowerQuery === "clear chat") {
      clearChat();
      setInputPrompt("");
      return;
    }

    // 2. Start Fresh / Reset shortcut
    if (lowerQuery === "start fresh" || lowerQuery === "reset") {
      setInputPrompt("");
      handleStartFresh();
      return;
    }

    // 3. Switch / View Projects
    if (lowerQuery === "switch project" || lowerQuery === "projects" || lowerQuery === "all projects") {
      setInputPrompt("");
      router.push("/dashboard");
      return;
    }

    // 4. MCP Tools specification
    if (lowerQuery === "tools" || lowerQuery === "mcp tools" || lowerQuery === "show tools" || lowerQuery === "help") {
      setInputPrompt("");
      setIsToolsModalOpen(true);
      return;
    }

    // 5. CSV Data Export
    if ((lowerQuery.includes("export") || lowerQuery.includes("download")) && lowerQuery.includes("csv")) {
      window.location.href = `/api/titles/${titleId || "default"}/analytics/export?format=csv`;
      const userMsg: ChatMessage = {
        id: `usr_${Date.now()}`,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: query
      };
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "orchestrator",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `**Exporting CSV Data**: Initiated telemetry and economy dataset download in standard RFC 4180 CSV format.`,
        simulationResult: {
          status: "ready",
          summary: "CSV export stream initiated successfully"
        }
      };
      setMessages(prev => [...prev, userMsg, aiMsg]);
      setInputPrompt("");
      return;
    }

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
        simulationResult: data.simulationResult,
        interactiveCards: data.interactiveCards,
        suggestedActions: data.suggestedActions
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
        text: `**Simulation Error**: ${err.message}`,
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
    setMessages([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-gray-800 font-sans overflow-hidden relative">
      {/* Main Conversation Stream or Clean Centered Empty State */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin flex flex-col">
        {isProjectSelector ? (
          /* Project Selector View */
          <div className="max-w-2xl mx-auto w-full my-auto py-8 space-y-6">
            {availableTitles.length === 0 ? (
              /* Direct Clean Minimalist Question */
              <div className="space-y-6 text-center max-w-xl mx-auto py-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  What should be the name of your project?
                </h1>

                {/* Direct Project Creation Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (quickTitleName.trim()) {
                      handleQuickProvision(quickTitleName);
                    }
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-md mx-auto pt-2"
                >
                  <input
                    type="text"
                    value={quickTitleName}
                    onChange={(e) => setQuickTitleName(e.target.value)}
                    disabled={isProvisioning}
                    placeholder="Enter project name..."
                    className="flex-1 bg-white border border-gray-300 focus:border-gray-900 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none shadow-xs transition-colors"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isProvisioning || !quickTitleName.trim()}
                    className="bg-gray-900 hover:bg-black disabled:bg-gray-200 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isProvisioning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Deploying...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Project</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Your Game Titles</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Select a game project to enter AI LiveOps console:</p>
                  </div>
                  <button
                    onClick={onOpenCreateTitle}
                    className="bg-gray-900 hover:bg-black text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Title</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {availableTitles.map((title) => (
                    <Link
                      key={title.id}
                      href={`/dashboard/${title.id}`}
                      className="bg-white border border-gray-200 hover:border-gray-900 rounded-2xl p-5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 text-base group-hover:text-blue-600 transition-colors">{title.name}</span>
                          <span className="font-mono text-xs bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-full border border-gray-200">
                            {title.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Backend Online · Microservices Ready</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                        <span>Open LiveOps</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : messages.length === 0 ? (
          /* Ultra-Clean Question Without Technical Jargon */
          <div className="space-y-6 text-center max-w-xl mx-auto py-16 my-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              What would you like to set up?
            </h1>

            {/* Direct Input for Setup */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputPrompt.trim()) {
                  handleSendMessage();
                }
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-md mx-auto pt-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={isProcessing}
                placeholder="e.g. Currencies, Store items, Leaderboards..."
                className="flex-1 bg-white border border-gray-300 focus:border-gray-900 rounded-xl px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none shadow-xs transition-colors"
                autoFocus
              />
              <button
                type="submit"
                disabled={isProcessing || !inputPrompt.trim()}
                className="bg-gray-900 hover:bg-black disabled:bg-gray-200 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Active ChatGPT Conversation Stream */
          <div className="max-w-3xl mx-auto w-full space-y-6 py-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                id={`msg-${msg.id}`}
                className={`flex gap-3.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`space-y-2.5 ${
                  msg.sender === "user"
                    ? "bg-[#f4f4f4] text-gray-900 rounded-3xl px-5 py-2.5 max-w-[80%] text-sm leading-relaxed"
                    : "flex-1 max-w-[92%] text-sm text-gray-800 leading-relaxed"
                }`}>
                  {/* Message Content (Heading & Prompts) */}
                  <div className={msg.interactiveCards && msg.interactiveCards.length > 0 ? "space-y-1.5 pb-1" : "space-y-1"}>
                    {formatChatMessage(msg.text)}
                  </div>

                  {/* Interactive Cards (e.g. Leaderboard Templates) */}
                  {msg.interactiveCards && msg.interactiveCards.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {msg.interactiveCards.map((card) => (
                        <button
                          key={card.id}
                          onClick={() => handleSendMessage(card.prompt)}
                          disabled={isProcessing}
                          className="text-left bg-white hover:bg-blue-50/20 active:bg-blue-50/40 border border-gray-200 hover:border-blue-500 rounded-2xl p-5 sm:p-6 transition-all shadow-xs hover:shadow-md group cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-gray-900 text-lg sm:text-xl flex items-center gap-2.5 group-hover:text-blue-600 transition-colors">
                                <span>{card.title}</span>
                              </span>
                              {card.badge && (
                                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 shrink-0">
                                  {card.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 mt-2.5 leading-relaxed">
                              {card.description}
                            </p>
                            {card.previewRanks && card.previewRanks.length > 0 && (
                              <div className="mt-4 bg-gray-50/90 rounded-xl p-3 border border-gray-100 space-y-1.5">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-0.5 mb-1">
                                  Standings Preview
                                </div>
                                {card.previewRanks.map((r) => (
                                  <div key={r.rank} className="flex items-center justify-between text-xs py-0.5 px-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 text-left font-bold text-xs text-gray-400">
                                        #{r.rank}
                                      </span>
                                      <span className="font-medium text-gray-800">{r.player}</span>
                                    </div>
                                    <span className="font-mono text-xs text-gray-600 font-semibold">
                                      {r.score}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">1-Click deploy</span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 group-hover:bg-blue-700 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors">
                              Select & Deploy
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested Follow-up Actions (hidden when interactive cards are present) */}
                  {msg.sender === "orchestrator" && (!msg.interactiveCards || msg.interactiveCards.length === 0) && (
                    <div className="pt-2 flex flex-wrap items-center gap-1.5">
                      {msg.suggestedActions && msg.suggestedActions.length > 0 ? (
                        msg.suggestedActions.map((act, actIdx) => (
                          <button
                            key={actIdx}
                            onClick={() => handleSendMessage(act.prompt)}
                            disabled={isProcessing}
                            className="text-xs bg-white hover:bg-gray-50 text-gray-800 hover:text-black border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-full transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 font-medium"
                          >
                            <span>{act.label}</span>
                          </button>
                        ))
                      ) : (
                        <>
                          <button
                            onClick={() => handleSendMessage("List all catalog items and prices")}
                            disabled={isProcessing}
                            className="text-xs bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 px-3 py-1 rounded-full transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>View Store Items</span>
                          </button>
                          <button
                            onClick={() => handleSendMessage("Give 1000 Gold to player Player_01")}
                            disabled={isProcessing}
                            className="text-xs bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 px-3 py-1 rounded-full transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>Reward Player</span>
                          </button>
                          <button
                            onClick={() => handleSendMessage("Help - what else can I do?")}
                            disabled={isProcessing}
                            className="text-xs bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 px-3 py-1 rounded-full transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>What else can you do?</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {isProcessing && (
              <div className="flex items-center space-x-3 text-gray-500 text-sm py-2">
                <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                </div>
                <span className="animate-pulse text-xs">Executing LiveOps operation...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Signature Bottom Floating Input Area - Only when active conversation is ongoing */}
      {messages.length > 0 && !(isProjectSelector && availableTitles.length === 0) && (
        <div className="shrink-0 bg-white/95 backdrop-blur-md pt-3 pb-5 px-4 border-t border-gray-100">
          <div className="max-w-3xl mx-auto w-full space-y-2">
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
                placeholder="Type what you would like to set up..."
                className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm outline-none py-1.5"
              />
              {inputPrompt && (
                <button
                  type="button"
                  onClick={() => setInputPrompt("")}
                  className="text-gray-400 hover:text-gray-600 p-1.5 cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isProcessing || !inputPrompt.trim()}
                className="w-8 h-8 rounded-full bg-gray-900 hover:bg-black disabled:bg-gray-100 disabled:text-gray-300 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                title="Send message (Enter)"
              >
                {isProcessing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-gray-400 font-sans px-1">
              <span>{displayTitleName}</span>
              <span className="hidden sm:inline">Press Enter ↵ to send</span>
            </div>
          </div>
        </div>
      )}

      {/* MCP Tools Specification Modal */}
      <MCPToolsModal
        isOpen={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
      />
    </div>
  );
}
