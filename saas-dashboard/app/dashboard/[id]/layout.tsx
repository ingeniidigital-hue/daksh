"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { 
  Users, UserX, Shield, 
  Settings, Database, CloudLightning, 
  ShoppingBag, DollarSign, Gift, 
  Swords, Server, Target, 
  UsersRound, Trophy, 
  Save, BarChart3, LineChart, Network, TrendingUp, Package,
  LayoutDashboard, Bell, Search, Sparkles, Cpu, CreditCard, Download
} from "lucide-react";
import AICommandMenu from "../../../components/AICommandMenu";
import EjectModal from "../../../components/EjectModal";

function TitleLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const id = params?.id as string;
  
  const [titleName, setTitleName] = useState("Loading...");
  const [isAIMenuOpen, setIsAIMenuOpen] = useState(false);
  const [isEjectModalOpen, setIsEjectModalOpen] = useState(false);
  const [operatingMode, setOperatingMode] = useState<"ai" | "manual">("ai");

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
    const saved = localStorage.getItem("daksh_titles");
    if (saved) {
      const titles = JSON.parse(saved);
      const found = titles.find((t: any) => t.id === id);
      if (found) setTitleName(found.name);
    }
  }, [id]);

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
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <nav className="bg-[#1C2026] text-white flex items-center justify-between px-4 h-14 shrink-0 sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg">
            D
          </div>
          <span className="font-semibold text-lg tracking-tight">Daksh</span>
          <div className="h-4 w-px bg-gray-600"></div>
          <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            All Titles
          </Link>
        </div>

        {/* Operating Mode Indicator & Switcher */}
        <div className="hidden lg:flex items-center bg-[#252A33] p-1 rounded-xl border border-gray-700/80 text-xs">
          <button
            onClick={() => {
              setOperatingMode("ai");
              setIsAIMenuOpen(true);
            }}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              operatingMode === "ai"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            AI-Driven Mode (Primary)
          </button>
          <button
            onClick={() => setOperatingMode("manual")}
            className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              operatingMode === "manual"
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            PlayFab Manual View
          </button>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* 1-Click Eject Button */}
          <button
            onClick={() => setIsEjectModalOpen(true)}
            className="flex items-center space-x-1.5 bg-[#252A33] hover:bg-amber-600/20 text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-500/30 hover:border-amber-500/60 transition-all shadow-sm"
            title="1-Click Eject: Download complete Helm v3 chart and PostgreSQL dump"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Eject Title</span>
          </button>

          {/* AI Command Menu Trigger */}
          <button
            onClick={() => setIsAIMenuOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all border border-blue-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span className="hidden sm:inline">AI Menu</span>
            <kbd className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-mono text-blue-200 ml-1">⌘K</kbd>
          </button>

          <div 
            onClick={() => setIsAIMenuOpen(true)}
            className="hidden md:flex items-center bg-[#2D333B] px-3 py-1.5 rounded-xl text-sm text-gray-300 border border-gray-600 cursor-pointer hover:border-gray-500 transition-colors"
          >
            <Search className="w-4 h-4 mr-2 text-gray-400" />
            <span className="opacity-60 text-xs">Prompt AI to create or search...</span>
          </div>

          <Bell className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer" />
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold border border-gray-500">
            A
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PlayFab-style Left Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden md:block shrink-0">
          
          <div className="p-4 border-b border-gray-100 mb-4">
            <h2 className="text-lg font-bold text-gray-900 truncate">{titleName}</h2>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                ID: {id}
              </span>
              <button 
                onClick={() => setIsAIMenuOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Prompt AI
              </button>
            </div>
            
            <div className="mt-2.5 px-2.5 py-1.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-[11px] text-blue-800">
              <span className="font-semibold">AI First Mode:</span>
              <span className="text-blue-600 font-medium">Zero-Click Active</span>
            </div>
          </div>

          <div className="px-3 pb-20">
            
            <SidebarSection title="Title Overview">
              <SidebarLink href={`/dashboard/${id}`} icon={LayoutDashboard} label="Dashboard" />
              <SidebarLink href={`/dashboard/${id}/title-data`} icon={Database} label="Title Data" />
            </SidebarSection>

            <SidebarSection title="Identity">
              <SidebarLink href={`/dashboard/${id}/players`} icon={Users} label="Players" />
              <SidebarLink href={`/dashboard/${id}/bans`} icon={UserX} label="IP Bans" />
              <SidebarLink href={`/dashboard/${id}/auth`} icon={Shield} label="Authentication" />
            </SidebarSection>

            <SidebarSection title="Live Ops">
              <SidebarLink href={`/dashboard/${id}/ota`} icon={Package} label="OTA Assets" />
              <SidebarLink href={`/dashboard/${id}/rules`} icon={CloudLightning} label="Automation Rules" />
              <SidebarLink href={`/dashboard/${id}/cloudscript`} icon={Database} label="Cloud Script" />
              <SidebarLink href={`/dashboard/${id}/experiments`} icon={Database} label="Experiments (A/B)" />
              <SidebarLink href={`/dashboard/${id}/scheduled`} icon={Settings} label="Scheduled Tasks" />
            </SidebarSection>

            <SidebarSection title="Economy & UGC">
              <SidebarLink href={`/dashboard/${id}/catalog`} icon={ShoppingBag} label="Catalog" />
              <SidebarLink href={`/dashboard/${id}/currency`} icon={DollarSign} label="Economy Settings" />
              <SidebarLink href={`/dashboard/${id}/ads`} icon={Gift} label="Rewarded Ads" />
            </SidebarSection>

            <SidebarSection title="Multiplayer">
              <SidebarLink href={`/dashboard/${id}/multiplayer`} icon={Swords} label="Turn-Based Engine" />
              <SidebarLink href={`/dashboard/${id}/servers`} icon={Server} label="Servers" />
              <SidebarLink href={`/dashboard/${id}/matchmaking`} icon={Swords} label="Matchmaking" />
              <SidebarLink href={`/dashboard/${id}/party`} icon={Target} label="Party" />
            </SidebarSection>

            <SidebarSection title="Community">
              <SidebarLink href={`/dashboard/${id}/groups`} icon={UsersRound} label="Groups" />
              <SidebarLink href={`/dashboard/${id}/leaderboards`} icon={Trophy} label="Leaderboards" />
            </SidebarSection>

            <SidebarSection title="Progression">
              <SidebarLink href={`/dashboard/${id}/saves`} icon={Save} label="Game Saves" />
              <SidebarLink href={`/dashboard/${id}/statistics`} icon={BarChart3} label="Statistics" />
            </SidebarSection>

            <SidebarSection title="Data & Analytics">
              <SidebarLink href={`/dashboard/${id}/analytics`} icon={TrendingUp} label="Executive Analytics" />
              <SidebarLink href={`/dashboard/${id}/events`} icon={LineChart} label="Events" />
              <SidebarLink href={`/dashboard/${id}/webhooks`} icon={Network} label="Webhooks" />
            </SidebarSection>

            <SidebarSection title="Cloud & Monetization">
              <SidebarLink href={`/dashboard/${id}/billing`} icon={CreditCard} label="Cloud Tiers & Billing" />
            </SidebarSection>

          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
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
