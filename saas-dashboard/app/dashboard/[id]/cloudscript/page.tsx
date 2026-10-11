"use client";

import { useState, Suspense } from "react";
import { Play, Save, Server, Code, FileText, Clock, Terminal, ChevronRight, Activity, Plus } from "lucide-react";

// Mock Initial Scripts
const INITIAL_SCRIPTS = [
  {
    id: "script_1",
    name: "main.ts",
    type: "typescript",
    content: `// Nakama Server Runtime (TypeScript)
// Entry point for custom server logic

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    logger.info("Initializing Game Server logic...");

    // Register an RPC function to grant a daily reward
    initializer.registerRpc("grant_daily_reward", rpcGrantDailyReward);
    
    // Hook into after-authenticate to set up new players
    initializer.registerAfterAuthenticateEmail(afterAuthEmail);
    
    logger.info("Server logic successfully initialized.");
}
`,
    lastModified: "2 hours ago",
    status: "live"
  },
  {
    id: "script_2",
    name: "rewards.ts",
    type: "typescript",
    content: `// Handles Daily Reward Grants
function rpcGrantDailyReward(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not found");
    }

    // Grant 100 Gold (GO)
    const changeset = {
        "GO": 100
    };
    
    try {
        nk.walletUpdate(userId, changeset, {}, true);
        logger.info(\`Granted 100 GO to user: \${userId}\`);
        return JSON.stringify({ success: true, granted: 100 });
    } catch (error) {
        logger.error(\`Failed to grant reward: \${error.message}\`);
        throw new Error("Internal Server Error");
    }
}
`,
    lastModified: "1 day ago",
    status: "draft"
  },
  {
    id: "script_3",
    name: "hooks.ts",
    type: "typescript",
    content: `// Hooks for Nakama events
function afterAuthEmail(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, out: nkruntime.Session, inReq: nkruntime.AuthenticateEmailRequest) {
    logger.info(\`New user authenticated via email: \${ctx.userId}\`);
    
    // Add default title data or starter pack logic here
}
`,
    lastModified: "3 days ago",
    status: "live"
  }
];

