"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, FlaskConical, Plus, CheckCircle2 } from "lucide-react";

function ExperimentsPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [experiments] = useState([
    { id: "exp_drop_rate_boost", name: "Weekend Drop Rate 2x", status: "Active", split: "50% A / 50% B", metric: "+18.4% Retention" },
    { id: "exp_starter_pack_price", name: "Starter Bundle Pricing ($4.99 vs $2.99)", status: "Completed", split: "Control / Variant", metric: "+32.1% Conversion" }
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Titles</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/${titleId}`} className="hover:text-gray-900 font-mono transition-colors">{titleId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-semibold">Experiments (A/B Testing)</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-purple-600" />
            LiveOps Experiments & A/B Testing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Split player cohorts, test game economy balancing variables, and monitor retention uplift in real time.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Active Experiments ({experiments.length})</h2>
          <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">Bayesian Significance Engine</span>
        </div>
        <div className="divide-y divide-gray-100">
          {experiments.map((exp, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-gray-900">{exp.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">{exp.status}</span>
                </div>
                <p className="text-xs font-mono text-gray-400">ID: {exp.id} • Split: {exp.split}</p>
              </div>
              <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                {exp.metric}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExperimentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading experiments...</div>}>
      <ExperimentsPageContent />
    </Suspense>
  );
}
