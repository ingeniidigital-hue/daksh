"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  Users,
  DollarSign,
  Download,
  Calendar,
  Lock,
  ShieldCheck,
  RefreshCw,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle
} from "lucide-react";

interface ExecutiveKpis {
  dau: number;
  wau: number;
  mau: number;
  totalRevenueUsd: number;
  arpuUsd: number;
  arppuUsd: number;
  totalUsers: number;
  payingUsers: number;
}

interface RetentionCohort {
  cohortDate: string;
  cohortSize: number;
  d1Percent: number;
  d7Percent: number;
  d14Percent?: number;
  d30Percent: number;
}

export default function AnalyticsDashboardPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "TITLE_DEMO";

  const [kpis, setKpis] = useState<ExecutiveKpis | null>(null);
  const [cohorts, setCohorts] = useState<RetentionCohort[]>([]);
  const [userRole, setUserRole] = useState<string>("admin");
  const [rbacError, setRbacError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchKpis = async (role: string) => {
    try {
      setRbacError(null);
      const res = await fetch(`/api/titles/${titleId}/analytics/kpis`, {
        headers: { "x-user-role": role }
      });

      if (res.status === 403) {
        const err = await res.json();
        setRbacError(err.message || "Forbidden: RBAC restricted to admin roles");
        setKpis(null);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
      }
    } catch (e: any) {
      setRbacError(e.message);
    }
  };

  const fetchCohorts = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/analytics/cohorts`);
      if (res.ok) {
        const data = await res.json();
        setCohorts(data.cohorts || []);
      }
    } catch (e) {
      console.error("Failed to load cohorts", e);
    }
  };

  useEffect(() => {
    Promise.all([fetchKpis(userRole), fetchCohorts()]).finally(() => setLoading(false));
  }, [titleId, userRole]);

  const handleSeedData = async () => {
    setStatusMsg("Seeding historical events to populate KPIs & cohorts...");
    const events = [];
    const now = Date.now();
    const DAY_MS = 86400000;

    for (let i = 0; i < 300; i++) {
      const dayOffset = (i % 30) * DAY_MS;
      events.push({
        titleId,
        playerId: `player_${i % 60}`,
        eventName: i % 8 === 0 ? "iap_purchase" : "session_start",
        timestamp: now - dayOffset,
        revenueCents: i % 8 === 0 ? 999 : 0
      });
    }

    try {
      const res = await fetch(`/api/titles/${titleId}/telemetry/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(events)
      });
      if (res.ok) {
        setStatusMsg("Successfully seeded 300 historical telemetry events!");
        fetchKpis(userRole);
        fetchCohorts();
      }
    } catch (err: any) {
      setStatusMsg(`Error seeding: ${err.message}`);
    }
  };

  const handleDownloadCsv = () => {
    window.location.href = `/api/titles/${titleId}/analytics/export?format=csv`;
  };

  const getHeatmapClass = (pct: number) => {
    if (pct >= 50) return "bg-emerald-600 text-white font-bold";
    if (pct >= 35) return "bg-emerald-500 text-white font-semibold";
    if (pct >= 20) return "bg-emerald-100 text-emerald-900 font-semibold";
    if (pct >= 10) return "bg-amber-100 text-amber-900";
    if (pct > 0) return "bg-gray-100 text-gray-700";
    return "text-gray-300";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Executive Analytics & KPIs
            </h1>
            <p className="text-sm text-gray-500">
              Live DAU/WAU/MAU aggregations, D1-D30 retention cohorts, and RBAC-governed ARPU
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* RBAC Role Switcher */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl text-xs">
            <span className="text-gray-500 font-medium px-2">Role:</span>
            <select
              value={userRole}
              onChange={e => setUserRole(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-2 py-1 font-semibold text-gray-800 text-xs shadow-xs"
            >
              <option value="admin">Admin (Authorized)</option>
              <option value="finance">Finance (Authorized)</option>
              <option value="developer">Developer (Restricted)</option>
              <option value="viewer">Viewer (Restricted)</option>
            </select>
          </div>

          <button
            onClick={handleSeedData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Seed Sample Data
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Export CSV (RFC 4180)
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* RBAC Alert when restricted role is selected */}
      {rbacError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-900">
          <Lock className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <div className="font-bold">Financial Metrics Protected by RBAC</div>
            <div className="text-rose-700 mt-0.5">{rbacError}</div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">DAU (Daily Active)</div>
          <div className="text-2xl font-black text-gray-900 mt-1">
            {kpis ? kpis.dau.toLocaleString() : "—"}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Last 24h rolling</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">WAU (Weekly Active)</div>
          <div className="text-2xl font-black text-gray-900 mt-1">
            {kpis ? kpis.wau.toLocaleString() : "—"}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Last 7 days rolling</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">MAU (Monthly Active)</div>
          <div className="text-2xl font-black text-gray-900 mt-1">
            {kpis ? kpis.mau.toLocaleString() : "—"}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Last 30 days rolling</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Revenue</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {kpis ? `$${kpis.totalRevenueUsd.toLocaleString()}` : <Lock className="w-5 h-5 text-gray-400 mt-1" />}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">IAP & Microtransactions</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">ARPU</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {kpis ? `$${kpis.arpuUsd.toFixed(2)}` : <Lock className="w-5 h-5 text-gray-400 mt-1" />}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Avg Rev Per User</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">ARPPU</div>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {kpis ? `$${kpis.arppuUsd.toFixed(2)}` : <Lock className="w-5 h-5 text-gray-400 mt-1" />}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Avg Rev Per Paying</div>
        </div>
      </div>

      {/* Retention Cohorts Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Retention Cohort Matrix (D1 / D7 / D14 / D30)
            </h3>
            <p className="text-xs text-gray-500">
              Percentage of players returning to the game N days after their initial signup cohort
            </p>
          </div>
          <button
            onClick={fetchCohorts}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {cohorts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            No retention cohorts calculated yet. Click &quot;Seed Sample Data&quot; above to populate historical cohorts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold text-left">
                  <th className="py-2.5 px-3">Cohort Date</th>
                  <th className="py-2.5 px-3 text-center">Cohort Size</th>
                  <th className="py-2.5 px-3 text-center">Day 1 (D1)</th>
                  <th className="py-2.5 px-3 text-center">Day 7 (D7)</th>
                  <th className="py-2.5 px-3 text-center">Day 14 (D14)</th>
                  <th className="py-2.5 px-3 text-center">Day 30 (D30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cohorts.map(c => (
                  <tr key={c.cohortDate} className="hover:bg-gray-50/50 transition text-left">
                    <td className="py-3 px-3 font-semibold text-gray-900 font-mono">
                      {c.cohortDate}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-700">
                      {c.cohortSize.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block w-16 py-1 rounded-md text-[11px] ${getHeatmapClass(c.d1Percent)}`}>
                        {c.d1Percent}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block w-16 py-1 rounded-md text-[11px] ${getHeatmapClass(c.d7Percent)}`}>
                        {c.d7Percent}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block w-16 py-1 rounded-md text-[11px] ${getHeatmapClass(c.d14Percent || 0)}`}>
                        {c.d14Percent ?? 0}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block w-16 py-1 rounded-md text-[11px] ${getHeatmapClass(c.d30Percent)}`}>
                        {c.d30Percent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
