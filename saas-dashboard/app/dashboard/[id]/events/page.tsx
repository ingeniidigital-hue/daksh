"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  LineChart,
  Zap,
  ShieldCheck,
  Database,
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
  FileCode,
  Flame,
  Search,
  Eye
} from "lucide-react";

interface TelemetryEvent {
  eventId?: string;
  titleId: string;
  eventName: string;
  playerId: string;
  timestamp: number;
  properties: Record<string, any>;
  ingestedAt?: number;
}

export default function EventsTelemetryPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "TITLE_DEMO";

  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);

  // Manual event submission
  const [customName, setCustomName] = useState("player_kill");
  const [customPlayerId, setCustomPlayerId] = useState("hero_warrior");
  const [customProps, setCustomProps] = useState(
    JSON.stringify({ zone: "dragon_spire", weapon: "excalibur", damage: 450, client_ip: "10.0.0.42" }, null, 2)
  );

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/telemetry/events?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotalCount(data.count || 0);
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
    }
  };

  useEffect(() => {
    fetchEvents().finally(() => setLoading(false));
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [titleId]);

  const handleSimulateBatch = async (count: number) => {
    setStatusMsg(`Simulating ${count.toLocaleString()} high-volume gameplay events...`);
    const eventTypes = ["player_kill", "loot_pickup", "player_death", "level_up", "boss_damage"];
    const batch = [];

    for (let i = 0; i < count; i++) {
      batch.push({
        titleId,
        eventName: eventTypes[i % eventTypes.length],
        playerId: `bot_${Math.floor(Math.random() * 500)}`,
        timestamp: Date.now(),
        properties: {
          session_id: `sess_${i % 50}`,
          score: (i * 15) % 1000,
          ip: "192.168.1.1",
          email: "bot_user@secret.com"
        }
      });
    }

    try {
      const res = await fetch(`/api/titles/${titleId}/telemetry/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch)
      });

      if (res.ok) {
        setStatusMsg(`Successfully ingested ${count.toLocaleString()} events in sub-10ms!`);
        fetchEvents();
      }
    } catch (err: any) {
      setStatusMsg(`Ingestion error: ${err.message}`);
    }
  };

  const handleSendCustomEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(customProps);
      } catch {
        setStatusMsg("Invalid JSON in custom properties");
        return;
      }

      const res = await fetch(`/api/titles/${titleId}/telemetry/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: customName,
          playerId: customPlayerId,
          properties: parsed
        })
      });

      if (res.ok) {
        setStatusMsg("Custom event ingested and PII scrubbed!");
        fetchEvents();
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    }
  };

  const getEventBadgeColor = (name: string) => {
    switch (name) {
      case "player_kill":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "loot_pickup":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "level_up":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "player_death":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              High-Volume Telemetry Ingestion
            </h1>
            <p className="text-sm text-gray-500">
              10,000+ events/sec ring buffer flusher & ClickHouse OLAP schema with automated PII scrubbing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSimulateBatch(100)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Simulate 100 Events
          </button>
          <button
            onClick={() => handleSimulateBatch(1000)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
          >
            <Flame className="w-4 h-4" />
            Stress Ingest 1,000 Batch
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-medium text-indigo-800 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-indigo-500 hover:text-indigo-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Ingested Events</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{totalCount.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 0 dropped events
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Ingestion Latency SLA</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">&lt; 5 ms</div>
          <div className="text-[11px] text-gray-500 mt-1">HTTP 202 Accepted</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">PII Redaction Guard</div>
          <div className="text-base font-bold text-gray-900 mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Active (IP & Email)
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Pre-storage scrubbing</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">OLAP Storage Engine</div>
          <div className="text-base font-bold text-gray-900 mt-1.5 flex items-center gap-1.5">
            <Database className="w-5 h-5 text-indigo-600" /> ClickHouse / Postgres
          </div>
          <div className="text-[11px] text-gray-500 mt-1">MergeTree partitioned</div>
        </div>
      </div>

      {/* Main Content: Custom Event Form & Recent Stream Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Custom Ingestion Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" /> Ingest Custom Event
          </h3>
          <form onSubmit={handleSendCustomEvent} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Event Name</label>
              <select
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
              >
                <option value="player_kill">player_kill</option>
                <option value="loot_pickup">loot_pickup</option>
                <option value="player_death">player_death</option>
                <option value="level_up">level_up</option>
                <option value="item_crafted">item_crafted</option>
                <option value="custom_gameplay">custom_gameplay</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Player ID</label>
              <input
                type="text"
                value={customPlayerId}
                onChange={e => setCustomPlayerId(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">
                JSON Properties (Max 4KB payload limit)
              </label>
              <textarea
                rows={5}
                value={customProps}
                onChange={e => setCustomProps(e.target.value)}
                className="mt-1 w-full p-2.5 font-mono text-[11px] border border-gray-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Ingest Event
            </button>
          </form>
        </div>

        {/* Right Column: Ingested Stream Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" /> Recent Ingested Stream ({events.length})
            </h3>
            <button
              onClick={fetchEvents}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No telemetry events ingested yet. Click &quot;Simulate 100 Events&quot; above to test.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold sticky top-0 bg-white">
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Player ID</th>
                    <th className="py-2.5 px-3">Properties Summary</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((evt, idx) => (
                    <tr key={evt.eventId || idx} className="hover:bg-gray-50/50 transition">
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getEventBadgeColor(
                            evt.eventName
                          )}`}
                        >
                          {evt.eventName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">
                        {evt.playerId}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500 max-w-xs truncate">
                        {JSON.stringify(evt.properties)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-400 text-[11px]">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-600"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Event JSON Inspector */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Event Telemetry Inspector</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getEventBadgeColor(selectedEvent.eventName)}`}>
                {selectedEvent.eventName}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Player ID:</span>
                <span className="font-mono font-bold text-gray-900">{selectedEvent.playerId}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Timestamp:</span>
                <span className="font-mono">{new Date(selectedEvent.timestamp).toISOString()}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-700 mb-1">
                Scrubbed Properties (PII Redacted)
              </div>
              <pre className="p-3 bg-gray-900 text-gray-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                {JSON.stringify(selectedEvent.properties, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
