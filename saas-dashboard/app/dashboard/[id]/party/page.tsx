"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Target, Users } from "lucide-react";

function PartyPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [parties] = useState([
    { id: "party_squad_alpha", leaderId: "player_9918", members: 4, status: "In Matchmaking", region: "ap-south-1" },
    { id: "party_duo_bravo", leaderId: "player_4412", members: 2, status: "Ready", region: "ap-south-1" }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Titles</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/${titleId}`} className="hover:text-gray-900 font-mono transition-colors">{titleId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-semibold">Party Lobbies</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Active Party Lobbies & Group Queuing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor real-time player parties, squad member counts, and team matchmaking synchronization.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Live Parties ({parties.length})</h2>
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">Redis Backed</span>
        </div>
        <div className="divide-y divide-gray-100">
          {parties.map((p, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-bold text-gray-900">{p.id}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">{p.status}</span>
                </div>
                <p className="text-xs text-gray-500">Leader: {p.leaderId} • Members: {p.members} players • Region: {p.region}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PartyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading parties...</div>}>
      <PartyPageContent />
    </Suspense>
  );
}
