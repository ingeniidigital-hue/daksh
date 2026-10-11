"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ShieldAlert, UserX, Plus, CheckCircle2, AlertOctagon } from "lucide-react";

function BansPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [bans, setBans] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`daksh_bans_${titleId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");

  const handleAddBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp) return;
    const updated = [{ ip: newIp, reason: newReason || "Manual studio administrative quarantine", bannedAt: "Just now", expiresAt: "Permanent", status: "Active" }, ...bans];
    setBans(updated);
    localStorage.setItem(`daksh_bans_${titleId}`, JSON.stringify(updated));
    setNewIp("");
    setNewReason("");
  };

  const handleRemoveBan = (ip: string) => {
    const updated = bans.filter(b => b.ip !== ip);
    setBans(updated);
    localStorage.setItem(`daksh_bans_${titleId}`, JSON.stringify(updated));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-600" />
            IP Bans & Security Quarantine
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Enforce IP network bans, automated anti-cheat suspensions, and hardware blacklist rules.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <Link href="/dashboard" className="text-blue-600 hover:underline">Titles</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-semibold">{titleId}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">Bans</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Quarantine New IP Address
            </h2>
          </div>
          <form onSubmit={handleAddBan} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target IPv4 / IPv6 Address</label>
              <input 
                type="text" 
                value={newIp} 
                onChange={(e) => setNewIp(e.target.value)} 
                placeholder="e.g. 192.0.2.1" 
                className="w-full text-xs font-mono px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason / Case Reference</label>
              <input 
                type="text" 
                value={newReason} 
                onChange={(e) => setNewReason(e.target.value)} 
                placeholder="e.g. Memory modification / cheat packet injection" 
                className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-red-500"
              />
            </div>
            <button type="submit" className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Enforce Quarantine Rule
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Active Network Bans ({bans.length})</h2>
            <span className="text-[11px] text-gray-500 font-mono">Edge Firewall Enforced</span>
          </div>
          {bans.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              <ShieldAlert className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <div className="font-semibold text-gray-700">No Active Quarantine Rules</div>
              <p className="text-gray-400 mt-0.5">All player connections are currently passing through standard anti-cheat verification.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bans.map((ban, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{ban.ip}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-red-50 text-red-700 border border-red-200">Banned</span>
                    </div>
                    <p className="text-gray-500">{ban.reason}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-[11px] text-gray-400">
                      <div>Logged: {ban.bannedAt}</div>
                    </div>
                    <button 
                      onClick={() => handleRemoveBan(ban.ip)}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BansPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading bans...</div>}>
      <BansPageContent />
    </Suspense>
  );
}
