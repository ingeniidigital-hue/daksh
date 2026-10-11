"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Search, User, Coins, Package, Ban, ShieldAlert, Plus, Trash2 } from "lucide-react";

// Mock player data for the UI
const INITIAL_MOCK_PLAYERS = [
  { id: "ply_1A2B3C", username: "DragonSlayer99", email: "dragon@example.com", status: "Active", lastLogin: "2 hours ago", wallet: { "GO": 4500, "GM": 150 } as Record<string, number>, inventory: [] as any[] },
  { id: "ply_9X8Y7Z", username: "NoobMaster", email: "noob@example.com", status: "Banned", lastLogin: "3 days ago", wallet: {} as Record<string, number>, inventory: [] as any[] },
];

function PlayersPageContent() {
  const params = useParams();
  const titleId = params?.id as string;
  
  const [players, setPlayers] = useState(INITIAL_MOCK_PLAYERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // Catalog State
  const [items, setItems] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [lootboxes, setLootboxes] = useState<any[]>([]);

  // Modal State
  const [isGrantCurrencyModalOpen, setIsGrantCurrencyModalOpen] = useState(false);
  const [isGrantItemModalOpen, setIsGrantItemModalOpen] = useState(false);
  
  const [grantCurrencyCode, setGrantCurrencyCode] = useState("");
  const [grantCurrencyAmount, setGrantCurrencyAmount] = useState(100);
  const [grantItemId, setGrantItemId] = useState("");

  useEffect(() => {
    if (!titleId) return;
    const loadCat = (key: string, setter: any) => {
      const data = localStorage.getItem(`catalog_${key}_${titleId}`);
      if (data) setter(JSON.parse(data));
    };
    loadCat("items", setItems);
    loadCat("curr", setCurrencies);
    loadCat("bundles", setBundles);
    loadCat("lootboxes", setLootboxes);
  }, [titleId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = players.find(
      (p) => p.username.toLowerCase() === searchQuery.toLowerCase() || p.id === searchQuery
    );
    setSelectedPlayer(found || null);
    if (!found) alert("Player not found!");
  };

  const handleGrantCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !grantCurrencyCode || grantCurrencyAmount <= 0) return;
    
    const updatedPlayers = players.map(p => {
      if (p.id === selectedPlayer.id) {
        const current = p.wallet[grantCurrencyCode] || 0;
        return {
          ...p,
          wallet: { ...p.wallet, [grantCurrencyCode]: current + grantCurrencyAmount }
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);
    setSelectedPlayer(updatedPlayers.find(p => p.id === selectedPlayer.id));
    setIsGrantCurrencyModalOpen(false);
    setGrantCurrencyCode("");
    setGrantCurrencyAmount(100);
  };

  const handleGrantItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !grantItemId) return;

    // Find the item name for display
    const catItem = [...items, ...bundles, ...lootboxes].find(i => i.id === grantItemId);
    const itemName = catItem ? catItem.name : grantItemId;

    const updatedPlayers = players.map(p => {
      if (p.id === selectedPlayer.id) {
        return {
          ...p,
          inventory: [...p.inventory, { instanceId: `inv_${Date.now()}`, itemId: grantItemId, name: itemName, grantedAt: new Date().toISOString() }]
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);
    setSelectedPlayer(updatedPlayers.find(p => p.id === selectedPlayer.id));
    setIsGrantItemModalOpen(false);
    setGrantItemId("");
  };

  const handleRevokeItem = (instanceId: string) => {
    if (!confirm("Revoke this item from the player's inventory?")) return;
    const updatedPlayers = players.map(p => {
      if (p.id === selectedPlayer.id) {
        return {
          ...p,
          inventory: p.inventory.filter((i: any) => i.instanceId !== instanceId)
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);
    setSelectedPlayer(updatedPlayers.find(p => p.id === selectedPlayer.id));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans pb-20">
      <main className="max-w-5xl mx-auto px-6 pt-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Player Management (CRM)</h1>
          <p className="text-gray-500 text-sm">Search and manage player accounts, inventory, and virtual wallets.</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Username or Player ID (Try: DragonSlayer99)"
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
          </form>
        </div>

        {/* Player Profile */}
        {selectedPlayer && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Identity */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="w-20 h-20 bg-white border-4 border-white rounded-full mx-auto flex items-center justify-center mb-4 relative z-10 shadow-sm">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedPlayer.username}</h2>
                <p className="text-gray-500 text-xs font-mono mb-4">{selectedPlayer.id}</p>
                <div className={`inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${selectedPlayer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedPlayer.status}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPlayer.email}</p>
                  <p className="text-xs text-gray-500 mt-4 mb-1">Last Login</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPlayer.lastLogin}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold mb-4 text-xs uppercase tracking-wider text-gray-500">Support Actions</h3>
                <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-red-50 text-red-600 font-medium text-sm flex items-center transition-colors">
                  <Ban className="w-4 h-4 mr-3" /> Ban Player
                </button>
                <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-yellow-50 text-yellow-600 font-medium text-sm flex items-center transition-colors mt-2">
                  <ShieldAlert className="w-4 h-4 mr-3" /> Reset Account
                </button>
              </div>
            </div>

            {/* Right Column: Economy */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Virtual Wallet */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center text-gray-900">
                    <Coins className="w-5 h-5 mr-2 text-yellow-500" />
                    Virtual Wallet
                  </h3>
                  <button onClick={() => setIsGrantCurrencyModalOpen(true)} className="text-xs font-bold bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded hover:bg-yellow-100 transition-colors uppercase tracking-wider">
                    + Grant Currency
                  </button>
                </div>
                {Object.keys(selectedPlayer.wallet).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Wallet is empty.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(selectedPlayer.wallet).map(([code, balance]) => (
                      <div key={code} className="bg-[#F5F5F7] p-4 rounded-xl border border-gray-200">
                        <div className="text-xs font-bold text-gray-500 uppercase">{currencies.find(c => c.code === code)?.name || code}</div>
                        <div className="text-2xl font-bold mt-1 text-gray-900">{balance as number}</div>
                        <div className="text-[10px] text-gray-400 mt-1 font-mono">{code}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inventory */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center text-gray-900">
                    <Package className="w-5 h-5 mr-2 text-indigo-500" />
                    Inventory Items
                  </h3>
                  <button onClick={() => setIsGrantItemModalOpen(true)} className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors uppercase tracking-wider">
                    + Grant Item
                  </button>
                </div>
                
                {selectedPlayer.inventory.length === 0 ? (
                  <div className="bg-[#F5F5F7] p-8 rounded-xl border border-gray-200 text-center">
                    <p className="text-gray-500 text-sm">No items found in inventory.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPlayer.inventory.map((inv: any) => (
                      <div key={inv.instanceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm">{inv.name}</span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">Item ID: {inv.itemId}</span>
                            <span className="text-[10px] text-gray-400">Granted: {new Date(inv.grantedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRevokeItem(inv.instanceId)}
                          className="text-gray-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                          title="Revoke Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Grant Currency Modal */}
      {isGrantCurrencyModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Grant Currency</h2>
            <form onSubmit={handleGrantCurrency} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Currency</label>
                <select required value={grantCurrencyCode} onChange={e => setGrantCurrencyCode(e.target.value)} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm">
                  <option value="">Select Currency...</option>
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                </select>
                {currencies.length === 0 && <p className="text-xs text-red-500 mt-1">No currencies found in Catalog!</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount</label>
                <input type="number" required min="1" value={grantCurrencyAmount} onChange={e => setGrantCurrencyAmount(parseInt(e.target.value) || 0)} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm" />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsGrantCurrencyModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 text-sm">Cancel</button>
                <button type="submit" disabled={!grantCurrencyCode} className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm">Grant to Player</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Item Modal */}
      {isGrantItemModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Grant Inventory Item</h2>
            <form onSubmit={handleGrantItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Item</label>
                <select required value={grantItemId} onChange={e => setGrantItemId(e.target.value)} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-sm font-mono">
                  <option value="">Select Item...</option>
                  <optgroup label="Items">
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
                  </optgroup>
                  <optgroup label="Bundles">
                    {bundles.map(b => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
                  </optgroup>
                  <optgroup label="Lootboxes">
                    {lootboxes.map(l => <option key={l.id} value={l.id}>{l.name} ({l.id})</option>)}
                  </optgroup>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsGrantItemModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 text-sm">Cancel</button>
                <button type="submit" disabled={!grantItemId} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm">Grant Item</button>
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
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">Loading...</div>}>
      <PlayersPageContent />
    </Suspense>
  );
}
