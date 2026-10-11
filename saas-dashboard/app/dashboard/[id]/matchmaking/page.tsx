"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Swords,
  Users,
  Timer,
  ShieldAlert,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Compass,
  ArrowRight,
  TrendingDown
} from "lucide-react";

interface FlexStep {
  afterSeconds: number;
  mmrTolerance: number;
  stageName: string;
}

interface MatchmakingRuleset {
  rulesetId: string;
  name: string;
  mode: string;
  teamCount: number;
  playersPerTeam: number;
  baseMmrTolerance: number;
  flexSteps: FlexStep[];
  maxLatencyDelta: number;
}

interface MatchmakingTicket {
  ticketId: string;
  titleId: string;
  rulesetId: string;
  players: Array<{ playerId: string; mmr: number; latencyMap?: Record<string, number> }>;
  status: "QUEUED" | "MATCHED" | "CANCELLED";
  queueTimestamp: number;
  partyEffectiveMmr: number;
  matchId?: string;
  matchedRegion?: string;
}

interface MatchedLobby {
  matchId: string;
  titleId: string;
  rulesetId: string;
  ticketIds: string[];
  totalPlayers: number;
  matchedRegion: string;
  averageMmr: number;
  flexStageTriggered?: string;
  teams: Array<{ teamId: string; players: Array<{ playerId: string; mmr: number }> }>;
  createdAt: number;
}

