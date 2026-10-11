"use client";

import { useState, useEffect } from "react";
import { X, Wrench, Shield, Check, Copy, Code, Terminal, ExternalLink } from "lucide-react";

interface MCPToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MCPToolsModal({ isOpen, onClose }: MCPToolsModalProps) {
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/mcp/tools")
      .then(res => res.json())
      .then(data => {
        setTools(data.tools || []);
        if (data.tools && data.tools.length > 0) {
          setSelectedTool(data.tools[0]);
        }
      })
      .catch(err => console.error("Failed to fetch MCP tools", err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToolJson = () => {
    if (!selectedTool) return;
    navigator.clipboard.writeText(JSON.stringify(selectedTool, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] border border-slate-700 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Model Context Protocol (MCP) Tools Registry</h3>
                <span className="bg-emerald-900/60 text-emerald-300 text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-emerald-700/50">
                  Protocol: 2024-11-05
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official JSON-RPC 2.0 tools exposed by Daksh for autonomous AI orchestrators and agents.
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

        {/* Content body with sidebar list & schema details */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tool list */}
          <div className="w-64 border-r border-slate-700 bg-slate-900/40 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Available Tools ({tools.length})
            </div>
            {loading ? (
              <div className="p-4 text-xs text-slate-400 animate-pulse">Loading MCP tools...</div>
            ) : (
              tools.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTool(t)}
                  className={`w-full text-left px-2.5 py-2 rounded text-xs transition-colors flex items-center justify-between ${
                    selectedTool?.name === t.name
                      ? "bg-indigo-600 text-white font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="truncate font-mono text-[11px]">{t.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Details pane */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#0f172a] space-y-4">
            {selectedTool ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold font-mono text-indigo-400">{selectedTool.name}</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedTool.description}</p>
                  </div>
                  <button
                    onClick={copyToolJson}
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded border border-slate-700 transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy JSON"}</span>
                  </button>
                </div>

                {/* Schema section */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                    <Code className="w-3.5 h-3.5 text-slate-400" />
                    <span>Input Schema & Arguments</span>
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(selectedTool.inputSchema, null, 2)}
                  </pre>
                </div>

                {/* JSON-RPC Example */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    <span>JSON-RPC 2.0 Invocations</span>
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{JSON.stringify({
  jsonrpc: "2.0",
  id: "req_001",
  method: "tools/call",
  params: {
    name: selectedTool.name,
    arguments: Object.fromEntries(
      Object.keys(selectedTool.inputSchema?.properties || {}).map(k => [k, "..."])
    )
  }
}, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-500">
                Select a tool to view its Model Context Protocol schema.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-[11px]">POST /api/mcp · POST /api/mcp/call</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
