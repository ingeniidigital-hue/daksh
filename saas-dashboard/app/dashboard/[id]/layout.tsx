"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { 
  Users, UserX, Shield, 
  Settings, Database, CloudLightning, 
  ShoppingBag, DollarSign, Gift, 
  Swords, Server, Target, 
  UsersRound, Trophy, 
  Save, BarChart3, LineChart, Network, TrendingUp, Package,
  LayoutDashboard, Bell, Search, Sparkles, Cpu, CreditCard, Download, Activity,
  Gamepad2, Sliders
} from "lucide-react";
import AICommandMenu from "../../../components/AICommandMenu";
import EjectModal from "../../../components/EjectModal";
import ModeSwitcher from "../../../components/ModeSwitcher";
import AIOrchestratorConsole from "../../../components/AIOrchestratorConsole";
import { useOperatingMode } from "../../../context/OperatingModeContext";

function TitleLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const id = params?.id as string;
  const [titleName, setTitleName] = useState(() => {
    if (typeof window !== "undefined" && id) {
      try {
        const saved = localStorage.getItem("daksh_titles");
        if (saved) {
          const titles = JSON.parse(saved);
          const found = titles.find((t: any) => t.id === id);
          if (found) return found.name;
        }
      } catch (e) {}
    }
    return id ? (id.replace(/TITLE_/g, "").replace(/_/g, " ")) : "Game Title";
  });
  const [isAIMenuOpen, setIsAIMenuOpen] = useState(false);
  const [isEjectModalOpen, setIsEjectModalOpen] = useState(false);
  const [showManualInspector, setShowManualInspector] = useState(false);
  const { mode } = useOperatingMode();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsAIMenuOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!id) return;
    if (id === "YCSLW" || id === "test1" || id === "TITLE_CYBERPUNK" || id === "TITLE_MYTHIC") {
      router.replace("/dashboard");
      return;
    }
    const saved = localStorage.getItem("daksh_titles");
    if (saved) {
      try {
        const titles = JSON.parse(saved);
        const found = titles.find((t: any) => t.id === id);
        if (found) {
          setTitleName(found.name);
          return;
        } else {
          router.replace("/dashboard");
          return;
        }
      } catch (e) {
        router.replace("/dashboard");
        return;
      }
    } else {
      router.replace("/dashboard");
      return;
    }
  }, [id, router]);

  const SidebarLink = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const isActive = pathname === href || pathname?.startsWith(href + "/");
    return (
      <Link 
        href={href} 
        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isActive 
            ? "bg-blue-50 text-blue-700" 
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Icon className={`w-4 h-4 mr-3 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
        {label}
      </Link>
    );
  };

  const SidebarSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{title}</h3>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-white flex flex-col font-sans text-gray-800 overflow-hidden">
      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* AdminLTE Dark Sidebar - Only visible in manual mode or when inspector is toggled */}
        {(mode === "manual" || showManualInspector) && (
          <aside className="w-60 bg-[#1e293b] text-gray-300 border-r border-slate-800 overflow-y-auto hidden md:block shrink-0 shadow-sm">
            
            {/* Active Title Header */}
            <div className="p-3.5 border-b border-slate-700/80 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Title</span>
                <span className="text-[10px] font-mono bg-blue-900/80 text-blue-200 border border-blue-700/50 px-1.5 py-0.2 rounded">
                  {id}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-white truncate mt-1">{titleName}</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Production Mode</span>
              </div>
            </div>

            {/* Sidebar Menu Navigation */}
            <div className="px-2 py-3 pb-24 space-y-5 text-xs">
              
              <SidebarSection title="General">
                <SidebarLink href={`/dashboard/${id}`} icon={LayoutDashboard} label="Overview" />
                <SidebarLink href={`/dashboard/${id}/analytics`} icon={TrendingUp} label="Executive Analytics" />
                <SidebarLink href={`/dashboard/${id}/stress`} icon={Activity} label="CCU Load & Health" />
              </SidebarSection>

              <SidebarSection title="Players & Identity">
                <SidebarLink href={`/dashboard/${id}/players`} icon={Users} label="Players Directory" />
                <SidebarLink href={`/dashboard/${id}/auth`} icon={Shield} label="Authentication & Keys" />
                <SidebarLink href={`/dashboard/${id}/bans`} icon={UserX} label="IP Bans & Anti-Cheat" />
                <SidebarLink href={`/dashboard/${id}/saves`} icon={Save} label="Cloud Saves" />
              </SidebarSection>

              <SidebarSection title="Economy & LiveOps">
                <SidebarLink href={`/dashboard/${id}/catalog`} icon={ShoppingBag} label="Catalog & Stores" />
                <SidebarLink href={`/dashboard/${id}/currency`} icon={DollarSign} label="Virtual Currencies" />
                <SidebarLink href={`/dashboard/${id}/title-data`} icon={Database} label="Remote Config" />
                <SidebarLink href={`/dashboard/${id}/ads`} icon={Gift} label="Rewarded Ads" />
                <SidebarLink href={`/dashboard/${id}/experiments`} icon={Database} label="A/B Experiments" />
                <SidebarLink href={`/dashboard/${id}/scheduled`} icon={Settings} label="Scheduled Cron Tasks" />
              </SidebarSection>

              <SidebarSection title="Multiplayer">
                <SidebarLink href={`/dashboard/${id}/matchmaking`} icon={Swords} label="Matchmaking & X-Ray" />
                <SidebarLink href={`/dashboard/${id}/servers`} icon={Server} label="Agones Server Fleet" />
                <SidebarLink href={`/dashboard/${id}/multiplayer`} icon={Swords} label="Turn-Based Engine" />
                <SidebarLink href={`/dashboard/${id}/party`} icon={Target} label="Parties & Lobbies" />
                <SidebarLink href={`/dashboard/${id}/groups`} icon={UsersRound} label="Guilds & Clans" />
                <SidebarLink href={`/dashboard/${id}/leaderboards`} icon={Trophy} label="Leaderboards" />
              </SidebarSection>

              <SidebarSection title="Infrastructure & Setup">
                <SidebarLink href={`/dashboard/${id}/ota`} icon={Package} label="Cloud OTA Assets" />
                <SidebarLink href={`/dashboard/${id}/statistics`} icon={BarChart3} label="Progression Statistics" />
                <SidebarLink href={`/dashboard/${id}/rules`} icon={CloudLightning} label="Automation Rules" />
                <SidebarLink href={`/dashboard/${id}/cloudscript`} icon={Database} label="CloudScript Handlers" />
                <SidebarLink href={`/dashboard/${id}/events`} icon={LineChart} label="Telemetry Logs" />
                <SidebarLink href={`/dashboard/${id}/webhooks`} icon={Network} label="Outbound Webhooks" />
                <SidebarLink href={`/dashboard/${id}/billing`} icon={CreditCard} label="Billing & Quotas" />
              </SidebarSection>

            </div>
          </aside>
        )}

        {/* Clean AI Workspace / Content Area */}
        {mode === "ai" ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            <AIOrchestratorConsole 
              titleId={id} 
              titleName={titleName} 
              showInspectorToggle={true}
              onToggleInspector={() => setShowManualInspector(prev => !prev)}
              isInspectorOpen={showManualInspector}
            />
            {showManualInspector && (
              <div className="h-1/2 border-t-2 border-gray-300 bg-[#f4f6f9] p-6 overflow-y-auto animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="font-bold text-xs uppercase tracking-wider text-gray-700">Raw Database & Metagame Tables Inspector</span>
                  </div>
                  <button onClick={() => setShowManualInspector(false)} className="text-xs text-gray-500 hover:text-gray-900 font-medium">✕ Hide Inspector</button>
                </div>
                {children}
              </div>
            )}
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto bg-[#f4f6f9]">
            {children}
          </main>
        )}
      </div>

      {/* Global AI Command Menu */}
      <AICommandMenu 
        isOpen={isAIMenuOpen}
        onClose={() => setIsAIMenuOpen(false)}
        titleId={id}
        titleName={titleName}
      />

      {/* 1-Click Eject Modal */}
      <EjectModal
        isOpen={isEjectModalOpen}
        onClose={() => setIsEjectModalOpen(false)}
        titleId={id}
        titleName={titleName}
      />
    </div>
  );
}

export default function TitleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">Loading...</div>}>
      <TitleLayoutContent>{children}</TitleLayoutContent>
    </Suspense>
  );
}