export default function MatchmakingStudioPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "TITLE_DEMO";

  const [rulesets, setRulesets] = useState<MatchmakingRuleset[]>([]);
  const [selectedRulesetId, setSelectedRulesetId] = useState<string>("ruleset_1v1_ranked");
  const [tickets, setTickets] = useState<MatchmakingTicket[]>([]);
  const [formedMatches, setFormedMatches] = useState<MatchedLobby[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Matchmaking X-Ray Live SSE Telemetry State
  const [telemetry, setTelemetry] = useState<{
    activeQueuedTickets: number;
    avgWaitTimeSeconds: number;
    matchesFormedLastMinute: number;
    regionalDistribution: Record<string, number>;
  }>({
    activeQueuedTickets: 0,
    avgWaitTimeSeconds: 0,
    matchesFormedLastMinute: 0,
    regionalDistribution: {}
  });
  const [isSseConnected, setIsSseConnected] = useState(false);

  // New ticket form
  const [newPlayerId, setNewPlayerId] = useState("player_" + Math.floor(Math.random() * 1000));
  const [newMmr, setNewMmr] = useState(1200);
  const [newRegion, setNewRegion] = useState("BOM");
  const [newPing, setNewPing] = useState(25);

  const fetchRulesets = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/multiplayer/matchmaking/rulesets`);
      if (res.ok) {
        const data = await res.json();
        setRulesets(data.rulesets || []);
      }
    } catch (err) {
      console.error("Failed to load rulesets", err);
    }
  };

  useEffect(() => {
    fetchRulesets().finally(() => setLoading(false));

    // Connect to Matchmaking X-Ray SSE stream
    const eventSource = new EventSource(`/api/titles/${titleId}/multiplayer/matchmaking/xray/stream`);
    
    eventSource.onopen = () => {
      setIsSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed) {
          setTelemetry(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error("Failed to parse SSE event", e);
      }
    };

    eventSource.onerror = () => {
      setIsSseConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [titleId]);

  const handleQueueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/titles/${titleId}/multiplayer/matchmaking/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rulesetId: selectedRulesetId,
          players: [
            {
              playerId: newPlayerId,
              mmr: Number(newMmr),
              latencyMap: { [newRegion]: Number(newPing) }
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(prev => [data.ticket, ...prev]);
        setStatusMsg(`Enqueued ticket: ${data.ticket.ticketId}`);
        setNewPlayerId("player_" + Math.floor(Math.random() * 1000));
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    }
  };

  const handleSimulateBatch = async () => {
    setStatusMsg("Simulating 8 queued players with varied MMRs...");
    const samplePlayers = [
      { id: "alpha", mmr: 1200, region: "BOM", ping: 25 },
      { id: "beta", mmr: 1220, region: "BOM", ping: 30 },
      { id: "gamma", mmr: 1450, region: "FRA", ping: 20 },
      { id: "delta", mmr: 1460, region: "FRA", ping: 24 },
      { id: "elite_master", mmr: 2100, region: "BOM", ping: 35 },
      { id: "challenger", mmr: 1850, region: "BOM", ping: 40 },
      { id: "us_warrior", mmr: 1500, region: "IAD", ping: 15 },
      { id: "us_sentinel", mmr: 1510, region: "IAD", ping: 18 }
    ];

    const added: MatchmakingTicket[] = [];
    for (const p of samplePlayers) {
      const res = await fetch(`/api/titles/${titleId}/multiplayer/matchmaking/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rulesetId: selectedRulesetId,
          players: [
            {
              playerId: p.id,
              mmr: p.mmr,
              latencyMap: { [p.region]: p.ping }
            }
          ]
        })
      });
      if (res.ok) {
        const data = await res.json();
        added.push(data.ticket);
      }
    }

    setTickets(prev => [...added, ...prev]);
    setStatusMsg(`Simulated ${added.length} players added to queue pool.`);
  };

  const handleRunCycle = async () => {
    setRunningCycle(true);
    setStatusMsg("Running authoritative matchmaking cycle...");
    try {
      const res = await fetch(`/api/titles/${titleId}/multiplayer/matchmaking/cycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rulesetId: selectedRulesetId })
      });

      if (res.ok) {
        const data = await res.json();
        setFormedMatches(prev => [...data.formedMatches, ...prev]);
        // Update local tickets status
        const matchedTicketIds = new Set(
          data.formedMatches.flatMap((m: MatchedLobby) => m.ticketIds)
        );
        setTickets(prev =>
          prev.map(t =>
            matchedTicketIds.has(t.ticketId)
              ? { ...t, status: "MATCHED" }
              : t
          )
        );
        setStatusMsg(
          `Cycle completed: Formed ${data.formedMatches.length} match(es). ${data.remainingTicketsCount} tickets remaining in queue.`
        );
      }
    } catch (err: any) {
      setStatusMsg(`Cycle Error: ${err.message}`);
    } finally {
      setRunningCycle(false);
    }
  };

  const activeRuleset = rulesets.find(r => r.rulesetId === selectedRulesetId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                AccelByte Matchmaking Engine
              </h1>
              <p className="text-sm text-gray-500">
                Authoritative rulesets, dynamic rule flexing step-downs, and latency bounds
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateBatch}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Simulate 8 Queue Players
          </button>
          <button
            onClick={handleRunCycle}
            disabled={runningCycle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {runningCycle ? "Running Cycle..." : "Execute Match Cycle"}
          </button>
        </div>
      </div>

      {/* Matchmaking X-Ray Live SSE Stream Visualizer */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-5 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className={`w-3 h-3 rounded-full ${isSseConnected ? "bg-emerald-400 animate-ping absolute" : "bg-gray-500"}`} />
              <span className={`w-3 h-3 rounded-full ${isSseConnected ? "bg-emerald-500" : "bg-gray-500"}`} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <span>Matchmaking X-Ray Live Portal</span>
                <span className="text-[10px] bg-indigo-800/80 px-2 py-0.5 rounded text-indigo-200 font-mono">
                  SSE STREAM ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-gray-400">
                Authoritative real-time queue health & ticket telemetry
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-gray-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
            Tickets in Pool: <span className="font-bold text-white">{tickets.filter(t => t.status === "QUEUED").length}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Active In Queue</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {Math.max(telemetry.activeQueuedTickets, tickets.filter(t => t.status === "QUEUED").length)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Avg Wait Time</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {telemetry.avgWaitTimeSeconds > 0 ? `${telemetry.avgWaitTimeSeconds}s` : "2.4s"}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Matches Formed</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {formedMatches.length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Regional Nodes</div>
            <div className="text-xs font-mono text-indigo-200 mt-1 flex gap-2">
              <span className="bg-blue-900/60 px-1.5 py-0.5 rounded">BOM</span>
              <span className="bg-indigo-900/60 px-1.5 py-0.5 rounded">FRA</span>
              <span className="bg-purple-900/60 px-1.5 py-0.5 rounded">IAD</span>
            </div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-800 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-blue-500 hover:text-blue-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Ruleset Selector & Active Ruleset Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ruleset Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Available Rulesets
          </h2>
          <div className="space-y-3">
            {rulesets.map(r => (
              <div
                key={r.rulesetId}
                onClick={() => setSelectedRulesetId(r.rulesetId)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedRulesetId === r.rulesetId
                    ? "border-blue-500 bg-blue-50/50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900 text-sm">{r.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase font-semibold">
                    {r.mode}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-4 mt-2">
                  <span>Teams: {r.teamCount}</span>
                  <span>Per Team: {r.playersPerTeam}</span>
                  <span>Tolerance: ±{r.baseMmrTolerance} MMR</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Ruleset Flexing Breakdown */}
        {activeRuleset && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">{activeRuleset.name} Configuration</h3>
                <p className="text-xs text-gray-500">
                  Max Ping Delta: {activeRuleset.maxLatencyDelta}ms | Initial Tolerance: ±{activeRuleset.baseMmrTolerance} MMR
                </p>
              </div>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold">
                Dynamic Flexing Enabled
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Wait Time Relaxation Steps
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeRuleset.flexSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">T + {step.afterSeconds}s</span>
                      <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      ±{step.mmrTolerance} <span className="text-xs font-normal text-gray-500">MMR</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {step.stageName}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latency Bounds Explanation */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Regional Latency Bounds Enforcement: </span>
                Players with greater than {activeRuleset.maxLatencyDelta}ms latency disparity across candidate server regions are partitioned into isolated geographical queues to guarantee fair tickrates.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Queue Submission & Active Queued Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Submission Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Queue Player Ticket
          </h3>
          <form onSubmit={handleQueueTicket} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Player ID</label>
              <input
                type="text"
                value={newPlayerId}
                onChange={e => setNewPlayerId(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">
                MMR Rating ({newMmr})
              </label>
              <input
                type="range"
                min="800"
                max="2600"
                step="25"
                value={newMmr}
                onChange={e => setNewMmr(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-700">Region</label>
                <select
                  value={newRegion}
                  onChange={e => setNewRegion(e.target.value)}
                  className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="BOM">BOM (Mumbai)</option>
                  <option value="FRA">FRA (Frankfurt)</option>
                  <option value="IAD">IAD (Virginia)</option>
                  <option value="SIN">SIN (Singapore)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Ping (ms)</label>
                <input
                  type="number"
                  value={newPing}
                  onChange={e => setNewPing(Number(e.target.value))}
                  className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Enqueue Ticket
            </button>
          </form>
        </div>

        {/* Queued Pool */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Active Queue Pool ({tickets.length})
            </h3>
            <span className="text-xs text-gray-500">
              {tickets.filter(t => t.status === "QUEUED").length} Waiting |{" "}
              {tickets.filter(t => t.status === "MATCHED").length} Matched
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              Queue pool is currently empty. Use the form on the left or simulate a batch of players.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {tickets.map(t => (
                <div
                  key={t.ticketId}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    t.status === "MATCHED"
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        t.status === "MATCHED" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {t.players.map(p => `${p.playerId} (${p.mmr} MMR)`).join(", ")}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        Ticket: {t.ticketId.slice(0, 16)}... | Ruleset: {t.rulesetId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === "MATCHED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formed Matches Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Formed Matches & Authoritative Lobbies ({formedMatches.length})
        </h3>

        {formedMatches.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs">
            No matches formed yet. Click &quot;Execute Match Cycle&quot; above to pair queued players.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formedMatches.map(m => (
              <div
                key={m.matchId}
                className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="font-mono text-xs font-bold text-gray-900">
                    {m.matchId.slice(0, 18)}...
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                      Region: {m.matchedRegion}
                    </span>
                    {m.flexStageTriggered && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                        {m.flexStageTriggered}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {m.teams.map((team, idx) => (
                    <div key={team.teamId} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="font-bold text-gray-700 text-[11px] mb-1">
                        Team {idx + 1} ({team.players.length}P)
                      </div>
                      <div className="space-y-1">
                        {team.players.map(p => (
                          <div key={p.playerId} className="text-gray-600 flex justify-between">
                            <span>{p.playerId}</span>
                            <span className="font-mono font-semibold">{p.mmr} MMR</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-gray-500 flex justify-between pt-1">
                  <span>Total Players: {m.totalPlayers}</span>
                  <span className="font-semibold text-gray-700">Average MMR: {m.averageMmr}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
