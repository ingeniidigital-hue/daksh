"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Network, Plus, CheckCircle2 } from "lucide-react";

function WebhooksPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [webhooks, setWebhooks] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`daksh_webhooks_${titleId}`);
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [event, setEvent] = useState("player.banned");
  const [url, setUrl] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    const updated = [...webhooks, { id: `whk_${Date.now()}`, event, url, status: "Active", deliveries: "0 / 0" }];
    setWebhooks(updated);
    localStorage.setItem(`daksh_webhooks_${titleId}`, JSON.stringify(updated));
    setUrl("");
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            Outbound Event Webhooks
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Stream real-time game events, player bans, and IAP transactions to external analytics, Discord, or internal APIs.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="text-gray-500">
            <Link href="/dashboard" className="text-blue-600 hover:underline">Titles</Link> / <span className="font-semibold text-gray-700">{titleId}</span> / Webhooks
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> New Webhook
          </button>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Configured Subscriptions ({webhooks.length})</h2>
          <span className="text-[11px] text-gray-500 font-mono">HMAC-SHA256 Signed</span>
        </div>
        {webhooks.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-xs">
            <Network className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="font-semibold text-gray-700">No Webhook Endpoints Configured</div>
            <p className="text-gray-400 mt-0.5 mb-3">Deliver real-time payloads to Slack, Discord, or internal microservices when in-game events occur.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium"
            >
              Add Webhook Endpoint
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {webhooks.map((w, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">{w.event}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{w.status}</span>
                  </div>
                  <p className="font-mono text-gray-500 truncate max-w-md text-[11px]">{w.url}</p>
                </div>
                <div className="font-mono text-[11px] text-gray-500">
                  Deliveries: {w.deliveries}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-gray-200 p-6 max-w-md w-full shadow-lg">
            <h2 className="text-base font-bold text-gray-900 mb-1">Add Outbound Webhook</h2>
            <p className="text-xs text-gray-500 mb-4">Post real-time event notifications to an external URL.</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Event Trigger</label>
                <select 
                  value={event} 
                  onChange={e => setEvent(e.target.value)} 
                  className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white"
                >
                  <option value="player.banned">player.banned</option>
                  <option value="economy.purchase">economy.purchase</option>
                  <option value="match.completed">match.completed</option>
                  <option value="telemetry.anomaly">telemetry.anomaly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Webhook URL</label>
                <input 
                  type="url" 
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                  placeholder="https://your-domain.com/webhooks/listener"
                  className="w-full text-xs font-mono px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-medium"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WebhooksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading webhooks...</div>}>
      <WebhooksPageContent />
    </Suspense>
  );
}
