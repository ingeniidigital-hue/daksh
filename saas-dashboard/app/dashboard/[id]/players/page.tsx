"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ChevronRight, Search, User, Coins, Package, Ban, ShieldAlert, 
  Plus, Trash2, Smartphone, Key, RefreshCw, CheckCircle2, ShieldCheck 
} from "lucide-react";

interface Player {
  id: string;
  titleId: string;
  deviceId: string;
  username: string;
  status: "Active" | "Banned" | "Suspended";
  clientPlatform: string;
  createdAt: string;
  lastLoginAt: string;
  wallet: Record<string, number>;
  inventory: any[];
}

function PlayersPageContent() {
  const params = useParams();
  const titleId = params?.id as string;
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Device Auth Simulation Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [simDeviceId, setSimDeviceId] = useState("");
  const [simPlatform, setSimPlatform] = useState<"Android" | "iOS" | "Windows" | "Web">("Android");
  const [simDisplayName, setSimDisplayName] = useState("");
  const [lastAuthToken, setLastAuthToken] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Fetch real players from backend API
  const loadPlayers = async () => {
    if (!titleId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/titles/${titleId}/players`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
        if (data.players && data.players.length > 0 && !selectedPlayer) {
          setSelectedPlayer(data.players[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load players:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [titleId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      if (players.length > 0) setSelectedPlayer(players[0]);
      return;
    }
    const found = players.find(
      (p) => p.username.toLowerCase().includes(query) || p.id.toLowerCase() === query || p.deviceId.toLowerCase().includes(query)
    );
    if (found) {
      setSelectedPlayer(found);
    } else {
      alert(`No player found matching "${searchQuery}"`);
    }
  };

  const handleSimulateDeviceAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simDeviceId.trim()) return;

    setIsSubmittingAuth(true);
    try {
      const res = await fetch(`/api/titles/${titleId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: simDeviceId.trim(),
          clientPlatform: simPlatform,
          displayName: simDisplayName.trim() || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Device authentication failed");
      }

      const data = await res.json();
      setLastAuthToken(data.token);
      await loadPlayers();
      setSelectedPlayer(data.player);
      setSimDeviceId("");
      setSimDisplayName("");
    } catch (err: any) {
      alert(`Authentication Error: ${err.message}`);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleToggleBan = async () => {
    if (!selectedPlayer) return;
    const newStatus = selectedPlayer.status === "Banned" ? "Active" : "Banned";
    const confirmMsg = newStatus === "Banned" 
      ? `Are you sure you want to ban ${selectedPlayer.username}? Their session token will be revoked immediately.`
      : `Unban player ${selectedPlayer.username}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/titles/${titleId}/players/${selectedPlayer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedPlayer(data.player);
        setPlayers(prev => prev.map(p => p.id === data.player.id ? data.player : p));
      }
    } catch (err) {
      alert("Failed to update player status");
    }
  };

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return;
    const confirmMsg = `⚠️ GDPR / DPDP Right to be Forgotten\n\nPermanently delete all data for player ${selectedPlayer.username} (${selectedPlayer.id})?\nThis action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/titles/${titleId}/players/${selectedPlayer.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        alert("Player account permanently deleted.");
        setSelectedPlayer(null);
        await loadPlayers();
      }
    } catch (err) {
      alert("Failed to delete player profile");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans pb-20">
      <main className="max-w-5xl mx-auto px-6 pt-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>STORY-02: Player Identity Federation & Device Auth</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Player Management (CRM)</h1>
            <p className="text-gray-500 text-sm">Real-time player accounts authenticated via Ed25519 asymmetric device JWTs.</p>
          </div>
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium text-sm flex items-center transition-colors shadow-sm"
          >
            <Smartphone className="w-4 h-4 mr-2" /> Simulate Device Login
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Username, Device ID, or Player ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
            >
              Search
            </button>
            <button
              type="button"
              onClick={loadPlayers}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-xl transition-colors"
              title="Refresh player list"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Players Quick Switcher */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayer(p)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
                selectedPlayer?.id === p.id 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${p.status === "Active" ? "bg-emerald-400" : "bg-red-400"}`}></span>
              <span>{p.username}</span>
              <span className="opacity-60 text-[10px]">({p.clientPlatform})</span>
            </button>
          ))}
        </div>

        {/* Player Profile Details */}
        {selectedPlayer ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Identity */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="w-20 h-20 bg-white border-4 border-white rounded-full mx-auto flex items-center justify-center mb-4 relative z-10 shadow-sm">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedPlayer.username}</h2>
                <p className="text-gray-500 text-xs font-mono mb-3">{selectedPlayer.id}</p>
                <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedPlayer.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {selectedPlayer.status}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 text-left space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase">Device Identifier</p>
                    <p className="text-xs font-mono text-gray-900 bg-[#F5F5F7] p-2 rounded-lg break-all mt-1">{selectedPlayer.deviceId}</p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Platform:</span>
                    <span className="font-semibold text-gray-900">{selectedPlayer.clientPlatform}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Registered:</span>
                    <span className="font-semibold text-gray-900">{new Date(selectedPlayer.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Last Seen:</span>
                    <span className="font-semibold text-gray-900">{new Date(selectedPlayer.lastLoginAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions & DPDP */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-gray-500">Moderation & Compliance</h3>
                <button 
                  onClick={handleToggleBan}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm flex items-center transition-colors ${
                    selectedPlayer.status === "Banned" 
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                      : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                >
                  <Ban className="w-4 h-4 mr-3" />
                  {selectedPlayer.status === "Banned" ? "Unban Player" : "Ban Player"}
                </button>

                <button 
                  onClick={handleDeletePlayer}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium text-sm flex items-center transition-colors mt-2"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Right to be Forgotten (DPDP / GDPR)
                </button>
              </div>
            </div>

            {/* Right Column: Wallet & Auth Token */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Virtual Currency Wallets */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center text-gray-900">
                    <Coins className="w-5 h-5 mr-2 text-yellow-500" />
                    Virtual Currencies
                  </h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-mono">STORY-03 Ready</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(selectedPlayer.wallet || {}).map(([curr, balance]) => (
                    <div key={curr} className="bg-[#F5F5F7] p-4 rounded-xl border border-gray-200">
                      <div className="text-xs font-bold text-gray-500 uppercase">{curr}</div>
                      <div className="text-2xl font-bold mt-1 text-gray-900">{balance}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ed25519 JWT Cryptographic Token Viewer */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold flex items-center text-gray-900">
                    <Key className="w-4 h-4 mr-2 text-blue-600" />
                    Ed25519 Asymmetric Session Token
                  </h3>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full uppercase">
                    256-bit Asymmetric
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Tokens are signed using non-repudiable Ed25519 keys with 2-hour sliding expiry and verified on every RPC request.
                </p>
                <div className="bg-[#1e1e24] text-emerald-400 p-4 rounded-xl font-mono text-[11px] break-all leading-relaxed">
                  {lastAuthToken || `eyJhbGciOiJFZERTQSI... (Simulate authentication to inspect live signature)`}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No players found. Use "Simulate Device Login" to create one.</p>
          </div>
        )}
      </main>

      {/* Simulate Device Login Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Simulate Device Authentication</h2>
            <p className="text-gray-500 text-xs mb-6">
              Executes the real client SDK hook <code className="bg-gray-100 px-1 py-0.5 rounded">Daksh.Auth.AuthenticateDeviceAsync()</code>, generating a live player record and Ed25519 JWT.
            </p>

            <form onSubmit={handleSimulateDeviceAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Hardware Device ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. hw_device_pixel9_xyz123"
                  value={simDeviceId}
                  onChange={(e) => setSimDeviceId(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PhoenixKnight"
                  value={simDisplayName}
                  onChange={(e) => setSimDisplayName(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Platform</label>
                <select
                  value={simPlatform}
                  onChange={(e: any) => setSimPlatform(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Android">Android</option>
                  <option value="iOS">iOS</option>
                  <option value="Windows">Windows PC</option>
                  <option value="Web">HTML5 / WebGL</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAuth || !simDeviceId.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmittingAuth ? "Authenticating..." : "Authenticate Device"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading Player Management...</div>}>
      <PlayersPageContent />
    </Suspense>
  );
}
