"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, BarChart3, TrendingUp } from "lucide-react";

function StatisticsPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [stats] = useState([
    { statName: "total_monsters_slain", aggregation: "SUM", description: "Global monsters killed across all matches", total: "1,492,840" },
    { statName: "dungeon_clears_count", aggregation: "SUM", description: "Successful raid dungeon completions", total: "84,120" },
    { statName: "player_level_max", aggregation: "MAX", description: "Highest player level achieved in season", total: "Lvl 98" }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Titles</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/${titleId}`} className="hover:text-gray-900 font-mono transition-colors">{titleId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-semibold">Player Statistics</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Global & Player Statistics Counters
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track gameplay statistics, milestone counters, and server-side progression metrics.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Tracked Statistics ({stats.length})</h2>
          <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">Delta Accumulator Engine</span>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.map((st, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-bold text-gray-900">{st.statName}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">{st.aggregation}</span>
                </div>
                <p className="text-xs text-gray-500">{st.description}</p>
              </div>
              <div className="text-xs font-bold font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                {st.total}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading statistics...</div>}>
      <StatisticsPageContent />
    </Suspense>
  );
}
