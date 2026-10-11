"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Trophy,
  Plus,
  Trash2,
  Clock,
  ArrowDownUp,
  RefreshCw,
  Users,
  Sparkles,
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface Leaderboard {
  leaderboardId: string;
  name: string;
  sortOrder: "ASCENDING" | "DESCENDING";
  resetFrequency: "DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME";
  maxScoreDelta?: number;
  createdAt?: string;
}

interface LeaderboardEntry {
  playerId: string;
  score: number;
  rank: number;
  timestamp: number;
}

interface SecurityAlert {
  alertId: string;
  titleId: string;
  leaderboardId: string;
  playerId: string;
  reason: string;
  attemptedScore: number;
  previousScore?: number;
  attemptedDelta: number;
  timestamp: number;
}

export default function LeaderboardsPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "TITLE_LEADERBOARD_01";

  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [selectedLbId, setSelectedLbId] = useState<string>("");
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // New leaderboard form
  const [newLbId, setNewLbId] = useState("");
  const [newLbName, setNewLbName] = useState("");
  const [newResetFreq, setNewResetFreq] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME">("WEEKLY");
  const [newSortOrder, setNewSortOrder] = useState<"ASCENDING" | "DESCENDING">("DESCENDING");
  const [newMaxDelta, setNewMaxDelta] = useState(2000);

  // Score submission test form
  const [subPlayerId, setSubPlayerId] = useState("player_" + Math.floor(Math.random() * 1000));
  const [subScore, setSubScore] = useState(2500);

  const fetchLeaderboards = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/leaderboards`);
      if (res.ok) {
        const data = await res.json();
        const boards = data.leaderboards || [];
        setLeaderboards(boards);
        if (boards.length > 0 && !selectedLbId) {
          setSelectedLbId(boards[0].leaderboardId);
        }
      }
    } catch (e) {
      console.error("Failed to load leaderboards", e);
    }
  };

  const fetchScores = async (lbId: string) => {
    if (!lbId) return;
    try {
      const res = await fetch(`/api/titles/${titleId}/leaderboards/${lbId}/scores?limit=25`);
      if (res.ok) {
        const data = await res.json();
        setTopScores(data.topScores || []);
      }
    } catch (e) {
      console.error("Failed to load top scores", e);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/leaderboards/alerts`);
      if (res.ok) {
        const data = await res.json();
        setSecurityAlerts(data.alerts || []);
      }
    } catch (e) {
      console.error("Failed to load alerts", e);
    }
  };

  useEffect(() => {
    fetchLeaderboards().finally(() => setLoading(false));
    fetchAlerts();
  }, [titleId]);

  useEffect(() => {
    if (selectedLbId) {
      fetchScores(selectedLbId);
    }
  }, [selectedLbId]);

  const handleCreateLeaderboard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/titles/${titleId}/leaderboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaderboardId: newLbId,
          name: newLbName,
          resetFrequency: newResetFreq,
          sortOrder: newSortOrder,
          maxScoreDelta: Number(newMaxDelta)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLeaderboards(prev => [...prev, data.leaderboard]);
        setSelectedLbId(data.leaderboard.leaderboardId);
        setIsModalOpen(false);
        setStatusMsg(`Created leaderboard: ${data.leaderboard.name}`);
        setNewLbId("");
        setNewLbName("");
      }
    } catch (err: any) {
      setStatusMsg(`Error creating leaderboard: ${err.message}`);
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLbId) return;

    try {
      const res = await fetch(`/api/titles/${titleId}/leaderboards/${selectedLbId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: subPlayerId,
          score: Number(subScore)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`Score submitted: ${data.playerId} scored ${data.score} (Rank #${data.rank} of ${data.totalPlayers})`);
        fetchScores(selectedLbId);
      } else {
        setStatusMsg(`Anti-Cheat Alert: ${data.message || data.error}`);
        fetchAlerts();
      }
    } catch (err: any) {
      setStatusMsg(`Score submission error: ${err.message}`);
    }
  };

  const handleSimulateRoster = async () => {
    if (!selectedLbId) return;
    setStatusMsg("Simulating 10 high-concurrency player scores...");
    const sampleBots = [
      { id: "vanguard_ace", score: 4800 },
      { id: "valkyrie_99", score: 4250 },
      { id: "shadow_striker", score: 3900 },
      { id: "titan_prime", score: 3450 },
      { id: "blitz_rider", score: 3100 },
      { id: "zenith_god", score: 5000 },
      { id: "frost_sniper", score: 2800 },
      { id: "cyber_ninja", score: 2600 },
      { id: "mystic_blade", score: 2150 },
      { id: "iron_golem", score: 1950 }
    ];

    for (const bot of sampleBots) {
      await fetch(`/api/titles/${titleId}/leaderboards/${selectedLbId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: bot.id, score: bot.score })
      });
    }

    fetchScores(selectedLbId);
    setStatusMsg("Successfully submitted 10 player scores into sorted set!");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-md shadow-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Global Leaderboards & Statistics
            </h1>
            <p className="text-sm text-gray-500">
              Redis ZSET-powered leaderboards with microsecond tie-breaking & anti-cheat spike detection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateRoster}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Populate 10 Bot Ranks
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Leaderboard
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-800 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-blue-500 hover:text-blue-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Leaderboard Selector, Active Top Scores, Score Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Boards List & Score Tester */}
        <div className="space-y-6">
          {/* Boards List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Active Leaderboards ({leaderboards.length})
            </h3>
            {leaderboards.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">
                No leaderboards defined yet. Click &quot;New Leaderboard&quot; above to create one.
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboards.map(lb => (
                  <div
                    key={lb.leaderboardId}
                    onClick={() => setSelectedLbId(lb.leaderboardId)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      selectedLbId === lb.leaderboardId
                        ? "border-amber-500 bg-amber-50/40 shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm">{lb.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold">
                        {lb.resetFrequency}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-3 mt-1.5 font-mono">
                      <span>ID: {lb.leaderboardId}</span>
                      <span>Order: {lb.sortOrder}</span>
                      {lb.maxScoreDelta && <span>Max Δ: ±{lb.maxScoreDelta}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score Submission Tester */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" /> RPC submit_score Test Bench
            </h3>
            <form onSubmit={handleSubmitScore} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-700">Player ID</label>
                <input
                  type="text"
                  value={subPlayerId}
                  onChange={e => setSubPlayerId(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-700">Score to Submit</label>
                <input
                  type="number"
                  value={subScore}
                  onChange={e => setSubScore(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!selectedLbId}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
              >
                Submit Score Authoritatively
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (2 cols): Live Rankings & Security Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Rankings Table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Live Ranked Standings
                  {selectedLbId && <span className="text-xs font-mono font-normal text-gray-500">({selectedLbId})</span>}
                </h3>
                <p className="text-xs text-gray-500">
                  Microsecond deterministic tie-breaking ensures identical scores rank by submission time
                </p>
              </div>
              <button
                onClick={() => fetchScores(selectedLbId)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {topScores.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No scores recorded on this leaderboard yet. Use the test bench on the left or click &quot;Populate 10 Bot Ranks&quot;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Player ID</th>
                      <th className="py-2.5 px-3 text-right">Score</th>
                      <th className="py-2.5 px-3 text-right">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topScores.map(entry => (
                      <tr key={entry.playerId} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-[11px] ${
                              entry.rank === 1
                                ? "bg-amber-100 text-amber-800"
                                : entry.rank === 2
                                ? "bg-slate-200 text-slate-800"
                                : entry.rank === 3
                                ? "bg-amber-700/20 text-amber-900"
                                : "text-gray-500 font-mono"
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-900">
                          {entry.playerId}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 text-sm">
                          {entry.score.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-400 font-mono text-[11px]">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Anti-Cheat Security Audit Alerts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Anti-Cheat Security Audit Log ({securityAlerts.length})
              </h3>
              <span className="text-[11px] text-gray-400">
                Impossible delta spikes flagged automatically
              </span>
            </div>

            {securityAlerts.length === 0 ? (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero anti-cheat violations detected. All score submissions within allowed delta boundaries.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {securityAlerts.map(alert => (
                  <div
                    key={alert.alertId}
                    className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold">{alert.reason}</div>
                      <div className="text-[10px] text-rose-600 font-mono mt-0.5">
                        Player: {alert.playerId} | Attempted: {alert.attemptedScore} | Previous: {alert.previousScore ?? 0}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-rose-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: New Leaderboard */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Create New Leaderboard</h3>
            <form onSubmit={handleCreateLeaderboard} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Leaderboard ID</label>
                <input
                  type="text"
                  placeholder="e.g. season_01_ranked"
                  value={newLbId}
                  onChange={e => setNewLbId(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Season 1 Ranked Arena"
                  value={newLbName}
                  onChange={e => setNewLbName(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Reset Frequency</label>
                  <select
                    value={newResetFreq}
                    onChange={e => setNewResetFreq(e.target.value as any)}
                    className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="ALL_TIME">All-Time</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Sort Order</label>
                  <select
                    value={newSortOrder}
                    onChange={e => setNewSortOrder(e.target.value as any)}
                    className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="DESCENDING">Descending (High to Low)</option>
                    <option value="ASCENDING">Ascending (Low to High)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Anti-Cheat Max Allowed Delta per Update (0 = Disabled)
                </label>
                <input
                  type="number"
                  value={newMaxDelta}
                  onChange={e => setNewMaxDelta(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Create Leaderboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
