"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Database,
  Lock,
  Globe,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  Sparkles,
  Dices,
  AlertTriangle,
  CheckCircle2,
  Code,
  ShieldAlert,
  Sliders,
  Eye,
  Key
} from "lucide-react";

interface TitleDataItem {
  key: string;
  value: string;
  scope: "public" | "internal";
  revision: number;
  updatedAt: string;
  description?: string;
}

interface LootTableItem {
  itemId: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  weight: number;
  minQuantity: number;
  maxQuantity: number;
}

interface LootTable {
  tableId: string;
  name: string;
  description?: string;
  entries: LootTableItem[];
  updatedAt: string;
}

interface DropRollResult {
  tableId: string;
  grantedItem: { itemId: string; quantity: number };
  rarity: string;
  roll: number;
  totalWeight: number;
  pityTriggered: boolean;
}

export default function TitleDataPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "TITLE_GAME_01";

  // Active Tab: 'public' | 'internal' | 'loot-tables'
  const [activeTab, setActiveTab] = useState<"public" | "internal" | "loot-tables">("public");

  // Title Data State
  const [publicData, setPublicData] = useState<TitleDataItem[]>([]);
  const [internalData, setInternalData] = useState<TitleDataItem[]>([]);
  const [lootTables, setLootTables] = useState<LootTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Server Secret for Internal Scope
  const [serverSecret, setServerSecret] = useState("secret_master_key_xyz987");
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);

  // Edit / Create KV Modal
  const [isKvModalOpen, setIsKvModalOpen] = useState(false);
  const [kvForm, setKvForm] = useState({
    key: "",
    value: "{\n  \"example\": true\n}",
    scope: "public" as "public" | "internal",
    description: ""
  });
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);

  // Drop Simulator State
  const [simTableId, setSimTableId] = useState<string>("");
  const [pityCounter, setPityCounter] = useState(0);
  const [pityThreshold, setPityThreshold] = useState(50);
  const [pityRarity, setPityRarity] = useState<"LEGENDARY" | "EPIC">("LEGENDARY");
  const [simResults, setSimResults] = useState<DropRollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  // Fetch Public Title Data
  const fetchPublicData = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/title-data?scope=public&list=true`);
      const json = await res.json();
      if (res.ok && json.items) {
        setPublicData(json.items);
      }
    } catch (e: any) {
      console.error("Failed to load public title data:", e);
    }
  };

  // Fetch Internal Title Data
  const fetchInternalData = async (secret = serverSecret) => {
    try {
      const res = await fetch(`/api/titles/${titleId}/title-data?scope=internal&list=true`, {
        headers: { "x-secret-key": secret }
      });
      const json = await res.json();
      if (res.ok && json.items) {
        setInternalData(json.items);
        setIsSecretUnlocked(true);
        setError(null);
      } else {
        setIsSecretUnlocked(false);
        if (json.error) setError(json.error);
      }
    } catch (e: any) {
      console.error("Failed to load internal title data:", e);
      setIsSecretUnlocked(false);
    }
  };

  // Fetch Loot Tables
  const fetchLootTables = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/title-data/loot-tables`);
      const json = await res.json();
      if (res.ok && json.tables) {
        setLootTables(json.tables);
        if (json.tables.length > 0 && !simTableId) {
          setSimTableId(json.tables[0].tableId);
        }
      }
    } catch (e: any) {
      console.error("Failed to load loot tables:", e);
    }
  };

  // Initial Load & AI Orchestrator MCP Sync
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPublicData(), fetchLootTables()]);
      await fetchInternalData();
      setLoading(false);
    };
    init();

    window.addEventListener("daksh_data_updated", init);
    return () => window.removeEventListener("daksh_data_updated", init);
  }, [titleId]);

  // Validate JSON string
  const handleJsonChange = (val: string) => {
    setKvForm(prev => ({ ...prev, value: val }));
    try {
      JSON.parse(val);
      setJsonValidationError(null);
    } catch (err: any) {
      setJsonValidationError(err.message);
    }
  };

  // Save / Update Title Data Key
  const handleSaveKv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonValidationError) return;

    try {
      const res = await fetch(`/api/titles/${titleId}/title-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: kvForm.key,
          value: kvForm.value,
          scope: kvForm.scope,
          description: kvForm.description,
          validateJson: true
        })
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save title data");
        return;
      }

      setSuccessMsg(`Successfully saved key "${kvForm.key}" (Revision ${json.revision})`);
      setIsKvModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3500);

      if (kvForm.scope === "public") {
        fetchPublicData();
      } else {
        fetchInternalData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete Title Data Key
  const handleDeleteKv = async (key: string, scope: "public" | "internal") => {
    if (!confirm(`Are you sure you want to delete ${scope} key "${key}"?`)) return;

    try {
      const res = await fetch(`/api/titles/${titleId}/title-data?key=${encodeURIComponent(key)}&scope=${scope}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccessMsg(`Deleted key "${key}"`);
        setTimeout(() => setSuccessMsg(null), 3000);
        if (scope === "public") fetchPublicData();
        else fetchInternalData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Roll from Loot Table (Drop Simulator)
  const handleRollDrop = async (count: number = 1) => {
    if (!simTableId) return;
    setIsRolling(true);
    const rolls: DropRollResult[] = [];

    try {
      let currentPity = pityCounter;
      for (let i = 0; i < count; i++) {
        const res = await fetch(`/api/titles/${titleId}/title-data/loot-drop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId: simTableId,
            pityCounter: currentPity,
            pityThreshold,
            pityGuaranteedRarity: pityRarity
          })
        });

        const data = await res.json();
        if (res.ok && data.drop) {
          rolls.unshift(data.drop);
          if (data.drop.pityTriggered || data.drop.rarity === pityRarity) {
            currentPity = 0;
          } else {
            currentPity++;
          }
        }
      }
      setPityCounter(currentPity);
      setSimResults(prev => [...rolls, ...prev].slice(0, 30));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-7 h-7 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Title Data & Loot Drop Tables</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              STORY-04
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Centralized remote configuration KV store, secret internal title variables, and cryptographic weighted drop tables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setKvForm({
                key: "",
                value: "{\n  \n}",
                scope: activeTab === "internal" ? "internal" : "public",
                description: ""
              });
              setJsonValidationError(null);
              setIsKvModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Config Key</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scope Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab("public")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "public"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Public Title Data ({publicData.length})</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Client Safe</span>
        </button>

        <button
          onClick={() => setActiveTab("internal")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "internal"
              ? "border-amber-500 text-amber-400 bg-amber-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Internal Title Data ({internalData.length})</span>
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
            Server Secret
          </span>
        </button>

        <button
          onClick={() => setActiveTab("loot-tables")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "loot-tables"
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Dices className="w-4 h-4" />
          <span>Loot Drop Tables ({lootTables.length})</span>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
            RNG Engine
          </span>
        </button>
      </div>

      {/* TAB 1: Public Title Data */}
      {activeTab === "public" && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-white">Public Key-Value Remote Config</p>
                <p className="text-xs text-slate-400">
                  Transmitted to client game binaries in sub-20ms. Read-only for players; writable only via Studio.
                </p>
              </div>
            </div>
            <button
              onClick={fetchPublicData}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicData.map((item) => (
              <div
                key={item.key}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-300">{item.key}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono">
                      Rev {item.revision}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setKvForm({
                          key: item.key,
                          value: item.value,
                          scope: "public",
                          description: item.description || ""
                        });
                        setJsonValidationError(null);
                        setIsKvModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteKv(item.key, "public")}
                      className="p-1.5 hover:bg-rose-950/50 rounded text-slate-400 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {item.description && (
                    <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                  )}
                  <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-48 scrollbar-thin">
                    {item.value}
                  </pre>
                  <p className="text-[10px] text-slate-500 mt-2 text-right">
                    Updated: {new Date(item.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Internal Title Data (Secret Server-Only) */}
      {activeTab === "internal" && (
        <div className="space-y-4">
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-300">Server-Side Secret Isolation</p>
                <p className="text-xs text-amber-200/70">
                  Internal Title Data is NEVER sent to client devices. Protected by master secret token.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={serverSecret}
                  onChange={(e) => setServerSecret(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  placeholder="Master Secret Key"
                />
              </div>
              <button
                onClick={() => fetchInternalData(serverSecret)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Unlock
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {internalData.map((item) => (
              <div
                key={item.key}
                className="bg-slate-900 border border-amber-900/40 rounded-xl overflow-hidden shadow-sm hover:border-amber-700/50 transition"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-amber-950/10">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono text-sm font-bold text-amber-300">{item.key}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono">
                      Rev {item.revision}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setKvForm({
                          key: item.key,
                          value: item.value,
                          scope: "internal",
                          description: item.description || ""
                        });
                        setJsonValidationError(null);
                        setIsKvModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteKv(item.key, "internal")}
                      className="p-1.5 hover:bg-rose-950/50 rounded text-slate-400 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {item.description && (
                    <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                  )}
                  <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-amber-400 overflow-x-auto max-h-48 scrollbar-thin">
                    {item.value}
                  </pre>
                  <p className="text-[10px] text-slate-500 mt-2 text-right">
                    Server-only • Updated: {new Date(item.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Loot Drop Tables Engine */}
      {activeTab === "loot-tables" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Configured Loot Tables */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Active Drop Tables</p>
                <p className="text-xs text-slate-400">
                  Weighted probability tables powered by cryptographically secure PRNG.
                </p>
              </div>
              <button
                onClick={fetchLootTables}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {lootTables.map((tbl) => {
              const totalWeight = tbl.entries.reduce((sum, e) => sum + e.weight, 0);
              return (
                <div key={tbl.tableId} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{tbl.name}</h3>
                      <p className="text-xs font-mono text-slate-400">ID: {tbl.tableId}</p>
                    </div>
                    <button
                      onClick={() => setSimTableId(tbl.tableId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        simTableId === tbl.tableId
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {simTableId === tbl.tableId ? "Selected for Sim" : "Select Table"}
                    </button>
                  </div>

                  {tbl.description && <p className="text-xs text-slate-400">{tbl.description}</p>}

                  {/* Drop Table Entries */}
                  <div className="space-y-2">
                    {tbl.entries.map((entry) => {
                      const percentage = totalWeight > 0 ? ((entry.weight / totalWeight) * 100).toFixed(1) : "0";
                      const rarityColor =
                        entry.rarity === "LEGENDARY"
                          ? "text-amber-400 bg-amber-400/10 border-amber-400/30"
                          : entry.rarity === "EPIC"
                          ? "text-purple-400 bg-purple-400/10 border-purple-400/30"
                          : entry.rarity === "RARE"
                          ? "text-blue-400 bg-blue-400/10 border-blue-400/30"
                          : "text-slate-300 bg-slate-800 border-slate-700";

                      return (
                        <div
                          key={entry.itemId}
                          className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${rarityColor}`}>
                              {entry.rarity}
                            </span>
                            <span className="font-mono text-slate-200">{entry.itemId}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-slate-400">
                              Qty: {entry.minQuantity === entry.maxQuantity ? entry.minQuantity : `${entry.minQuantity}-${entry.maxQuantity}`}
                            </span>
                            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-indigo-400 w-12 text-right">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Live Drop Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 sticky top-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Dices className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Live Drop Simulator</h3>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Target Table</label>
                  <select
                    value={simTableId}
                    onChange={(e) => setSimTableId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {lootTables.map(t => (
                      <option key={t.tableId} value={t.tableId}>
                        {t.name} ({t.tableId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Pity Counter</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {pityCounter} / {pityThreshold} rolls
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (pityCounter / pityThreshold) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button
                    disabled={isRolling}
                    onClick={() => handleRollDrop(1)}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Roll 1x</span>
                  </button>

                  <button
                    disabled={isRolling}
                    onClick={() => handleRollDrop(10)}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Roll 10x</span>
                  </button>

                  <button
                    disabled={isRolling}
                    onClick={() => handleRollDrop(50)}
                    className="py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Roll 50x</span>
                  </button>
                </div>
              </div>

              {/* Feed of Real Roll Results */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 mb-2">Simulated Drops ({simResults.length})</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                  {simResults.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-600">
                      No rolls executed yet. Click above to test drop RNG!
                    </div>
                  ) : (
                    simResults.map((r, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-2 rounded text-xs font-mono border ${
                          r.pityTriggered
                            ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                            : r.rarity === "LEGENDARY"
                            ? "bg-amber-950/20 border-amber-500/30 text-amber-400"
                            : r.rarity === "RARE"
                            ? "bg-blue-950/20 border-blue-500/30 text-blue-300"
                            : "bg-slate-950 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold">[{r.rarity}]</span>
                          <span>{r.grantedItem.itemId}</span>
                          {r.grantedItem.quantity > 1 && (
                            <span className="text-slate-500">x{r.grantedItem.quantity}</span>
                          )}
                        </div>
                        {r.pityTriggered && (
                          <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-bold">
                            PITY HIT
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit KV Store Config */}
      {isKvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-400" />
                <span>Configure Title Data Key</span>
              </h2>
              <button
                onClick={() => setIsKvModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveKv} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Scope</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKvForm(prev => ({ ...prev, scope: "public" }))}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      kvForm.scope === "public"
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    Public (Client Visible)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKvForm(prev => ({ ...prev, scope: "internal" }))}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      kvForm.scope === "internal"
                        ? "bg-amber-600 border-amber-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    Internal (Server Secret)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. XP_Multipliers, Loot_Config"
                  value={kvForm.key}
                  onChange={(e) => setKvForm(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Explain what this configuration key tunes"
                  value={kvForm.description}
                  onChange={(e) => setKvForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-400">JSON Payload</label>
                  {jsonValidationError ? (
                    <span className="text-[10px] text-rose-400 font-mono">Invalid JSON</span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-mono">Valid JSON</span>
                  )}
                </div>
                <textarea
                  rows={8}
                  required
                  value={kvForm.value}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-lg p-2.5 text-xs font-mono text-emerald-300 focus:outline-none scrollbar-thin ${
                    jsonValidationError ? "border-rose-500" : "border-slate-800 focus:border-indigo-500"
                  }`}
                />
                {jsonValidationError && (
                  <p className="text-[10px] text-rose-400 mt-1">{jsonValidationError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsKvModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!jsonValidationError}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
