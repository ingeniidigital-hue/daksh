"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Edit, Save, Trophy, Clock, ArrowDownUp, RefreshCw, Users, Sparkles } from "lucide-react";

interface Leaderboard {
  id: string;
  name: string;
  sortOrder: "Descending" | "Ascending";
  operator: "Best" | "Sum" | "Latest";
  resetSchedule: "Never" | "Daily" | "Weekly" | "Monthly" | "Yearly";
  isActive: boolean;
}

export default function LeaderboardsPage() {
  const params = useParams();
  const titleId = params?.id as string;

  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal State
  const [newLb, setNewLb] = useState<Leaderboard>({
    id: "",
    name: "",
    sortOrder: "Descending",
    operator: "Best",
    resetSchedule: "Never",
    isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!titleId) return;

    const loadData = () => {
      const saved = localStorage.getItem(`leaderboards_${titleId}`);
      if (saved) {
        setLeaderboards(JSON.parse(saved));
      }
    };

    loadData();

    window.addEventListener("daksh_data_updated", loadData);
    return () => window.removeEventListener("daksh_data_updated", loadData);
  }, [titleId]);

  const handleSaveLeaderboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLb.id || !newLb.name) return;
    
    let updated;
    if (isEditing) {
      updated = leaderboards.map(l => l.id === newLb.id ? newLb : l);
    } else {
      // Check duplicate
      if (leaderboards.some(l => l.id === newLb.id)) {
        alert("A leaderboard with this ID already exists!");
        return;
      }
      updated = [...leaderboards, newLb];
    }
    
    setLeaderboards(updated);
    localStorage.setItem(`leaderboards_${titleId}`, JSON.stringify(updated));
    
    setNewLb({ id: "", name: "", sortOrder: "Descending", operator: "Best", resetSchedule: "Never", isActive: true });
    setIsModalOpen(false);
    setIsEditing(false);
  };

  const deleteLeaderboard = (id: string) => {
    if (!confirm("Are you sure you want to delete this leaderboard? All player ranks in it will be lost.")) return;
    const updated = leaderboards.filter(l => l.id !== id);
    setLeaderboards(updated);
    localStorage.setItem(`leaderboards_${titleId}`, JSON.stringify(updated));
  };

  const editLeaderboard = (lb: Leaderboard) => {
    setNewLb(lb);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setNewLb({ id: "", name: "", sortOrder: "Descending", operator: "Best", resetSchedule: "Never", isActive: true });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleDeployToNakama = async () => {
    setIsSaving(true);
    // Simulate API call to Nakama API
    setTimeout(() => {
      setIsSaving(false);
      alert("Successfully deployed Leaderboard configurations to Nakama!");
    }, 800);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Leaderboards & Statistics</h1>
          <p className="text-gray-500 text-sm">Define global and seasonal leaderboards to drive player competition.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={openNewModal}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> 
            New Leaderboard
          </button>
          <button 
            onClick={handleDeployToNakama}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" /> 
            {isSaving ? "Deploying..." : "Deploy to Nakama"}
          </button>
        </div>
      </div>

      {/* AI-First Mode Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 border border-yellow-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-gray-900">AI Menu Active: Instant Leaderboard & Season Generation</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">
                Zero-Click
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-700 font-mono text-[10px]">⌘K</kbd> to have AI automatically configure recurring reset schedules (Weekly/Monthly) and wire top-100 tier reward drops.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center shadow-sm transition-all shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-200" />
          Prompt AI Menu
        </button>
      </div>

      {leaderboards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Leaderboards configured</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Create a leaderboard to track high scores, fastest times, or seasonal MMR/ELO rankings. Leaderboards support automatic resets for recurring Seasons.</p>
          <button onClick={openNewModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Create First Leaderboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaderboards.map((lb) => (
            <div key={lb.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-yellow-200 transition-all group">
              <div className="bg-yellow-50/40 px-5 py-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <h3 className="font-bold text-gray-900">{lb.name}</h3>
                  </div>
                  <p className="text-xs font-mono text-gray-500 bg-white px-2 py-0.5 rounded inline-block border border-gray-100">ID: {lb.id}</p>
                </div>
                <div className="flex -mr-2">
                  <button onClick={() => editLeaderboard(lb)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteLeaderboard(lb.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center"><ArrowDownUp className="w-4 h-4 mr-2 text-gray-400" /> Sort Order</span>
                  <span className="font-medium text-gray-900">{lb.sortOrder}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center"><Save className="w-4 h-4 mr-2 text-gray-400" /> Operator</span>
                  <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{lb.operator}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center"><RefreshCw className="w-4 h-4 mr-2 text-gray-400" /> Reset Schedule</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase tracking-wide ${lb.resetSchedule === 'Never' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                    {lb.resetSchedule}
                  </span>
                </div>
              </div>
              
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center w-full">
                  <Users className="w-4 h-4 mr-2" /> View Player Rankings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
              <Trophy className="w-6 h-6 mr-3 text-yellow-600" />
              {isEditing ? "Edit Leaderboard" : "Create New Leaderboard"}
            </h2>
            
            <form onSubmit={handleSaveLeaderboard} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Leaderboard ID</label>
                <input 
                  type="text" 
                  required 
                  disabled={isEditing}
                  value={newLb.id} 
                  onChange={e => setNewLb({...newLb, id: e.target.value.replace(/\s+/g, '_').toLowerCase()})} 
                  placeholder="e.g. season_5_ranked_mmr" 
                  className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 font-mono text-sm disabled:opacity-60 disabled:cursor-not-allowed" 
                />
                {!isEditing && <p className="text-xs text-gray-400 mt-1">Unique identifier used by the client. Cannot be changed later.</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Display Name</label>
                <input 
                  type="text" 
                  required 
                  value={newLb.name} 
                  onChange={e => setNewLb({...newLb, name: e.target.value})} 
                  placeholder="e.g. Season 5 Ranked Ladder" 
                  className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sort Order</label>
                  <select 
                    value={newLb.sortOrder} 
                    onChange={e => setNewLb({...newLb, sortOrder: e.target.value as any})} 
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-yellow-500 text-sm shadow-sm"
                  >
                    <option value="Descending">Descending (Highest Wins)</option>
                    <option value="Ascending">Ascending (Lowest Wins)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Operator</label>
                  <select 
                    value={newLb.operator} 
                    onChange={e => setNewLb({...newLb, operator: e.target.value as any})} 
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-yellow-500 text-sm shadow-sm"
                  >
                    <option value="Best">Best Score (Max/Min)</option>
                    <option value="Sum">Sum (Cumulative)</option>
                    <option value="Latest">Latest (Overwrite)</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center">
                  <RefreshCw className="w-4 h-4 mr-1.5" /> Seasons & Resets
                </label>
                <p className="text-xs text-gray-500 mb-3">When should this leaderboard reset? A reset automatically archives the current scores as a historical version and starts a new season at zero.</p>
                <select 
                  value={newLb.resetSchedule} 
                  onChange={e => setNewLb({...newLb, resetSchedule: e.target.value as any})} 
                  className="w-full bg-white border border-blue-200 rounded-xl px-3 py-3 outline-none focus:border-blue-500 text-sm shadow-sm text-blue-900 font-medium"
                >
                  <option value="Never">Never (All-Time Leaderboard)</option>
                  <option value="Daily">Daily Reset</option>
                  <option value="Weekly">Weekly Reset</option>
                  <option value="Monthly">Monthly Reset (Season)</option>
                  <option value="Yearly">Yearly Reset</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 text-sm transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
                  {isEditing ? "Update Leaderboard" : "Create Leaderboard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
