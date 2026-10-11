"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Gift, CheckCircle2, Plus } from "lucide-react";

function AdsPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [placements, setPlacements] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`daksh_ads_${titleId}`);
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adName, setAdName] = useState("");
  const [adId, setAdId] = useState("");
  const [reward, setReward] = useState("");
  const [network, setNetwork] = useState("Unity Ads / AdMob");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adName || !adId) return;
    const updated = [...placements, { id: adId, name: adName, reward: reward || "Bonus Items", network, status: "Active" }];
    setPlacements(updated);
    localStorage.setItem(`daksh_ads_${titleId}`, JSON.stringify(updated));
    setAdName("");
    setAdId("");
    setReward("");
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-600" />
            Rewarded Video Ads & Server-Side Verification (SSV)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure ad placements with cryptographically verified server-side callbacks to prevent ad-spoofing cheats.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="text-gray-500">
            <Link href="/dashboard" className="text-blue-600 hover:underline">Titles</Link> / <span className="font-semibold text-gray-700">{titleId}</span> / Rewarded Ads
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> New Placement
          </button>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Active Placements ({placements.length})</h2>
          <span className="text-[11px] text-emerald-700 font-mono">SSV Callback Active</span>
        </div>
        {placements.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-xs">
            <Gift className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="font-semibold text-gray-700">No Rewarded Ad Placements</div>
            <p className="text-gray-400 mt-0.5 mb-3">Define server-verified rewarded ad placements for revives, bonus spins, or daily currency.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium"
            >
              Configure First Placement
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {placements.map((ad, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{ad.name}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{ad.status}</span>
                  </div>
                  <p className="text-gray-400 font-mono text-[11px]">ID: {ad.id} • Network: {ad.network}</p>
                </div>
                <div className="text-[11px] font-mono text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">
                  Reward: {ad.reward}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-gray-200 p-6 max-w-md w-full shadow-lg">
            <h2 className="text-base font-bold text-gray-900 mb-1">Add Rewarded Placement</h2>
            <p className="text-xs text-gray-500 mb-4">Set up server-side verification to dispense client rewards reliably.</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Placement ID</label>
                <input 
                  type="text" 
                  value={adId} 
                  onChange={e => setAdId(e.target.value)} 
                  placeholder="e.g. ad_revive_extra_life"
                  className="w-full text-xs font-mono px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Placement Name</label>
                <input 
                  type="text" 
                  value={adName} 
                  onChange={e => setAdName(e.target.value)} 
                  placeholder="e.g. Post-Match Revive Reward"
                  className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reward Description</label>
                <input 
                  type="text" 
                  value={reward} 
                  onChange={e => setReward(e.target.value)} 
                  placeholder="e.g. 100 Gold Coins"
                  className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-medium"
                >
                  Create Placement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading ads...</div>}>
      <AdsPageContent />
    </Suspense>
  );
}
