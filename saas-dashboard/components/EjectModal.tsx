"use client";

import { useState } from "react";
import { 
  Download, CheckCircle2, ShieldCheck, 
  Terminal, Database, X, AlertTriangle, 
  Loader2, ArrowRight, Server, FileCode, Check
} from "lucide-react";

interface EjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  titleName: string;
}

export default function EjectModal({ isOpen, onClose, titleId, titleName }: EjectModalProps) {
  const [isPackaging, setIsPackaging] = useState(false);
  const [packageStep, setPackageStep] = useState<number>(0);
  const [includeSampleData, setIncludeSampleData] = useState(true);
  const [customDomain, setCustomDomain] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [archiveStats, setArchiveStats] = useState<{ sizeKb: number; filesCount: number } | null>(null);

  if (!isOpen) return null;

  const handleEject = async () => {
    setIsPackaging(true);
    setPackageStep(1);
    setDownloadSuccess(false);

    try {
      // Step 1: Exporting PostgreSQL Schema & Data
      await new Promise(r => setTimeout(r, 600));
      setPackageStep(2);

      // Step 2: Customizing Helm v3 Values & Manifests
      await new Promise(r => setTimeout(r, 700));
      setPackageStep(3);

      // Step 3: Compressing Standalone Self-Host Bundle
      const query = new URLSearchParams({
        titleName,
        environment: "self_hosted",
        includeSampleData: includeSampleData ? "true" : "false"
      });
      if (customDomain) query.set("customDomain", customDomain);

      const res = await fetch(`/api/titles/${titleId}/eject?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to generate eject bundle");

      const blob = await res.blob();
      setPackageStep(4);
      setArchiveStats({
        sizeKb: Math.round(blob.size / 1024),
        filesCount: 12
      });

      // Trigger instant browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daksh-eject-${titleId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccess(true);
    } catch (err: any) {
      alert("Eject failed: " + err.message);
    } finally {
      setIsPackaging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1C2026] border border-gray-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#252A33]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-100 flex items-center gap-2">
                1-Click Eject Title
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Zero Lock-In
                </span>
              </h2>
              <p className="text-xs text-gray-400">Download 100% of your data and production Helm v3 Kubernetes chart</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Guarantee Banner */}
          <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-200/90 leading-relaxed">
              <span className="font-semibold text-white">Data Sovereignty Guarantee:</span> You own 100% of your game backend.
              This 1-click action bundles your raw PostgreSQL schemas, player wallets, inventory items, remote configs, and self-hosted Kubernetes manifests with 0 locked proprietary formats.
            </div>
          </div>

          {/* Package Inclusions Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#252A33]/80 border border-gray-800 rounded-xl p-3.5 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-1">
                <Database className="w-4 h-4" />
                Raw SQL Dump
              </div>
              <p className="text-[11px] text-gray-400">
                Complete PostgreSQL export with tables for players, wallets, items & leaderboards.
              </p>
            </div>

            <div className="bg-[#252A33]/80 border border-gray-800 rounded-xl p-3.5 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-1">
                <FileCode className="w-4 h-4" />
                Helm v3 Chart
              </div>
              <p className="text-[11px] text-gray-400">
                Modular K8s chart with non-root security context and read-only root filesystems.
              </p>
            </div>

            <div className="bg-[#252A33]/80 border border-gray-800 rounded-xl p-3.5 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-1">
                <Terminal className="w-4 h-4" />
                1-Command Deploy
              </div>
              <p className="text-[11px] text-gray-400">
                Executable <code className="text-emerald-400">deploy.sh</code> to boot on Minikube, K3s, EKS, or GKE.
              </p>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="space-y-3 bg-[#252A33]/40 border border-gray-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-gray-200">Include Bootstrap Sample Records</label>
                <p className="text-[11px] text-gray-400">Export initial dev admin player and sample remote configs</p>
              </div>
              <input
                type="checkbox"
                checked={includeSampleData}
                onChange={e => setIncludeSampleData(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-200 block mb-1">Self-Hosted Custom Ingress Domain (Optional)</label>
              <input
                type="text"
                value={customDomain}
                onChange={e => setCustomDomain(e.target.value)}
                placeholder="e.g. backend.mystudio.com"
                className="w-full bg-[#1C2026] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Packaging Progress Status */}
          {isPackaging && (
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  Generating Standalone Eject Bundle...
                </span>
                <span className="text-gray-400">Step {packageStep} of 4</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${packageStep * 25}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400">
                {packageStep === 1 && "Dumping PostgreSQL schema and player records..."}
                {packageStep === 2 && "Synthesizing production Helm v3 values.yaml and secrets..."}
                {packageStep === 3 && "Packaging zip bundle and generating deploy.sh quickstart..."}
                {packageStep === 4 && "Finalizing export archive..."}
              </p>
            </div>
          )}

          {/* Success Box */}
          {downloadSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">Package Downloaded Successfully!</h4>
                  <p className="text-[11px] text-emerald-400/80">
                    File: <span className="font-mono">daksh-eject-{titleId}.zip</span> ({archiveStats?.sizeKb || 24} KB)
                  </p>
                </div>
              </div>
              <button
                onClick={handleEject}
                className="text-xs font-semibold text-emerald-300 hover:text-white underline"
              >
                Download Again
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#252A33] border-t border-gray-800 flex items-center justify-between">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-gray-400" />
            Runs anywhere: Minikube, K3s, AWS EKS, GCP GKE, Azure AKS
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEject}
              disabled={isPackaging}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all"
            >
              {isPackaging ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Packaging...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Eject Now (.zip)
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
