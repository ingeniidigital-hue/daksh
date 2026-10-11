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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-300 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden text-gray-800 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">AI Orchestrator API Key Configuration</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure your LLM provider key or use the built-in LiveOps Simulation engine.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          
          {/* Provider Selector */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-wider">
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
                    ? "bg-blue-50 border-blue-500 text-blue-900 shadow-2xs"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Daksh Simulation</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Built-in zero config engine</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider("custom-llm");
                  if (keyInput === "daksh_sim_prod_liveops_90218374") setKeyInput("");
                }}
                className={`p-2.5 rounded border text-left transition-all ${
                  provider === "custom-llm"
                    ? "bg-blue-50 border-blue-500 text-blue-900 shadow-2xs"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Custom LLM Key</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">Gemini / OpenAI / Anthropic</div>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">
                Active API Key
              </label>
              <button
                type="button"
                onClick={copyKey}
                className="text-gray-500 hover:text-gray-800 flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="e.g. daksh_sim_... or AIzaSy... or sk-..."
              className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 rounded p-2.5 font-mono text-xs shadow-2xs"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {provider === "daksh-sim" 
                ? "The built-in key runs autonomous simulations and real-time MCP tool executions without quota limits."
                : "Your key is stored securely in your browser session and used for real-time model completions."}
            </p>
          </div>

          {/* Capabilities Badge */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-[11px] space-y-1.5 text-gray-700">
            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Orchestrator Security & Simulation Guarantees</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500">
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
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors border border-gray-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
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
