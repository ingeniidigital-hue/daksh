"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ChevronRight, Cloud, Server, Activity, CheckCircle2, AlertCircle, Database, Zap } from "lucide-react";

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

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("daksh_titles");
    if (saved && JSON.parse(saved).length > 0) {
      setTitles(JSON.parse(saved));
    } else {
      const defaultTitles = [
        { id: "TITLE_CYBERPUNK", name: "Cyberpunk: Neon Legends", status: "Active (Production)", players: "5,240 CCU", secretKey: "sk_live_CYBER_8f7e6d5c4b3a2019", tsVersion: "v1.4.2" },
        { id: "TITLE_MYTHIC", name: "Mythic Arena: Battle Royale", status: "Active (Production)", players: "1,890 CCU", secretKey: "sk_live_MYTH_1a2b3c4d5e6f7a8b", tsVersion: "v1.2.0" }
      ];
      localStorage.setItem("daksh_titles", JSON.stringify(defaultTitles));
      setTitles(defaultTitles);
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
    <div className="min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans pb-20">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="font-semibold text-lg tracking-tight">Daksh <span className="text-blue-600">Meta Engine</span></span>
            <div className="h-4 w-px bg-gray-300"></div>
            <Link href="/dashboard" className="text-sm font-medium text-gray-900">Titles</Link>
            <Link href="/dashboard/marketplace" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Marketplace</Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 font-medium">{userName}</span>
            <div className="w-8 h-8 bg-gray-200 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold">
              {userName.substring(0, 1).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-[2.5rem] font-bold tracking-tight mb-1">Titles</h1>
            <p className="text-gray-500 text-lg">Deploy and manage your game's full-stack metagame infrastructure.</p>
          </div>
          <button 
            onClick={handleCreateTitle}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium text-sm flex items-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> New Title
          </button>
        </div>

        {/* Local Engine Real-Time Health Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Local Core Engine Status</h3>
                <p className="text-xs text-gray-500 font-medium">Real-time probe across ports 7350, 5432 & 6379</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${
              systemHealth?.status === "healthy" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              <span className={`w-2 h-2 rounded-full ${systemHealth?.status === "healthy" ? "bg-emerald-500" : "bg-amber-500 animate-ping"}`}></span>
              <span>{systemHealth?.status === "healthy" ? "All Services Online" : "Connecting / Initializing..."}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Nakama */}
            <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-gray-200/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-gray-700">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Nakama Core</div>
                  <div className="text-xs text-gray-500">Port :7350 (v3.22)</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold uppercase tracking-wider ${
                  systemHealth?.services?.nakama?.status === "online" ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {systemHealth?.services?.nakama?.status || "Checking"}
                </div>
                {systemHealth?.services?.nakama?.latencyMs !== undefined && (
                  <div className="text-[10px] text-gray-400 font-mono">{systemHealth.services.nakama.latencyMs}ms</div>
                )}
              </div>
            </div>

            {/* Postgres */}
            <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-gray-200/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-gray-700">
                  <Database className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">PostgreSQL</div>
                  <div className="text-xs text-gray-500">Port :5432 (v16)</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold uppercase tracking-wider ${
                  systemHealth?.services?.postgres?.status === "online" ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {systemHealth?.services?.postgres?.status || "Checking"}
                </div>
                {systemHealth?.services?.postgres?.latencyMs !== undefined && (
                  <div className="text-[10px] text-gray-400 font-mono">{systemHealth.services.postgres.latencyMs}ms</div>
                )}
              </div>
            </div>

            {/* Redis */}
            <div className="bg-[#F5F5F7] rounded-2xl p-4 border border-gray-200/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center text-gray-700">
                  <Server className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Redis Cache</div>
                  <div className="text-xs text-gray-500">Port :6379 (v7)</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold uppercase tracking-wider ${
                  systemHealth?.services?.redis?.status === "online" ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {systemHealth?.services?.redis?.status || "Checking"}
                </div>
                {systemHealth?.services?.redis?.latencyMs !== undefined && (
                  <div className="text-[10px] text-gray-400 font-mono">{systemHealth.services.redis.latencyMs}ms</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {titles.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 flex flex-col items-center text-center">
            <Server className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No titles yet</h2>
            <p className="text-gray-500 mb-6">Create your first game title to provision a Nakama cluster.</p>
            <button 
              onClick={handleCreateTitle}
              className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Create Title
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {titles.map((title) => (
              <Link href={`/dashboard/${title.id}`} key={title.id} className="block group">
                <div className="flex items-center justify-between p-6 hover:bg-[#F9F9FB] transition-colors border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-sm flex items-center justify-center text-white font-bold text-2xl">
                      {title.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{title.name}</h2>
                      <div className="flex items-center space-x-4 text-sm font-medium text-gray-500">
                        <span className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${title.status === "Healthy" ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}></span>
                          {title.status}
                        </span>
                        <span className="flex items-center">
                          <Cloud className="w-4 h-4 mr-1" />
                          Region: AP-South
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right hidden sm:block">
                      <div className="text-xl font-medium text-gray-900">{title.players}</div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Users</div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Title Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <h2 className="text-2xl font-bold mb-2">Create New Title</h2>
            <p className="text-gray-500 text-sm mb-6">
              This will instantly provision an isolated Nakama cluster and a dedicated PostgreSQL database.
            </p>
            
            <form onSubmit={submitTitle}>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Title Name</label>
                <input 
                  type="text"
                  autoFocus
                  value={newTitleName}
                  onChange={(e) => setNewTitleName(e.target.value)}
                  placeholder="e.g. Battle Royale 2026"
                  className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !newTitleName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors disabled:opacity-50"
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
