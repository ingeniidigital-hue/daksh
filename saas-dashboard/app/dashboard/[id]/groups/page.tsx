"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, UsersRound, Shield } from "lucide-react";

function GroupsPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [groups] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`daksh_groups_${titleId}`);
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-indigo-600" />
            Guilds, Clans & Social Groups
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage player social hierarchies, shared guild vaults, clan wars, and member roles.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <Link href="/dashboard" className="text-blue-600 hover:underline">Titles</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-semibold">{titleId}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">Guilds</span>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Registered Guilds ({groups.length})</h2>
          <span className="text-[11px] text-gray-500 font-mono">Nakama Social Engine</span>
        </div>
        {groups.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-xs">
            <UsersRound className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="font-semibold text-gray-700">No Clans or Guilds Formed</div>
            <p className="text-gray-400 mt-0.5">Guilds created by players in-game will appear here with leaderboards and member rosters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {groups.map((g, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{g.name}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Lvl {g.level}</span>
                  </div>
                  <p className="text-gray-500 text-[11px]">Leader: {g.leader} • Members: {g.members}/{g.maxMembers}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading groups...</div>}>
      <GroupsPageContent />
    </Suspense>
  );
}
