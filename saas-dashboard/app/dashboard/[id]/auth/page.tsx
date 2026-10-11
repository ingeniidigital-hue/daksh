"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ChevronRight, Shield, Key, Smartphone, Lock, CheckCircle2, 
  RefreshCw, AlertTriangle, Copy, Check, Sparkles, Terminal, Globe, UserCheck
} from "lucide-react";

function AuthenticationPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  // Simulator state
  const [deviceId, setDeviceId] = useState("hw_client_device_01");
  const [platform, setPlatform] = useState<"Android" | "iOS" | "Windows" | "WebGL">("Android");
  const [displayName, setDisplayName] = useState("Player_01");
  const [isSimulating, setIsSimulating] = useState(false);
  const [authResponse, setAuthResponse] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings state
  const [allowGuestLogin, setAllowGuestLogin] = useState(true);
  const [enforceDeviceBinding, setEnforceDeviceBinding] = useState(true);
  const [accessTokenTTL, setAccessTokenTTL] = useState(3600);
  const [refreshTokenTTL, setRefreshTokenTTL] = useState(30);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSimulateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/titles/${titleId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          clientPlatform: platform,
          displayName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAuthResponse(data);
      } else {
        setErrorMsg(data.error || "Authentication failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network request failed");
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Breadcrumb Header */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Titles</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/dashboard/${titleId}`} className="hover:text-gray-900 font-mono transition-colors">{titleId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-semibold">Authentication & Identity</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Authentication & Security Policies
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure zero-friction hardware device authentication, JWT token policies, and zero-trust anti-tamper enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Zero-Trust Enforced
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Key className="w-3.5 h-3.5 mr-1 text-blue-600" /> AES-256 Cached
          </span>
        </div>
      </div>

      {/* Main Grid: Policy Configuration & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Security Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Hardware Device Auth Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-gray-700" />
                  Hardware Device Authentication (Guest Login)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Enables frictionless anonymous login using device hardware UUIDs (<code className="font-mono bg-gray-100 px-1 rounded">SystemInfo.deviceUniqueIdentifier</code>).
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-gray-900">Allow Anonymous Guest Login</span>
                  <p className="text-xs text-gray-500">Allows players to onboard immediately without registration.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={allowGuestLogin} 
                  onChange={(e) => setAllowGuestLogin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-gray-900">Enforce Hardware Device Binding</span>
                  <p className="text-xs text-gray-500">Locks player account to initial hardware signature until explicit OAuth linking.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={enforceDeviceBinding} 
                  onChange={(e) => setEnforceDeviceBinding(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                />
              </label>
            </div>
          </div>

          {/* JWT Token Lifecycles */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-700" />
              Session & JWT Token Expiration Policy
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Access Token TTL (Seconds)</label>
                <input 
                  type="number" 
                  value={accessTokenTTL} 
                  onChange={(e) => setAccessTokenTTL(Number(e.target.value))}
                  className="w-full text-sm font-mono px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Default: 3600 (1 hour)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Refresh Token Lifetime (Days)</label>
                <input 
                  type="number" 
                  value={refreshTokenTTL} 
                  onChange={(e) => setRefreshTokenTTL(Number(e.target.value))}
                  className="w-full text-sm font-mono px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">Default: 30 days</span>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => {
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 2500);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" /> Saved Successfully!
                  </>
                ) : (
                  "Save Policy Changes"
                )}
              </button>
            </div>
          </div>

          {/* Third-Party Identity Providers */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-700" />
              Connected Identity Providers
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "Steamworks Ticket Auth", status: "Ready", icon: "🎮" },
                { name: "Sign in with Apple", status: "Ready", icon: "🍏" },
                { name: "Google Play Games Services", status: "Ready", icon: "▶️" },
                { name: "Custom OAuth2 / Epic Online", status: "Ready", icon: "⚡" },
              ].map((provider, i) => (
                <div key={i} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{provider.icon}</span>
                    <span className="text-xs font-semibold text-gray-800">{provider.name}</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {provider.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Live Device Auth Simulator & Token Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-600" />
                Live Device Login Simulator
              </h2>
              <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                POST /players
              </span>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Simulate an incoming Unity SDK <code className="bg-gray-100 px-1 rounded">DakshAuth.AuthenticateDeviceAsync()</code> call against the active title.
            </p>

            <form onSubmit={handleSimulateLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hardware Device ID</label>
                <input 
                  type="text" 
                  value={deviceId} 
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Platform</label>
                  <select 
                    value={platform} 
                    onChange={(e: any) => setPlatform(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                    <option value="Windows">Windows</option>
                    <option value="WebGL">WebGL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSimulating}
                className="w-full mt-2 py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow flex items-center justify-center gap-2"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5 text-blue-400" /> Execute Hardware Device Auth
                  </>
                )}
              </button>
            </form>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Authentication Outcome Preview */}
            {authResponse && (
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Authentication Successful
                  </span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                    HTTP 201 Created
                  </span>
                </div>

                <div className="bg-[#1C2026] text-gray-200 p-3 rounded-xl text-[11px] font-mono overflow-x-auto space-y-1">
                  <div><span className="text-gray-400">Player ID:</span> <span className="text-blue-400">{authResponse.player?.id}</span></div>
                  <div><span className="text-gray-400">Status:</span> <span className="text-emerald-400">{authResponse.player?.status}</span></div>
                  <div><span className="text-gray-400">Is New Player:</span> <span className="text-yellow-400">{String(authResponse.isNewPlayer)}</span></div>
                  <div><span className="text-gray-400">Expires In:</span> {authResponse.expiresIn}s</div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1 font-semibold">
                    <span>Generated JWT Bearer Token</span>
                    <button 
                      onClick={() => copyToClipboard(authResponse.token)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedToken ? "Copied" : "Copy Token"}
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-2 rounded-xl text-[10px] font-mono break-all text-gray-700">
                    {authResponse.token}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default function AuthenticationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading authentication console...</div>}>
      <AuthenticationPageContent />
    </Suspense>
  );
}
