"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { 
  CreditCard, Check, Zap, Globe, Shield, Sparkles, AlertCircle, 
  ArrowRight, ExternalLink, IndianRupee, DollarSign, RefreshCw 
} from "lucide-react";

export default function BillingPage() {
  const params = useParams();
  const titleId = params.id as string;

  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "studio">("pro");
  const [loading, setLoading] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<any>(null);

  const handleCheckout = async (planId: "pro" | "studio") => {
    setLoading(true);
    setCheckoutStatus(null);

    try {
      const preferredGateway = currency === "INR" ? "razorpay" : "paddle";
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, titleId, preferredGateway })
      });

      const data = await res.json();
      setCheckoutStatus(data);
    } catch (err: any) {
      setCheckoutStatus({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Plan: Local-First Free ($0 Forever)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Cloud Tiers & Global Super-Regions
          </h1>
          <p className="text-sm text-slate-400">
            Local development is free forever. Upgrade only when you want Daksh to manage and scale your game servers globally.
          </p>
        </div>

        {/* CURRENCY & GATEWAY SELECTOR */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 self-start md:self-auto">
          <button
            onClick={() => setCurrency("INR")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              currency === "INR"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            India (Razorpay / UPI)
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              currency === "USD"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Global (Paddle MoR)
          </button>
        </div>
      </div>

      {/* CHECKOUT NOTIFICATION STATUS */}
      {checkoutStatus && (
        <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${
          checkoutStatus.error 
            ? "bg-rose-950/40 border-rose-800 text-rose-300"
            : "bg-indigo-950/40 border-indigo-700 text-indigo-200"
        }`}>
          <Check className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">
              {checkoutStatus.gateway === "razorpay" 
                ? "Razorpay (India UPI / RuPay) Session Initialized" 
                : "Paddle (Global Merchant of Record) Session Initialized"}
            </p>
            <p className="text-xs opacity-90 mt-1">
              Gateway: <span className="font-mono text-indigo-300">{checkoutStatus.gateway}</span> | 
              Amount: <span className="font-mono text-indigo-300">{currency === "INR" ? "₹" : "$"}{checkoutStatus.amount}</span> | 
              Mode: <span className="font-mono text-indigo-300">{checkoutStatus.mode || "live"}</span>
            </p>
            {checkoutStatus.checkoutUrl && (
              <a
                href={checkoutStatus.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded mt-3 transition"
              >
                Proceed to Paddle Checkout <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* PRICING CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LOCAL FREE */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Local Development</div>
            <h3 className="text-xl font-bold text-slate-100">Local-First Free</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Complete backend engine running locally on your laptop.</p>
            <div className="text-3xl font-extrabold text-slate-100 mb-6">
              $0 <span className="text-xs font-normal text-slate-500">/ forever</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Containerized Nakama + PostgreSQL
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> AI Command Menu (Cmd+K)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> PlayFab Economy V2 Parity
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Unity C# SDK (UPM)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> The Famous Eject Button (1-Click)
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800">
            <span className="block text-center w-full py-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Current Environment
            </span>
          </div>
        </div>

        {/* PRO CLOUD */}
        <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900 border-2 border-indigo-500/80 rounded-xl p-6 flex flex-col justify-between relative shadow-xl shadow-indigo-950/20">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
            Most Popular
          </div>

          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Cloud Hosted</div>
            <h3 className="text-xl font-bold text-slate-100">Indie Pro Cloud</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Production multiplayer servers managed across 2 Super-Regions.</p>
            <div className="text-3xl font-extrabold text-slate-100 mb-6">
              {currency === "INR" ? "₹9,999" : "$149"}
              <span className="text-xs font-normal text-slate-500"> / month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-400" /> <strong>2 Super-Regions</strong> (Auto-failover)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-400" /> Up to <strong>10,000 CCU</strong> included
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-400" /> Turn-Based & Real-Time Relay Netcode
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-400" /> Managed Multi-AZ PostgreSQL
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-400" /> Automated Daily Backups
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800">
            <button
              onClick={() => handleCheckout("pro")}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Deploy to Pro Cloud"}
            </button>
          </div>
        </div>

        {/* STUDIO CLOUD */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">High Concurrency</div>
            <h3 className="text-xl font-bold text-slate-100">Studio Scale</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Worldwide Anycast netcode for competitive cross-platform titles.</p>
            <div className="text-3xl font-extrabold text-slate-100 mb-6">
              {currency === "INR" ? "₹29,999" : "$499"}
              <span className="text-xs font-normal text-slate-500"> / month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400" /> <strong>All 5 Global Super-Regions</strong>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400" /> Up to <strong>50,000 CCU</strong> included
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400" /> Agones Dedicated Game Servers (DGS)
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400" /> AccelByte Matchmaking X-Ray Portal
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400" /> ClickHouse OLAP Analytics Ingestion
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800">
            <button
              onClick={() => handleCheckout("studio")}
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Deploy to Studio Cloud"}
            </button>
          </div>
        </div>

      </div>

      {/* PAYMENT GATEWAY TRUST FOOTER */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <div>
            <span className="font-semibold text-slate-200">Domestic & International Billing Guaranteed:</span>
            <span className="ml-1">UPI, RuPay, and Netbanking powered by <strong>Razorpay India</strong>. Global Cards, PayPal, and international tax compliance powered by <strong>Paddle (Merchant of Record)</strong>.</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 whitespace-nowrap">
          Cancel anytime. Zero lock-in.
        </div>
      </div>
    </div>
  );
}
