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
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Titles</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/${titleId}`} className="hover:text-gray-900 font-mono transition-colors">{titleId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-semibold">Virtual Currencies</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            Virtual Currencies & Economy Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure title currencies (e.g. Gold, Gems, Energy), default onboarding grants, and recharge rates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" /> Create Currency
          </h2>
          <form onSubmit={handleAddCurrency} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Currency Code (2-6 letters)</label>
              <input 
                type="text" 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase())} 
                placeholder="e.g. GOLD, GEMS, EN" 
                className="w-full text-xs font-mono px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">New Player Starting Deposit</label>
              <input 
                type="number" 
                value={deposit} 
                onChange={(e) => setDeposit(Number(e.target.value))} 
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Save Currency
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Active Currencies ({currencies.length})</h2>
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> PlayFab V2 Synced
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {currencies.map((curr, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                    {curr.code?.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">{curr.name} ({curr.code})</h3>
                    <p className="text-xs text-gray-400">Default Grant: {curr.initialDeposit} {curr.code}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-lg font-mono text-gray-600">
                  Precision: Int32
                </span>
              </div>
            ))}
          </div>
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
