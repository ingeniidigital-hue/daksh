"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Network, Plus, CheckCircle2 } from "lucide-react";

function WebhooksPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [webhooks] = useState([
    { id: "whk_discord_bans", event: "player.banned", url: "https://discord.com/api/webhooks/...", status: "Active", deliveries: "142 / 142 (100%)" },
    { id: "whk_paddle_iaps", event: "economy.purchase", url: "https://api.mygamestudio.com/hooks/paddle", status: "Active", deliveries: "8,921 / 8,921 (100%)" }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Titles</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/${titleId}`} className="hover:text-gray-900 font-mono transition-colors">{titleId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-semibold">Webhooks</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-600" />
            Outbound Event Webhooks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stream real-time game events, player bans, and IAP transactions to external analytics, Discord, or internal APIs.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Configured Subscriptions ({webhooks.length})</h2>
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">HMAC-SHA256 Signed</span>
        </div>
        <div className="divide-y divide-gray-100">
          {webhooks.map((w, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-bold text-gray-900">{w.event}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">{w.status}</span>
                </div>
                <p className="text-xs font-mono text-gray-400 truncate max-w-md">{w.url}</p>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {w.deliveries}
              </div>
            </div>
          ))}
        </div>
      </div>
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
