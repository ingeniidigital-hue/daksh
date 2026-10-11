"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Package,
  Upload,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Download,
  Smartphone,
  Monitor,
  Flame,
  Globe,
  Radio,
  Clock,
  Layers,
  FileCode,
  Zap
} from "lucide-react";

interface AssetBundle {
  bundleId: string;
  titleId: string;
  platform: string;
  channel: string;
  version: string;
  fileName: string;
  fileSizeBytes: number;
  sha256Checksum: string;
  downloadUrl: string;
  uploadedAt: number;
}

export default function OtaAssetHostingPage() {
  const params = useParams();
  const titleId = (params?.id as string) || "TITLE_DEMO";

  const [bundles, setBundles] = useState<AssetBundle[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState("android");
  const [selectedChannel, setSelectedChannel] = useState("prod");
  const [activeBundle, setActiveBundle] = useState<AssetBundle | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New bundle form
  const [newVersion, setNewVersion] = useState("v1.1.0");
  const [newFileName, setNewFileName] = useState("characters_patch.bundle");
  const [newPlatform, setNewPlatform] = useState("android");
  const [newChannel, setNewChannel] = useState("prod");

  // Range test bench
  const [testRangeStart, setTestRangeStart] = useState("0");
  const [testRangeEnd, setTestRangeEnd] = useState("1023");
  const [rangeTestResult, setRangeTestResult] = useState<string | null>(null);

  const fetchBundles = async () => {
    try {
      const res = await fetch(`/api/titles/${titleId}/ota/bundles`);
      if (res.ok) {
        const data = await res.json();
        setBundles(data.bundles || []);
      }
    } catch (e) {
      console.error("Failed to load bundles", e);
    }
  };

  const fetchActiveChannel = async () => {
    try {
      const res = await fetch(
        `/api/titles/${titleId}/ota/channels?platform=${selectedPlatform}&channel=${selectedChannel}`
      );
      if (res.ok) {
        const data = await res.json();
        setActiveBundle(data.activeBundle || null);
      }
    } catch (e) {
      console.error("Failed to load channel bundle", e);
    }
  };

  useEffect(() => {
    Promise.all([fetchBundles(), fetchActiveChannel()]).finally(() => setLoading(false));
  }, [titleId, selectedPlatform, selectedChannel]);

  const handleUploadSimulatedBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/titles/${titleId}/ota/bundles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: newPlatform,
          channel: newChannel,
          version: newVersion,
          fileName: newFileName,
          contentString: `Daksh Addressables Payload version: ${newVersion} - ${newFileName} generated at ${new Date().toISOString()}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMsg(`Uploaded and promoted bundle: ${data.bundle.fileName} (${data.bundle.version})`);
        fetchBundles();
        fetchActiveChannel();
      }
    } catch (err: any) {
      setStatusMsg(`Upload error: ${err.message}`);
    }
  };

  const handleRollback = async (targetBundleId: string) => {
    try {
      const res = await fetch(`/api/titles/${titleId}/ota/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatform,
          channel: selectedChannel,
          bundleId: targetBundleId
        })
      });

      if (res.ok) {
        setStatusMsg("Successfully rolled back channel bundle version!");
        fetchActiveChannel();
      }
    } catch (err: any) {
      setStatusMsg(`Rollback error: ${err.message}`);
    }
  };

  const handleTestByteRange = async () => {
    if (!activeBundle) return;
    try {
      const rangeHeader = `bytes=${testRangeStart}-${testRangeEnd}`;
      const res = await fetch(activeBundle.downloadUrl, {
        headers: { Range: rangeHeader }
      });

      const contentRange = res.headers.get("content-range");
      const sha = res.headers.get("x-asset-sha256");
      const bytes = await res.arrayBuffer();

      setRangeTestResult(
        `HTTP ${res.status} (${res.statusText})\n` +
        `Content-Range: ${contentRange}\n` +
        `Downloaded: ${bytes.byteLength} bytes\n` +
        `SHA-256 Verified: ${sha}`
      );
    } catch (err: any) {
      setRangeTestResult(`Range test failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Cloud OTA Asset Hosting
            </h1>
            <p className="text-sm text-gray-500">
              Global Edge CDN delivery for Unity Addressables (.bundle) and Unreal Chunks (.pak) with Byte-Range resume
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            SHA-256 Integrity Verified
          </span>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-800 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-blue-500 hover:text-blue-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Release Channels Active Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Live Active Channel Deployment
            </div>
            <div className="text-sm text-gray-300 mt-0.5">
              Client game launchers fetch delta bundles from this channel pointer
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPlatform}
              onChange={e => setSelectedPlatform(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
            >
              <option value="android" className="bg-gray-900">Android</option>
              <option value="ios" className="bg-gray-900">iOS</option>
              <option value="windows" className="bg-gray-900">Windows (PC)</option>
              <option value="webgl" className="bg-gray-900">HTML5 / WebGL</option>
            </select>

            <select
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white"
            >
              <option value="prod" className="bg-gray-900">Production (Global Live)</option>
              <option value="staging" className="bg-gray-900">Staging (QA)</option>
              <option value="dev" className="bg-gray-900">Development</option>
            </select>
          </div>
        </div>

        {activeBundle ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Active Version</div>
              <div className="text-xl font-bold text-white mt-1">{activeBundle.version}</div>
              <div className="text-[11px] text-gray-400 font-mono mt-0.5">{activeBundle.fileName}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">File Size</div>
              <div className="text-xl font-bold text-white mt-1">
                {(activeBundle.fileSizeBytes / 1024).toFixed(1)} KB
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">Byte-Range Enabled</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:col-span-2">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">SHA-256 Checksum</div>
              <div className="text-xs font-mono text-indigo-200 mt-1 break-all">
                {activeBundle.sha256Checksum}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Uploaded: {new Date(activeBundle.uploadedAt).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-gray-400">
            No active bundle deployed to {selectedPlatform} ({selectedChannel}). Upload a bundle below.
          </div>
        )}
      </div>

      {/* Main Grid: Upload Form, Byte-Range Tester, and Version History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" /> Upload / Register Asset Bundle
          </h3>

          <form onSubmit={handleUploadSimulatedBundle} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Platform</label>
              <select
                value={newPlatform}
                onChange={e => setNewPlatform(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
              >
                <option value="android">Android</option>
                <option value="ios">iOS</option>
                <option value="windows">Windows</option>
                <option value="webgl">WebGL</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Release Channel</label>
              <select
                value={newChannel}
                onChange={e => setNewChannel(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
              >
                <option value="prod">Production</option>
                <option value="staging">Staging</option>
                <option value="dev">Development</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Version String</label>
              <input
                type="text"
                value={newVersion}
                onChange={e => setNewVersion(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">File Name (.bundle / .pak)</label>
              <input
                type="text"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Publish & Promote Bundle
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Byte-Range Resume Test Bench & Bundle History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Byte-Range Resume Test Bench */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" /> HTTP Byte-Range Resume Test Bench
            </h3>
            <p className="text-xs text-gray-500">
              Verify HTTP 206 Partial Content slicing to ensure interrupted downloads resume seamlessly
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-gray-500 font-sans">Range: bytes=</span>
                <input
                  type="text"
                  value={testRangeStart}
                  onChange={e => setTestRangeStart(e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs text-center"
                />
                <span>-</span>
                <input
                  type="text"
                  value={testRangeEnd}
                  onChange={e => setTestRangeEnd(e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs text-center"
                />
              </div>

              <button
                onClick={handleTestByteRange}
                disabled={!activeBundle}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                Send Range Request
              </button>
            </div>

            {rangeTestResult && (
              <pre className="p-3 bg-gray-900 text-emerald-400 rounded-xl text-[11px] font-mono whitespace-pre-wrap">
                {rangeTestResult}
              </pre>
            )}
          </div>

          {/* Bundles Version History & 1-Click Rollback */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600" /> Bundle Version History & 1-Click Rollback ({bundles.length})
            </h3>

            {bundles.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No bundles registered. Use the upload form on the left.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold sticky top-0 bg-white">
                      <th className="py-2.5 px-3">Version</th>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3">Platform</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3 text-right">Size</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bundles.map(b => (
                      <tr key={b.bundleId} className="hover:bg-gray-50/50 transition">
                        <td className="py-2.5 px-3 font-bold text-gray-900 font-mono">
                          {b.version}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-700">
                          {b.fileName}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-gray-500 font-mono">
                          {b.platform}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                            {b.channel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-500 text-[11px]">
                          {(b.fileSizeBytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {activeBundle?.bundleId === b.bundleId ? (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRollback(b.bundleId)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 ml-auto"
                            >
                              <RotateCcw className="w-3 h-3" /> Rollback to this
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
