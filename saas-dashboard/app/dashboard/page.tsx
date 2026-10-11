"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ChevronRight, Cloud, Server, Activity, CheckCircle2, AlertCircle, Database, Zap, Sliders } from "lucide-react";
import ModeSwitcher from "../../components/ModeSwitcher";
import AIOrchestratorConsole from "../../components/AIOrchestratorConsole";
import { useOperatingMode } from "../../context/OperatingModeContext";

interface Title {
  id: string;
  name: string;
  status: string;
  players: string;
}

export default function Dashboard() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userName, setUserName] = useState("Studio Admin");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitleName, setNewTitleName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [showManualInspector, setShowManualInspector] = useState(false);
  const { mode } = useOperatingMode();

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("daksh_titles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Purge dummy mock titles if any exist
        const cleaned = parsed.filter((t: any) => t.id !== "TITLE_CYBERPUNK" && t.id !== "TITLE_MYTHIC");
        if (cleaned.length > 0) {
          setTitles(cleaned);
          localStorage.setItem("daksh_titles", JSON.stringify(cleaned));
        } else {
          const defaultTitle = [
            { id: "YCSLW", name: "Main Game Title", status: "Healthy", players: "0 CCU", secretKey: "sk_live_YCSLW_prod_90218374", tsVersion: "v1.0.0" }
          ];
          localStorage.setItem("daksh_titles", JSON.stringify(defaultTitle));
          setTitles(defaultTitle);
        }
      } catch (e) {
        setTitles([]);
      }
    } else {
      const defaultTitle = [
        { id: "YCSLW", name: "Main Game Title", status: "Healthy", players: "0 CCU", secretKey: "sk_live_YCSLW_prod_90218374", tsVersion: "v1.0.0" }
      ];
      localStorage.setItem("daksh_titles", JSON.stringify(defaultTitle));
      setTitles(defaultTitle);
    }

    const user = localStorage.getItem("daksh_user");
    if (user) {
      setUserName(JSON.parse(user).name);
    }

    const checkHealth = () => {
      fetch("/api/system/health")
        .then(res => res.json())
        .then(data => setSystemHealth(data))
        .catch(() => {});
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTitle = () => {
    setIsModalOpen(true);
  };

  const submitTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleName.trim()) return;
    
    setIsSubmitting(true);
    
    // Generate a short 5-character alphanumeric Title ID (PlayFab style)
    const shortTitleId = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    // Generate a unique 32-character secure Secret Key
    const randomHex = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const uniqueSecret = `sk_live_${shortTitleId}_${randomHex}`;
    
    const newTitle = {
      id: shortTitleId,
      name: newTitleName.trim(),
      status: "Deploying...",
      players: "0",
      secretKey: uniqueSecret,
    };
    const updatedTitles = [...titles, newTitle];
    setTitles(updatedTitles);
    localStorage.setItem("daksh_titles", JSON.stringify(updatedTitles));
    
    // Close modal immediately and clear input
    setIsModalOpen(false);
    setNewTitleName("");
    setIsSubmitting(false);
    
    // Call orchestration API to provision Kubernetes pods
    fetch("/api/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId: shortTitleId, secretKey: uniqueSecret })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setTitles(current => {
          const finished = current.map(t => t.id === newTitle.id ? { ...t, status: "Healthy" } : t);
          localStorage.setItem("daksh_titles", JSON.stringify(finished));
          return finished;
        });
      } else {
        setTitles(current => {
          const errored = current.map(t => t.id === newTitle.id ? { ...t, status: "Failed" } : t);
          localStorage.setItem("daksh_titles", JSON.stringify(errored));
          return errored;
        });
        console.error("Provisioning failed:", data.error);
      }
    })
    .catch(err => {
      console.error("API error:", err);
    });
  };

  if (!isClient) return null;

  return (
    <div className={`min-h-screen font-sans ${mode === "ai" ? "h-screen bg-white overflow-hidden flex flex-col" : "bg-[#f4f6f9] text-gray-800 pb-16"}`}>
      {/* AdminLTE Top Navbar (Only in Manual Mode or when Inspector is toggled) */}
      {(mode === "manual" || showManualInspector) && (
        <nav className="bg-[#1f2937] text-white border-b border-gray-700 sticky top-0 z-40 h-12 flex items-center px-4 justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-bold text-sm tracking-wider text-white shadow-xs">
              D
            </div>
            <span className="font-bold text-sm tracking-tight text-white uppercase">Daksh Console</span>
            <div className="h-4 w-px bg-gray-600"></div>
            <Link href="/dashboard" className="text-xs font-semibold text-white">
              Titles Directory
            </Link>
            <Link href="/dashboard/marketplace" className="text-xs text-gray-300 hover:text-white transition-colors">
              Marketplace
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {/* Mode Switcher: Manual vs AI Mode */}
            <ModeSwitcher />

            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono">Core: {systemHealth?.status === "healthy" ? "Online" : "Connecting"}</span>
            </div>
            <div className="h-4 w-px bg-gray-700"></div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-200 border border-slate-600">
                AD
              </div>
              <span className="text-xs font-medium text-gray-300">{userName}</span>
            </div>
          </div>
        </nav>
      )}

      {/* AI Orchestrator Console (Visible only in AI Mode) */}
      {mode === "ai" && (
        <AIOrchestratorConsole
          isProjectSelector={true}
          titleId={titles[0]?.id || "YCSLW"}
          titleName={titles[0]?.name || "Main Game Title"}
          onOpenCreateTitle={handleCreateTitle}
          showInspectorToggle={true}
          onToggleInspector={() => setShowManualInspector(prev => !prev)}
          isInspectorOpen={showManualInspector}
        />
      )}

      {/* Manual Inspector / Manual Mode View */}
      {(mode === "manual" || showManualInspector) && (
        <div className={mode === "ai" ? "border-t-4 border-indigo-900/80 bg-[#f4f6f9] p-6 animate-in fade-in duration-200" : ""}>
          {mode === "ai" && (
            <div className="max-w-6xl mx-auto flex items-center justify-between pb-3 mb-4 border-b border-gray-300">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="font-bold text-xs uppercase tracking-wider text-gray-700">Raw Multi-Tenant Titles Directory</span>
              </div>
              <button onClick={() => setShowManualInspector(false)} className="text-xs text-gray-500 hover:text-gray-900 font-medium">✕ Hide Inspector</button>
            </div>
          )}

          {/* AdminLTE Content Header with Breadcrumb */}
          <div className="max-w-6xl mx-auto px-6 pt-6 pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800 tracking-tight">Game Titles Management</h1>
              <p className="text-xs text-gray-500 mt-0.5">Deploy, monitor, and manage your game's backend microservices.</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs text-gray-500">
                <span className="hover:text-gray-700 cursor-pointer">Home</span> / <span className="font-semibold text-gray-700">Titles</span>
              </div>
              <button 
                onClick={handleCreateTitle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> New Title
              </button>
            </div>
          </div>

          <main className="max-w-6xl mx-auto px-6 pt-6 space-y-6">
        {/* AdminLTE 4 Info-Boxes / Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">Registered Titles</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">{titles.length}</div>
              <div className="text-[11px] text-gray-500 mt-1">Multi-tenant clusters</div>
            </div>
            <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">Live CCU</div>
              <div className="text-2xl font-bold text-gray-900 mt-0.5">0</div>
              <div className="text-[11px] text-emerald-600 mt-1">Real-time sessions</div>
            </div>
            <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">Nakama Port :7350</div>
              <div className="text-2xl font-bold text-emerald-600 mt-0.5">Online</div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">Latency: {systemHealth?.services?.nakama?.latencyMs ?? 1}ms</div>
            </div>
            <div className="w-10 h-10 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">PostgreSQL Port :5432</div>
              <div className="text-2xl font-bold text-emerald-600 mt-0.5">Online</div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">v16 / Isolated DDL</div>
            </div>
            <div className="w-10 h-10 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* AdminLTE Card for Registered Titles */}
        <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-gray-500" />
              Active Game Titles ({titles.length})
            </h2>
            <span className="text-xs text-gray-500">Self-Hosted Kubernetes & Bare-Metal</span>
          </div>

          {titles.length === 0 ? (
            <div className="p-12 text-center">
              <Server className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700">No Titles Configured</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">Click "New Title" above to provision your first backend cluster.</p>
              <button 
                onClick={handleCreateTitle}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-medium"
              >
                Create Title
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase text-[11px]">
                    <th className="py-2.5 px-4">Title ID</th>
                    <th className="py-2.5 px-4">Title Name</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Active CCU</th>
                    <th className="py-2.5 px-4">Cluster Region</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {titles.map((title) => (
                    <tr key={title.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {title.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {title.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                          {title.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">
                        0
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        Localhost / Dedicated
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link 
                          href={`/dashboard/${title.id}`}
                          className="inline-flex items-center bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 px-3 py-1 rounded text-xs font-medium transition-colors border border-gray-200 hover:border-blue-600"
                        >
                          Open Console <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )}

      {/* AdminLTE Create Title Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-gray-200 p-6 max-w-md w-full shadow-lg">
            <h2 className="text-base font-bold text-gray-900 mb-1">Create New Game Title</h2>
            <p className="text-xs text-gray-500 mb-4">
              Provisions a dedicated title namespace, database schema, and live SDK integration keys.
            </p>
            
            <form onSubmit={submitTitle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title Display Name</label>
                <input 
                  type="text"
                  autoFocus
                  value={newTitleName}
                  onChange={(e) => setNewTitleName(e.target.value)}
                  placeholder="e.g. Tactical Arena"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-800 outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !newTitleName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Provisioning..." : "Create Title"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
