"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Gift, CheckCircle2 } from "lucide-react";

function AdsPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [placements] = useState([
    { id: "ad_revive_extra_life", name: "Continue Match / Revive", reward: "1 Life", network: "Unity Ads / AdMob", status: "Active" },
    { id: "ad_daily_spin_multiplier", name: "Double Daily Spin Gold", reward: "2x Gold Multiplier", network: "AppLovin MAX", status: "Active" }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Titles</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/${titleId}`} className="hover:text-gray-900 font-mono transition-colors">{titleId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-semibold">Rewarded Ads</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Gift className="w-6 h-6 text-emerald-600" />
            Rewarded Video Ads & Server-Side Verification (SSV)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure ad placements with cryptographically verified server-side callbacks to prevent ad-spoofing cheats.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Active Placements ({placements.length})</h2>
          <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">SSV Callback Active</span>
        </div>
        <div className="divide-y divide-gray-100">
          {placements.map((ad, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-gray-900">{ad.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">{ad.status}</span>
                </div>
                <p className="text-xs font-mono text-gray-400">ID: {ad.id} • Network: {ad.network}</p>
              </div>
              <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-xl">
                Reward: {ad.reward}
              </div>
            </div>
          ))}
        </div>
      </div>
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
