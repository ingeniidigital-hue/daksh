"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, ShieldAlert, UserX, Plus, CheckCircle2, AlertOctagon } from "lucide-react";

function BansPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [bans, setBans] = useState([
    { ip: "198.51.100.42", reason: "Automated Bot Network / Speedhack", bannedAt: "2026-10-10", expiresAt: "Permanent", status: "Active" },
    { ip: "203.0.113.19", reason: "Repeated anti-cheat delta violation", bannedAt: "2026-10-09", expiresAt: "30 Days", status: "Active" }
  ]);
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");

  const handleAddBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp) return;
    setBans([{ ip: newIp, reason: newReason || "Manual studio administrative ban", bannedAt: "Just now", expiresAt: "Permanent", status: "Active" }, ...bans]);
    setNewIp("");
    setNewReason("");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Titles</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/${titleId}`} className="hover:text-gray-900 font-mono transition-colors">{titleId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-semibold">IP Bans & Anti-Cheat Suspensions</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <UserX className="w-6 h-6 text-red-600" />
            IP Bans & Security Quarantine
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enforce IP network bans, automated anti-cheat suspensions, and hardware blacklist rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" /> Block New IP Address
          </h2>
          <form onSubmit={handleAddBan} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target IPv4 / IPv6</label>
              <input 
                type="text" 
                value={newIp} 
                onChange={(e) => setNewIp(e.target.value)} 
                placeholder="e.g. 192.0.2.1" 
                className="w-full text-xs font-mono px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason / Case Ref</label>
              <input 
                type="text" 
                value={newReason} 
                onChange={(e) => setNewReason(e.target.value)} 
                placeholder="e.g. Memory modification detected" 
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button type="submit" className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Quarantine Rule
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Active Network Bans ({bans.length})</h2>
            <span className="text-xs text-gray-400 font-mono">Edge Firewall Synced</span>
          </div>
          <div className="divide-y divide-gray-100">
            {bans.map((ban, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-900">{ban.ip}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">Banned</span>
                  </div>
                  <p className="text-xs text-gray-500">{ban.reason}</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>Since: {ban.bannedAt}</div>
                  <div>Duration: {ban.expiresAt}</div>
                </div>
              </div>
            ))}
          </div>
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