function CloudScriptPageContent() {
  const [scripts, setScripts] = useState(INITIAL_SCRIPTS);
  const [activeScriptId, setActiveScriptId] = useState(INITIAL_SCRIPTS[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] CloudScript environment ready.", "[SYSTEM] Nakama Server Runtime (v3.19.0)"]);
  const [isDeploying, setIsDeploying] = useState(false);

  const activeScript = scripts.find(s => s.id === activeScriptId) || scripts[0];

  const handleContentChange = (newContent: string) => {
    setScripts(scripts.map(s => s.id === activeScriptId ? { ...s, content: newContent, status: "draft", lastModified: "just now" } : s));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Saved ${activeScript.name}`]);
    }, 600);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setScripts(scripts.map(s => s.id === activeScriptId ? { ...s, status: "live" } : s));
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Successfully deployed ${activeScript.name} to Production!`]);
    }, 1500);
  };

  const runTest = () => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Executing ${activeScript.name} in Sandbox...`]);
    setTimeout(() => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [INFO] Execution completed successfully.`]);
    }, 800);
  };

  const createNewScript = () => {
    const newId = `script_${Date.now()}`;
    const newScript = {
      id: newId,
      name: `new_script_${scripts.length + 1}.ts`,
      type: "typescript",
      content: "// Write your server logic here\\n",
      lastModified: "just now",
      status: "draft"
    };
    setScripts([...scripts, newScript]);
    setActiveScriptId(newId);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#1e1e1e] text-gray-300 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-[#2d2d2d] border-b border-[#3d3d3d] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-green-400" />
            CloudScript IDE <span className="text-sm font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded ml-2">Nakama Runtime</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={runTest}
            className="flex items-center gap-2 px-4 py-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" /> Run Test
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Draft"}
          </button>
          <button 
            onClick={handleDeploy}
            disabled={isDeploying || activeScript.status === "live"}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Activity className="w-4 h-4" /> {isDeploying ? "Deploying..." : "Deploy to Live"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Tree */}
        <aside className="w-64 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          <div className="p-4 border-b border-[#3d3d3d] flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Server Scripts</span>
            <button onClick={createNewScript} className="text-gray-400 hover:text-white"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {scripts.map(script => (
              <button
                key={script.id}
                onClick={() => setActiveScriptId(script.id)}
                className={`w-full flex items-center px-4 py-2 text-sm text-left transition-colors ${activeScriptId === script.id ? 'bg-[#37373d] text-white' : 'hover:bg-[#2d2d2d] text-gray-400'}`}
              >
                <Code className="w-4 h-4 mr-2 text-blue-400" />
                <span className="flex-1 truncate">{script.name}</span>
                {script.status === "draft" && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
                {script.status === "live" && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col bg-[#1e1e1e]">
          {/* Editor Tabs */}
          <div className="flex bg-[#2d2d2d] border-b border-[#3d3d3d] overflow-x-auto">
            <div className="px-4 py-2 bg-[#1e1e1e] text-white border-t-2 border-blue-500 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              {activeScript.name}
              {activeScript.status === "draft" && <span className="text-yellow-500 ml-2">*</span>}
            </div>
          </div>
          
          {/* Editor */}
          <div className="flex-1 relative font-mono text-sm">
            {/* Simple syntax highlighting mockup using textarea + styling */}
            <textarea
              value={activeScript.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-[#d4d4d4] p-4 resize-none outline-none focus:ring-0 leading-relaxed"
              spellCheck={false}
              style={{ tabSize: 4 }}
            />
          </div>

          {/* Console / Logs Panel */}
          <div className="h-48 border-t border-[#3d3d3d] bg-[#1e1e1e] flex flex-col">
            <div className="flex items-center px-4 py-1.5 bg-[#2d2d2d] border-b border-[#3d3d3d] text-xs font-medium text-gray-400 uppercase tracking-wider">
              <Terminal className="w-4 h-4 mr-2" /> Server Logs
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-gray-300 space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={`${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[INFO]') ? 'text-blue-400' : ''}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Properties/Revisions */}
        <aside className="w-64 bg-[#252526] border-l border-[#3d3d3d] p-4 hidden lg:block">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Properties</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">File Name</div>
              <input 
                type="text" 
                value={activeScript.name} 
                onChange={(e) => setScripts(scripts.map(s => s.id === activeScriptId ? { ...s, name: e.target.value } : s))}
                className="w-full bg-[#3d3d3d] text-white border-none rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            
            <div>
              <div className="text-gray-500 mb-1">Status</div>
              <div className="flex items-center">
                {activeScript.status === "live" ? (
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded flex items-center text-xs">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span> Live
                  </span>
                ) : (
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded flex items-center text-xs">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span> Draft
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-gray-500 mb-1">Last Modified</div>
              <div className="text-gray-300 flex items-center">
                <Clock className="w-3 h-3 mr-2" /> {activeScript.lastModified}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#3d3d3d] pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Revisions</h3>
            <div className="space-y-2">
              <div className="p-2 bg-[#3d3d3d] rounded text-xs cursor-pointer hover:bg-[#4d4d4d] border-l-2 border-green-500">
                <div className="text-white">v3 (Current Live)</div>
                <div className="text-gray-500 mt-1">2 days ago by You</div>
              </div>
              <div className="p-2 bg-[#2d2d2d] rounded text-xs cursor-pointer hover:bg-[#3d3d3d] border-l-2 border-transparent">
                <div className="text-gray-300">v2</div>
                <div className="text-gray-500 mt-1">5 days ago by You</div>
              </div>
              <div className="p-2 bg-[#2d2d2d] rounded text-xs cursor-pointer hover:bg-[#3d3d3d] border-l-2 border-transparent">
                <div className="text-gray-300">v1 (Initial)</div>
                <div className="text-gray-500 mt-1">1 week ago by System</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CloudScriptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center text-white">Loading IDE...</div>}>
      <CloudScriptPageContent />
    </Suspense>
  );
}
