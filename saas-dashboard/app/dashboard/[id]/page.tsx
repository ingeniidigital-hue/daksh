"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Copy, CheckCircle2, ChevronRight, Activity, Globe, 
  ShieldCheck, LogOut, Download, Terminal, Database, Server, 
  Layers, Check 
} from "lucide-react";

function TitleDetailsContent() {
  const params = useParams();
  const id = params?.id as string;

  const [copied, setCopied] = useState(false);
  const [titleName, setTitleName] = useState(id || "Game Title");
  const [apiKey, setApiKey] = useState(`sk_live_${id || "prod"}_8f7e6d5c4b3a2019`);
  const [tsVersion, setTsVersion] = useState("v1.0.0");
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  
  // Real metrics state
  const [playerCount, setPlayerCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [catalogItemCount, setCatalogItemCount] = useState(0);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Eject Button States
  const [isEjectModalOpen, setIsEjectModalOpen] = useState(false);
  const [isEjecting, setIsEjecting] = useState(false);
  const [ejectStep, setEjectStep] = useState<"configure" | "processing" | "ready">("configure");
  const [includeFullDb, setIncludeFullDb] = useState(true);
  const [includeK8s, setIncludeK8s] = useState(true);
  const [includeTsLogic, setIncludeTsLogic] = useState(true);
  const [cliCopied, setCliCopied] = useState(false);
  
  useEffect(() => {
    if (!id) return;

    const saved = localStorage.getItem("daksh_titles");
    if (saved) {
      try {
        const titles = JSON.parse(saved);
        const found = titles.find((t: any) => t.id === id);
        if (found) {
          setTitleName(found.name);
          setApiKey(found.secretKey || `sk_live_${id}_prod_90218374`);
          setTsVersion(found.tsVersion || "v1.0.0");
        } else {
          const formatted = id.replace(/TITLE_/g, "").replace(/_/g, " ");
          setTitleName(formatted ? formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase() : `Title ${id}`);
          setApiKey(`sk_live_${id}_prod_90218374`);
          setTsVersion("v1.0.0");
        }
      } catch (e) {
        setTitleName(`Title ${id}`);
        setApiKey(`sk_live_${id}_prod_90218374`);
      }
    } else {
      const formatted = id.replace(/TITLE_/g, "").replace(/_/g, " ");
      setTitleName(formatted ? formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase() : `Title ${id}`);
      setApiKey(`sk_live_${id}_prod_90218374`);
      setTsVersion("v1.0.0");
    }

    // Fetch real metrics from backend
    const loadRealData = async () => {
      try {
        setIsLoadingMetrics(true);
        // Load real players count
        const playersRes = await fetch(`/api/titles/${id}/players`);
        if (playersRes.ok) {
          const pData = await playersRes.json();
          setPlayerCount(pData.players ? pData.players.length : 0);
        }

        // Load real revenue & KPIs
        const kpiRes = await fetch(`/api/titles/${id}/analytics/kpis`, {
          headers: { "x-user-role": "admin" }
        });
        if (kpiRes.ok) {
          const kData = await kpiRes.json();
          if (kData.kpis) {
            setTotalRevenue(kData.kpis.totalRevenueUsd || 0);
          }
        }

        // Load catalog item count
        const savedCat = localStorage.getItem(`catalog_items_${id}`);
        if (savedCat) {
          try {
            setCatalogItemCount(JSON.parse(savedCat).length);
          } catch(e) {}
        }
      } catch (err) {
        console.error("Failed to load real metrics", err);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    loadRealData();

    window.addEventListener("daksh_data_updated", loadRealData);
    return () => window.removeEventListener("daksh_data_updated", loadRealData);
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);
    
    setTimeout(() => {
      const newVersion = `v1.1.0`;
      const saved = localStorage.getItem("daksh_titles");
      if (saved) {
        let titles = JSON.parse(saved);
        titles = titles.map((t: any) => t.id === id ? { ...t, tsVersion: newVersion } : t);
        localStorage.setItem("daksh_titles", JSON.stringify(titles));
      }
      
      setTsVersion(newVersion);
      setIsDeploying(false);
      setIsDeployModalOpen(false);
    }, 1500);
  };

  const handleStartEject = () => {
    setIsEjecting(true);
    setEjectStep("processing");
    setTimeout(() => {
      setIsEjecting(false);
      setEjectStep("ready");
    }, 1500);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(`daksh eject --title ${id} --out ./self-hosted-${id}`);
    setCliCopied(true);
    setTimeout(() => setCliCopied(false), 2000);
  };

  const handleDownloadBundle = () => {
    const readmeContent = `# Standalone Deployment Bundle for Title: ${titleName} (${id})
Generated by Daksh Eject Guarantee on ${new Date().toISOString()}

## Contents
1. /kubernetes/helm - Complete production Helm Chart for AWS EKS, GCP GKE, or Azure AKS
2. /kubernetes/docker-compose.prod.yml - 1-command Docker Compose deployment for single-node / VPS
3. /database/schema.sql - Clean PostgreSQL DDL and tables
4. /database/economy-v2.sql - Complete Catalog, Stores, and Currencies DML
5. /runtime - Open TypeScript game rules running on Nakama 3.22.0
6. /client/DakshConfig.json - Drop-in endpoint configuration redirect for Unity/Unreal

## 1-Command Deployment (Helm)
$ cd ./kubernetes
$ helm install ${id} ./helm --namespace games-prod --create-namespace

## Client SDK Redirection
In Unity / Unreal Engine, change your client initialization:
- DakshClient.Initialize("${id}", "https://your-self-hosted-domain.com");

Zero vendor lock-in!
`;
    const blob = new Blob([readmeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daksh-standalone-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      
      {/* AdminLTE Content Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">{titleName}</h1>
            <span className="font-mono text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-semibold">
              ID: {id}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Production Cluster • Nakama v3.22 • PostgreSQL 16 • Redis 7
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <Link href="/dashboard" className="text-blue-600 hover:underline">Titles</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-semibold">{id}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">Overview</span>
        </div>
      </div>

      {/* AdminLTE Info-Boxes / Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Info Box 1: Registered Players */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Registered Players</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{playerCount}</div>
            <div className="text-[11px] text-gray-500 mt-1">
              <Link href={`/dashboard/${id}/players`} className="text-blue-600 hover:underline">View directory →</Link>
            </div>
          </div>
          <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>

        {/* Info Box 2: Live CCU */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Live CCU</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">0</div>
            <div className="text-[11px] text-emerald-600 mt-1">Real-time connected</div>
          </div>
          <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Info Box 3: Total Gross Revenue */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Gross Revenue</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">${totalRevenue.toFixed(2)}</div>
            <div className="text-[11px] text-gray-500 mt-1">In-app purchases</div>
          </div>
          <div className="w-10 h-10 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        {/* Info Box 4: Cluster Status */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Cluster Status</div>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">Operational</div>
            <div className="text-[11px] text-gray-500 mt-1 font-mono">100% SLA</div>
          </div>
          <div className="w-10 h-10 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: AdminLTE Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: SDK Integration Credentials */}
          <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-500" />
                Client SDK & Integration Credentials
              </h2>
              <span className="text-xs text-gray-500 font-mono">Production Keys</span>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-gray-600">
                Configure your Unity or Unreal Engine client using these production endpoints. Keep your secret key protected.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Server Host URL</label>
                <div className="bg-gray-50 border border-gray-200 rounded px-3 py-1.5 font-mono text-xs text-gray-800">
                  http://localhost:7350
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title Secret API Key</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="password" 
                    readOnly 
                    value={apiKey} 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-1.5 font-mono text-xs text-gray-800 outline-none"
                  />
                  <button 
                    onClick={handleCopy}
                    className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-medium flex items-center transition-colors shadow-xs"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                    {copied ? "Copied" : "Copy Key"}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Unity C# Initialization Snippet</label>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-[11px] overflow-x-auto">
{`await DakshSDK.InitializeAsync(new DakshConfig {
    TitleId = "${id}",
    ServerUrl = "http://localhost:7350",
    AutoGuestAuth = true
});`}
                </pre>
              </div>
            </div>
          </div>

          {/* Card: Metagame Subsystems Summary */}
          <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-500" />
                Active Metagame Subsystems
              </h2>
              <span className="text-xs text-emerald-600 font-medium">All Online</span>
            </div>
            <div className="p-4 divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">Player Directory & Accounts</div>
                  <div className="text-gray-500 text-[11px]">Hardware device authentication & profile saves</div>
                </div>
                <Link href={`/dashboard/${id}/players`} className="text-blue-600 hover:underline font-medium">
                  {playerCount} Players →
                </Link>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">Virtual Economy & Catalog</div>
                  <div className="text-gray-500 text-[11px]">In-game stores, loot tables, soft & hard currencies</div>
                </div>
                <Link href={`/dashboard/${id}/catalog`} className="text-blue-600 hover:underline font-medium">
                  {catalogItemCount} Items Configured →
                </Link>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">Matchmaking Rulesets & Telemetry</div>
                  <div className="text-gray-500 text-[11px]">Dynamic latency rule-flexing & real-time X-Ray</div>
                </div>
                <Link href={`/dashboard/${id}/matchmaking`} className="text-blue-600 hover:underline font-medium">
                  Open X-Ray →
                </Link>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">OTA Cloud Asset Delivery</div>
                  <div className="text-gray-500 text-[11px]">Delta-compressed asset bundles & multi-channel rollout</div>
                </div>
                <Link href={`/dashboard/${id}/ota`} className="text-blue-600 hover:underline font-medium">
                  Manage Channels →
                </Link>
              </div>
            </div>
          </div>

          {/* Card: 1-Click Eject Guarantee */}
          <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-600" />
                Zero Lock-In Guarantee (1-Click Self-Host Eject)
              </h2>
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                Sovereign Portability
              </span>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600">
                You own 100% of your data and infrastructure. Export complete Helm v3 charts, raw PostgreSQL tables, and runtime modules at any time with zero client netcode changes.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setIsEjectModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded text-xs font-medium flex items-center transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Eject Title Infrastructure
                </button>
                <span className="text-xs text-gray-500 font-mono">
                  Output: /kubernetes/helm + /database/schema.sql
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Server Health & Cluster Info */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Cluster Telemetry</h2>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Core Engine</span>
                <span className="font-semibold text-gray-800">Nakama v3.22</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Database Engine</span>
                <span className="font-semibold text-gray-800">PostgreSQL 16 (Isolated)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Memory Cache</span>
                <span className="font-semibold text-gray-800">Redis 7.2 Cluster</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Game Server Fleet</span>
                <span className="font-semibold text-gray-800">Google Agones (Dedicated)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Current Logic Revision</span>
                <span className="font-mono text-gray-800 font-semibold">{tsVersion}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">Hosting Mode</span>
                <span className="font-semibold text-emerald-700">Dedicated Bare-Metal</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded shadow-xs p-4 space-y-3 text-xs">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Developer Shortcuts</h3>
            <div className="space-y-1.5">
              <Link 
                href={`/dashboard/${id}/analytics`}
                className="block p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-colors"
              >
                Executive Retention & DAU Cohorts →
              </Link>
              <Link 
                href={`/dashboard/${id}/auth`}
                className="block p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-colors"
              >
                Authentication & Key Management →
              </Link>
              <Link 
                href={`/dashboard/${id}/stress`}
                className="block p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-colors"
              >
                CCU Load Testing & Gate Verification →
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Deploy TS Modal */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <h2 className="text-2xl font-bold mb-2">Upload Game Logic</h2>
            <p className="text-gray-500 text-sm mb-6">
              Upload your custom game rules. This will securely update your game servers without kicking active players offline.
            </p>
            
            <form onSubmit={handleDeploy}>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Game Rules File (JavaScript)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <p className="text-sm font-medium text-gray-500">Click to browse or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">Compiled code only</p>
                  <input type="file" className="hidden" />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isDeploying}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isDeploying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Rolling out...
                    </>
                  ) : "Upload & Deploy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* The Famous Eject Modal */}
      {isEjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Eject Title & Self-Host</h2>
                  <p className="text-xs text-gray-500 font-medium">Zero Vendor Lock-In Guarantee</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-semibold">
                Open Source
              </span>
            </div>

            {ejectStep === "configure" && (
              <div>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  Export production Kubernetes Helm charts, raw PostgreSQL dumps, and open TypeScript runtime code for <strong>{titleName}</strong> ({id}). Run anywhere with 0 netcode changes.
                </p>

                <div className="space-y-3 mb-6">
                  <label className="flex items-start p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={includeK8s} 
                      onChange={(e) => setIncludeK8s(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded" 
                    />
                    <div className="ml-3">
                      <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <Server className="w-4 h-4 text-blue-600" /> Kubernetes Helm Charts & Docker Compose
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Production StatefulSets for Nakama, Postgres, and ClickHouse.</p>
                    </div>
                  </label>

                  <label className="flex items-start p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={includeFullDb} 
                      onChange={(e) => setIncludeFullDb(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded" 
                    />
                    <div className="ml-3">
                      <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-indigo-600" /> PostgreSQL DDL & Economy V2 Catalogs
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Clean SQL tables, virtual currencies, loot tables, and active store prices.</p>
                    </div>
                  </label>

                  <label className="flex items-start p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={includeTsLogic} 
                      onChange={(e) => setIncludeTsLogic(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 rounded" 
                    />
                    <div className="ml-3">
                      <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-purple-600" /> TypeScript Serverless Game Logic
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Standard TypeScript rules running on open-source Nakama runtime.</p>
                    </div>
                  </label>
                </div>

                {/* CLI Box */}
                <div className="bg-gray-900 rounded-xl p-3.5 text-gray-200 mb-6">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5 font-mono">
                    <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> Or via Daksh CLI:</span>
                    <button 
                      onClick={handleCopyCli}
                      className="hover:text-white transition-colors flex items-center gap-1"
                    >
                      {cliCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {cliCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <code className="text-xs font-mono text-green-400 break-all">
                    daksh eject --title {id} --out ./self-hosted-{id}
                  </code>
                </div>

                <div className="flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEjectModalOpen(false)}
                    className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleStartEject}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all flex items-center shadow-sm hover:shadow"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate Eject Bundle
                  </button>
                </div>
              </div>
            )}

            {ejectStep === "processing" && (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Generating Standalone Package...</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Dumping PostgreSQL database schemas, assembling Helm charts, and building TypeScript runtime modules.
                </p>
              </div>
            )}

            {ejectStep === "ready" && (
              <div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl mb-6 flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-green-900">Eject Bundle Ready!</h4>
                    <p className="text-xs text-green-700 mt-1 leading-relaxed">
                      Your self-hosting infrastructure package has been compiled. You can deploy it to any cloud or on-prem cluster with zero code modifications to your game client.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-2 mb-6 text-gray-600">
                  <div className="font-semibold text-gray-800">What's in your bundle:</div>
                  <div className="font-mono">📦 daksh-standalone-{id}.tar.gz</div>
                  <div>├── /kubernetes/helm (AWS EKS, GKE, AKS ready)</div>
                  <div>├── /kubernetes/docker-compose.prod.yml (1-node deploy)</div>
                  <div>├── /database/schema.sql & economy-v2.sql</div>
                  <div>└── /client/DakshConfig.json (Endpoint redirect)</div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEjectModalOpen(false);
                      setEjectStep("configure");
                    }}
                    className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                  >
                    Close
                  </button>
                  <button 
                    type="button"
                    onClick={handleDownloadBundle}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all flex items-center shadow-sm hover:shadow"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Standalone Bundle
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TitleDetails() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <TitleDetailsContent />
    </Suspense>
  );
}
