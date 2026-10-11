"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, DollarSign, Plus, Coins, CheckCircle2 } from "lucide-react";

function CurrencyPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [currencies, setCurrencies] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [deposit, setDeposit] = useState(100);

  const loadCurrencies = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/economy/currencies`);
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data.currencies || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (titleId) loadCurrencies();
  }, [titleId]);

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    try {
      const res = await fetch(`/api/titles/${titleId}/economy/currencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, initialDeposit: deposit })
      });
      if (res.ok) {
        setCode("");
        setName("");
        loadCurrencies();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            Virtual Currencies & Economy Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure title currencies (e.g. Gold, Gems, Energy), default onboarding grants, and recharge rates.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <Link href="/dashboard" className="text-blue-600 hover:underline">Titles</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-semibold">{titleId}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">Currencies</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" /> Create Currency
            </h2>
          </div>
          <form onSubmit={handleAddCurrency} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Currency Code (2-6 letters)</label>
              <input 
                type="text" 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase())} 
                placeholder="e.g. GOLD, GEMS, EN" 
                className="w-full text-xs font-mono px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Gold Coins" 
                className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">New Player Starting Deposit</label>
              <input 
                type="number" 
                value={deposit} 
                onChange={(e) => setDeposit(Number(e.target.value))} 
                className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Save Currency
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Active Currencies ({currencies.length})</h2>
            <span className="text-[11px] text-gray-500 font-mono">Postgres Storage Engine</span>
          </div>
          {currencies.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-xs">
              <Coins className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <div className="font-semibold text-gray-700">No Virtual Currencies Configured</div>
              <p className="text-gray-400 mt-0.5">Define soft currencies (Gold), hard currencies (Gems), or energy caps using the form.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {currencies.map((curr, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs">
                      {curr.code?.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{curr.name} ({curr.code})</h3>
                      <p className="text-gray-500 text-[11px]">Default Starting Grant: {curr.initialDeposit} {curr.code}</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 bg-gray-100 rounded font-mono text-gray-600 border border-gray-200">
                    Precision: Int32
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CurrencyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading currencies...</div>}>
      <CurrencyPageContent />
    </Suspense>
  );
}
