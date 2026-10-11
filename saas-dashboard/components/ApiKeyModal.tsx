"use client";

import { useState, useEffect } from "react";
import { Key, X, Check, ShieldCheck, Sparkles, AlertCircle, Copy } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (newKey: string, provider: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [provider, setProvider] = useState("daksh-sim");
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setKeyInput(apiKey);
    const savedProvider = localStorage.getItem("daksh_ai_provider");
    if (savedProvider) setProvider(savedProvider);
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyInput, provider);
    localStorage.setItem("daksh_ai_provider", provider);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(keyInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] border border-slate-700 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">AI Orchestrator API Key Configuration</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your LLM provider key or use the built-in LiveOps Simulation engine.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          
          {/* Provider Selector */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 uppercase text-[10px] tracking-wider">
              AI Provider / Simulation Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setProvider("daksh-sim");
                  setKeyInput("daksh_sim_prod_liveops_90218374");
                }}
                className={`p-2.5 rounded border text-left transition-all ${
                  provider === "daksh-sim"
                    ? "bg-indigo-950/80 border-indigo-500 text-white shadow-xs"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Daksh Simulation</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Built-in zero config engine</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider("custom-llm");
                  if (keyInput === "daksh_sim_prod_liveops_90218374") setKeyInput("");
                }}
                className={`p-2.5 rounded border text-left transition-all ${
                  provider === "custom-llm"
                    ? "bg-indigo-950/80 border-indigo-500 text-white shadow-xs"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Custom LLM Key</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Gemini / OpenAI / Anthropic</div>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300 uppercase text-[10px] tracking-wider">
                Active API Key
              </label>
              <button
                type="button"
                onClick={copyKey}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. daksh_sim_... or AIzaSy... or sk-..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded p-2.5 font-mono text-xs"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {provider === "daksh-sim" 
                ? "The built-in key runs autonomous simulations and real-time MCP tool executions without quota limits."
                : "Your key is stored securely in your browser session and used for real-time model completions."}
            </p>
          </div>

          {/* Capabilities Badge */}
          <div className="bg-slate-900/90 border border-slate-800 rounded p-3 text-[11px] space-y-1.5 text-slate-300">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Orchestrator Security & Simulation Guarantees</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
              <div>✓ Model Context Protocol (MCP)</div>
              <div>✓ Zod Payload Validation</div>
              <div>✓ Server-Authoritative State</div>
              <div>✓ Zero Direct Client Writes</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Key Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
