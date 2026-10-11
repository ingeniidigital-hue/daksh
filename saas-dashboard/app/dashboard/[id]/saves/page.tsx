"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Save, Database } from "lucide-react";

function SavesPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [saves] = useState([
    { playerId: "hw_galaxy_s24_demo_01", saveSlot: "slot_auto_01", revision: 14, updatedAt: "2 minutes ago", sizeBytes: "1.4 KB" },
    { playerId: "hw_iphone_16_demo_02", saveSlot: "slot_auto_01", revision: 8, updatedAt: "1 hour ago", sizeBytes: "2.1 KB" }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Titles</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/${titleId}`} className="hover:text-gray-900 font-mono transition-colors">{titleId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-semibold">Cloud Game Saves</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Save className="w-6 h-6 text-blue-600" />
            Cloud Game Saves & Remote State
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Inspect player cloud save slots, optimistic concurrency revisions, and binary/JSON save payloads.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Recent Cloud Saves ({saves.length})</h2>
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">OCC Revision Guarded</span>
        </div>
        <div className="divide-y divide-gray-100">
          {saves.map((s, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-bold text-gray-900">{s.playerId}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-semibold">Rev #{s.revision}</span>
                </div>
                <p className="text-xs text-gray-500">Slot: {s.saveSlot} • Size: {s.sizeBytes} • Modified: {s.updatedAt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SavesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading saves...</div>}>
      <SavesPageContent />
    </Suspense>
  );
}
