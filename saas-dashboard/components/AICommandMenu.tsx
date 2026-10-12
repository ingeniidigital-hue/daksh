"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Terminal,
  X,
  Check,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Coins,
  Database,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Flame,
  Code2,
  Lock
} from "lucide-react";

interface AICommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  titleName: string;
}

interface ParsedActionPreview {
  action: "CREATE_CATALOG_ITEM" | "ADJUST_WALLET" | "SET_TITLE_DATA" | "REJECTED";
  confidence: number;
  payload: any;
  suggestions?: string[];
  error?: string;
}

export default function AICommandMenu({ isOpen, onClose, titleId, titleName }: AICommandMenuProps) {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedIntent, setParsedIntent] = useState<ParsedActionPreview | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setAppliedSuccess(false);
      setExecutionResult(null);
    }
  }, [isOpen]);

  // Quick Action Recipes for instant inspiration
  const quickRecipes = [
    {
      label: "Epic Dragon Armor",
      prompt: "Create an Epic Dragon Armor for 500 Gems"
    },
    {
      label: "Rare Mithril Sword",
      prompt: "Create a Rare Mithril Sword for 350 Gold"
    },
    {
      label: "Credit Player Currency",
      prompt: "Give 1000 Gold to player hero_99"
    },
    {
      label: "Remote Title Data Config",
      prompt: "Set config XP_Multiplier to 2.5"
    }
  ];

  // Parse prompt via real backend AI route with Zod schema validation
  const handleParsePrompt = async (textToParse: string) => {
    const text = textToParse || prompt;
    if (!text.trim()) return;

    setIsProcessing(true);
    setExecutionResult(null);

    try {
      const res = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleId: titleId || "TITLE_GAME_01",
          prompt: text,
          execute: false
        })
      });

      const data = await res.json();
      if (res.ok && data.intent) {
        setParsedIntent(data.intent);
      } else if (data.intent) {
        setParsedIntent(data.intent);
      } else {
        setParsedIntent({
          action: "REJECTED",
          confidence: 0,
          error: data.error || "Failed to parse command",
          suggestions: data.suggestions || ["Try: 'Create an Epic Sword for 200 Gold'"],
          payload: null
        });
      }
    } catch (err: any) {
      setParsedIntent({
        action: "REJECTED",
        confidence: 0,
        error: err.message,
        suggestions: ["Try: 'Create an Epic Sword for 200 Gold'"],
        payload: null
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute confirmed intent against real backend API
  const handleExecuteAction = async () => {
    if (!parsedIntent || parsedIntent.action === "REJECTED") return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleId: titleId || "TITLE_GAME_01",
          prompt: prompt,
          execute: true
        })
      });

      const data = await res.json();
      if (res.ok && data.execution) {
        setExecutionResult(data.execution);
        setAppliedSuccess(true);

        // Dispatch global CustomEvent for zero-reload live views
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("daksh_data_updated", {
              detail: data.execution.eventPayload || { titleId }
            })
          );
        }

        setTimeout(() => {
          onClose();
          setParsedIntent(null);
          setPrompt("");
          setAppliedSuccess(false);
        }, 1800);
      } else {
        alert(data.error || "Failed to execute command");
      }
    } catch (err: any) {
      alert(`Execution error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="bg-[#1C2026] text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-700/80 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#161A1F]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">AI Command Menu</span>
                <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                  Open MCP Ready
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Natural language game ops engine for <span className="text-gray-200">{titleName || "Active Game"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-800 rounded border border-gray-700">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-b border-gray-800 bg-[#191D24]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleParsePrompt(prompt);
            }}
            className="relative flex items-center"
          >
            <Terminal className="w-5 h-5 text-blue-400 absolute left-4 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Create an Epic Dragon Armor for 500 Gems' or 'Give 1000 Gold to player hero_99'"
              className="w-full bg-[#13161B] text-white placeholder-gray-500 text-sm rounded-2xl pl-12 pr-28 py-3.5 border border-gray-700/60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
            />
            <button
              type="submit"
              disabled={isProcessing || !prompt.trim()}
              className="absolute right-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
            >
              {isProcessing ? (
                <span>Parsing...</span>
              ) : (
                <>
                  <span>Parse</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Recipe Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider shrink-0">
              Quick:
            </span>
            {quickRecipes.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(r.prompt);
                  handleParsePrompt(r.prompt);
                }}
                className="text-xs bg-[#242933] hover:bg-[#2F3542] text-gray-300 hover:text-white px-3 py-1 rounded-full border border-gray-700/60 whitespace-nowrap transition-all"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Preview & Execution */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {appliedSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-in zoom-in-75">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-lg font-bold text-white">Action Executed Live!</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Changes committed to backend database and event <code className="text-blue-400">daksh_data_updated</code> was broadcast.
              </p>
            </div>
          ) : parsedIntent ? (
            <div className="space-y-4">
              {parsedIntent.action === "REJECTED" ? (
                <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Command Rejected</span>
                  </div>
                  <p className="text-rose-200">{parsedIntent.error}</p>
                  {parsedIntent.suggestions && (
                    <div className="pt-2 border-t border-rose-900/40">
                      <p className="text-gray-400 font-semibold mb-1">Suggestions:</p>
                      <ul className="space-y-1 list-disc list-inside text-gray-300">
                        {parsedIntent.suggestions.map((s, idx) => (
                          <li key={idx} className="font-mono">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#15181E] border border-gray-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-sm text-white">Parsed Intent Preview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {parsedIntent.action}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                        {Math.round(parsedIntent.confidence * 100)}% Confidence
                      </span>
                    </div>
                  </div>

                  {/* Intent Details */}
                  {parsedIntent.action === "CREATE_CATALOG_ITEM" && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-black/40 rounded-xl border border-gray-800 space-y-1">
                        <span className="text-gray-400 block">Item Name & ID</span>
                        <span className="font-bold text-white block">{parsedIntent.payload.name}</span>
                        <code className="text-[11px] text-gray-400 font-mono">{parsedIntent.payload.id}</code>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-gray-800 space-y-1">
                        <span className="text-gray-400 block">Prices & Rarity</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-400 font-bold">
                            {JSON.stringify(parsedIntent.payload.prices)}
                          </span>
                          {parsedIntent.payload.metadata?.rarity && (
                            <span className="px-1.5 py-0.2 text-[10px] rounded bg-purple-500/20 text-purple-300">
                              {parsedIntent.payload.metadata.rarity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {parsedIntent.action === "ADJUST_WALLET" && (
                    <div className="p-3 bg-black/40 rounded-xl border border-gray-800 text-xs space-y-1">
                      <span className="text-gray-400">Target Player & Balance</span>
                      <div className="font-mono text-emerald-400">
                        Grant +{parsedIntent.payload.amount} {parsedIntent.payload.currencyCode} to player{" "}
                        <span className="text-white font-bold">{parsedIntent.payload.playerId}</span>
                      </div>
                    </div>
                  )}

                  {parsedIntent.action === "SET_TITLE_DATA" && (
                    <div className="p-3 bg-black/40 rounded-xl border border-gray-800 text-xs space-y-1">
                      <span className="text-gray-400">Remote Config Key</span>
                      <div className="font-mono text-amber-400">
                        {parsedIntent.payload.key} = {parsedIntent.payload.value}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2 border-t border-gray-800">
                    <button
                      onClick={() => setParsedIntent(null)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteAction}
                      disabled={isProcessing}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Execute Action Live</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 space-y-2">
              <Code2 className="w-8 h-8 mx-auto text-gray-600" />
              <p className="text-xs">Type a command above or click one of the quick action recipes.</p>
              <p className="text-[11px] text-gray-600">
                Supports catalog creation, wallet adjustments, and title configuration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
