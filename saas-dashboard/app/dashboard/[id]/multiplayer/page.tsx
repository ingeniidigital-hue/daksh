"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Swords,
  Timer,
  Trophy,
  Users,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  ShieldAlert,
  ArrowRight,
  Eye,
  Plus
} from "lucide-react";

interface TurnMove {
  action: string;
  playerId: string;
  x?: number;
  y?: number;
  timestamp: number;
}

interface TurnBasedMatch {
  matchId: string;
  titleId: string;
  status: "WAITING" | "ACTIVE" | "RESOLVED" | "FORFEIT" | "DRAW";
  players: string[];
  activeTurnPlayerId: string;
  turnNumber: number;
  turnTimeoutSeconds: number;
  turnStartedAt: number;
  boardState: (string | null)[][];
  moveHistory: TurnMove[];
  winnerId: string | null;
  loserId: string | null;
  resolutionReason: string | null;
  wagerAmount?: number;
  currencyCode?: string;
  createdAt: number;
  updatedAt: number;
}

export default function TurnBasedMultiplayerPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "TITLE_TB_01";

  const [matches, setMatches] = useState<TurnBasedMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TurnBasedMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Match Form Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [player1Input, setPlayer1Input] = useState("hero_alice");
  const [player2Input, setPlayer2Input] = useState("rival_bob");
  const [turnTimeout, setTurnTimeout] = useState(30);
  const [wager, setWager] = useState(25);

  const fetchMatches = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/multiplayer/turn-based/matches`);
      const data = await res.json();
      if (res.ok && data.matches) {
        setMatches(data.matches);
        if (!selectedMatch && data.matches.length > 0) {
          setSelectedMatch(data.matches[0]);
        } else if (selectedMatch) {
          const fresh = data.matches.find((m: TurnBasedMatch) => m.matchId === selectedMatch.matchId);
          if (fresh) setSelectedMatch(fresh);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 3000);
    return () => clearInterval(interval);
  }, [titleId]);

  // Create New Match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/titles/${titleId}/multiplayer/turn-based/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players: [player1Input.trim(), player2Input.trim()],
          turnTimeoutSeconds: Number(turnTimeout),
          wagerAmount: Number(wager),
          currencyCode: "GOLD"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create match");
        return;
      }

      setSuccessMsg(`Created Match '${data.match.matchId}'`);
      setSelectedMatch(data.match);
      setIsCreateModalOpen(false);
      fetchMatches();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Submit Move on Board Cell
  const handleCellClick = async (x: number, y: number) => {
    if (!selectedMatch || selectedMatch.status !== "ACTIVE") return;

    try {
      const res = await fetch(
        `/api/titles/${titleId}/multiplayer/turn-based/matches/${selectedMatch.matchId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: selectedMatch.activeTurnPlayerId,
            move: { action: "PLACE_MARK", x, y }
          })
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Move failed");
        setTimeout(() => setError(null), 3500);
        return;
      }

      setSelectedMatch(data.match);
      fetchMatches();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Trigger Watchdog Timeout Forfeit Test
  const handleSimulateTimeout = async () => {
    if (!selectedMatch || selectedMatch.status !== "ACTIVE") return;

    try {
      const simulatedTime = Date.now() + (selectedMatch.turnTimeoutSeconds + 5) * 1000;
      const res = await fetch(
        `/api/titles/${titleId}/multiplayer/turn-based/matches/${selectedMatch.matchId}/watchdog`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentTime: simulatedTime })
        }
      );

      const data = await res.json();
      if (res.ok && data.match) {
        setSelectedMatch(data.match);
        setSuccessMsg(`Watchdog triggered forfeit: ${data.match.winnerId} won!`);
        fetchMatches();
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-7 h-7 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Turn-Based Multiplayer Engine</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              STORY-06
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            In-memory turn-based match rooms running with sub-10ms response times and $0 database compute during active gameplay.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Match Room</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Active Match Simulation vs Rooms List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Match Room Interactive Board */}
        <div className="lg:col-span-7 space-y-4">
          {selectedMatch ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              {/* Match Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">{selectedMatch.matchId}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        selectedMatch.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : selectedMatch.status === "RESOLVED"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : selectedMatch.status === "FORFEIT"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {selectedMatch.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Turn #{selectedMatch.turnNumber}</p>
                </div>

                {selectedMatch.status === "ACTIVE" && (
                  <button
                    onClick={handleSimulateTimeout}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold transition"
                    title="Simulate 30s turn timeout forfeit watchdog"
                  >
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Trigger Watchdog Forfeit</span>
                  </button>
                )}
              </div>

              {/* Turn Banner */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Active Player</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {selectedMatch.activeTurnPlayerId}
                    </span>
                  </div>
                </div>

                {selectedMatch.wagerAmount && selectedMatch.wagerAmount > 0 && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-mono font-bold">
                    <Coins className="w-4 h-4" />
                    <span>Pot: {selectedMatch.wagerAmount * selectedMatch.players.length} {selectedMatch.currencyCode}</span>
                  </div>
                )}
              </div>

              {/* 3x3 Interactive Grid Board */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
                  {selectedMatch.boardState.map((row, rIdx) =>
                    row.map((cell, cIdx) => {
                      const isP1 = cell === selectedMatch.players[0];
                      const isP2 = cell === selectedMatch.players[1];
                      return (
                        <button
                          key={`${rIdx}-${cIdx}`}
                          disabled={selectedMatch.status !== "ACTIVE" || cell !== null}
                          onClick={() => handleCellClick(rIdx, cIdx)}
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center font-bold text-2xl transition border ${
                            cell === null
                              ? "bg-slate-900 border-slate-800 hover:bg-slate-800/80 hover:border-indigo-500 cursor-pointer"
                              : isP1
                              ? "bg-indigo-950/50 border-indigo-500 text-indigo-400"
                              : "bg-emerald-950/50 border-emerald-500 text-emerald-400"
                          }`}
                        >
                          {isP1 ? "X" : isP2 ? "O" : ""}
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  {selectedMatch.status === "ACTIVE"
                    ? `Click any open cell to submit move as ${selectedMatch.activeTurnPlayerId}`
                    : `Match concluded: ${selectedMatch.resolutionReason} (${selectedMatch.winnerId || "Draw"})`}
                </p>
              </div>

              {/* Move History Log */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">Move Audit History ({selectedMatch.moveHistory.length})</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                  {selectedMatch.moveHistory.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-3">No moves recorded yet.</p>
                  ) : (
                    selectedMatch.moveHistory.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-slate-950/50 border border-slate-800/70 rounded-lg text-xs font-mono"
                      >
                        <span className="text-indigo-300">#{idx + 1} {m.playerId}</span>
                        <span className="text-slate-400">{m.action} at ({m.x}, {m.y})</span>
                        <span className="text-[10px] text-slate-600">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <Swords className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm">No match room selected.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
              >
                Create Room
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Active In-Memory Rooms */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">In-Memory Active Matches</p>
              <p className="text-xs text-slate-400">Total: {matches.length} active match instances</p>
            </div>
          </div>

          <div className="space-y-3">
            {matches.map((m) => (
              <div
                key={m.matchId}
                onClick={() => setSelectedMatch(m)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  selectedMatch?.matchId === m.matchId
                    ? "bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-white">{m.matchId}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      m.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{m.players.join(" vs ")}</span>
                  <span>Turn #{m.turnNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Create Match */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-indigo-400" />
                <span>Create Turn-Based Match</span>
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Player 1 ID</label>
                <input
                  type="text"
                  required
                  value={player1Input}
                  onChange={(e) => setPlayer1Input(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Player 2 ID</label>
                <input
                  type="text"
                  required
                  value={player2Input}
                  onChange={(e) => setPlayer2Input(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Turn Timer (Sec)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={turnTimeout}
                    onChange={(e) => setTurnTimeout(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Wager (Gold)</label>
                  <input
                    type="number"
                    min="0"
                    value={wager}
                    onChange={(e) => setWager(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Match</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
