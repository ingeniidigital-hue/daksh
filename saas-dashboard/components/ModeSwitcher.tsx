"use client";

import { useOperatingMode } from "../context/OperatingModeContext";
import { Wrench, Bot } from "lucide-react";

export default function ModeSwitcher() {
  const { mode, setMode } = useOperatingMode();

  return (
    <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md p-0.5 text-xs font-medium shadow-xs">
      <button
        type="button"
        onClick={() => setMode("manual")}
        className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-all ${
          mode === "manual"
            ? "bg-slate-700 text-white font-semibold shadow-xs"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="Manual Operations Mode: Standard enterprise forms, data tables, and controls"
      >
        <Wrench className="w-3.5 h-3.5 text-slate-300" />
        <span className="hidden sm:inline">Manual Mode</span>
      </button>

      <button
        type="button"
        onClick={() => setMode("ai")}
        className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition-all ${
          mode === "ai"
            ? "bg-indigo-600 text-white font-semibold shadow-xs"
            : "text-slate-400 hover:text-slate-200"
        }`}
        title="AI Mode: Autonomous LiveOps Orchestrator powered by Model Context Protocol (MCP)"
      >
        <Bot className="w-3.5 h-3.5 text-indigo-300" />
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <span className="hidden sm:inline">AI Mode (MCP)</span>
      </button>
    </div>
  );
}
