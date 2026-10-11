"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  CheckSquare, Clock, AlertCircle, CheckCircle2, 
  Search, Filter, Sparkles, Copy, ExternalLink, 
  Layers, ArrowRight, ShieldCheck, Terminal, Download,
  Cloud, Gamepad2, Coins, BarChart3, Package, CreditCard
} from "lucide-react";

interface MasterStory {
  id: string;
  title: string;
  category: "core" | "multiplayer" | "economy" | "analytics" | "sdk" | "payments" | "cloud";
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  priority: "critical" | "high" | "medium";
  user_story: string;
  deliverables: string[];
  security_compliance: string[];
  acceptance_criteria: string[];
  verification_gate: string;
  assigned_agent: string;
  notes?: string;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string; badge: string }> = {
  cloud: { label: "Cloud GaaS", icon: Cloud, color: "text-cyan-600", badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  multiplayer: { label: "Netcode", icon: Gamepad2, color: "text-indigo-600", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  economy: { label: "Economy & Ops", icon: Coins, color: "text-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  analytics: { label: "Analytics", icon: BarChart3, color: "text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  sdk: { label: "Client SDKs", icon: Package, color: "text-purple-600", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  payments: { label: "Monetization", icon: CreditCard, color: "text-pink-600", badge: "bg-pink-50 text-pink-700 border-pink-200" },
  core: { label: "Core Stack", icon: Layers, color: "text-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200" }
};

const COLUMNS: { id: MasterStory["status"]; title: string; color: string; badge: string }[] = [
  { id: "backlog", title: "Backlog", color: "border-gray-200", badge: "bg-gray-100 text-gray-700" },
  { id: "todo", title: "To Do", color: "border-blue-200", badge: "bg-blue-50 text-blue-700" },
  { id: "in_progress", title: "In Progress", color: "border-amber-200", badge: "bg-amber-50 text-amber-700" },
  { id: "review", title: "Review & TDD", color: "border-purple-200", badge: "bg-purple-50 text-purple-700" },
  { id: "done", title: "Done & Verified", color: "border-emerald-200", badge: "bg-emerald-50 text-emerald-700" }
];

export default function TasksPage() {
  const params = useParams();
  const id = params?.id as string;

  const [tasks, setTasks] = useState<MasterStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeModalTask, setActiveModalTask] = useState<MasterStory | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data?.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: MasterStory["status"]) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
    } catch (err) {
      console.error("Error updating task status:", err);
      fetchTasks();
    }
  };

  const copyForAI = (task: MasterStory) => {
    const promptText = `### Task Specification: ${task.id} - ${task.title}
**Category**: ${task.category.toUpperCase()} | **Priority**: ${task.priority.toUpperCase()}

#### User Story:
${task.user_story}

#### Deliverables:
${task.deliverables.map(d => `- ${d}`).join("\n")}

#### Security & Compliance:
${task.security_compliance.map(s => `- ${s}`).join("\n")}

#### Acceptance Criteria:
${task.acceptance_criteria.map(a => `- ${a}`).join("\n")}

#### High-Level Verification Gate:
\`${task.verification_gate}\`
`;
    navigator.clipboard.writeText(promptText);
    setCopiedId(task.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const exportForPlane = () => {
    const jsonStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daksh_master_stories_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesCategory = selectedCategory === "all" || task.category === selectedCategory;
    const matchesSearch = 
      task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.user_story.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">

      {/* TOP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="w-7 h-7 text-blue-600" />
              AI Project Management Board
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Open Source &amp; AI-Friendly
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time tracking of all 17 End-to-End Master Stories. Fully compatible with Plane, Planka, or direct AI API calls.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportForPlane}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            Export JSON (Plane / Planka)
          </button>

          <a
            href="/reports/daksh_roadmap_presentation.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 flex items-center gap-1.5 shadow-sm transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Pitch Deck Presentation
          </a>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {COLUMNS.map(col => {
          const count = tasks.filter(t => t.status === col.id).length;
          return (
            <div key={col.id} className="bg-white border border-gray-200/80 rounded-xl p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">{col.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {count}
                </span>
              </div>
              <div className="text-xl font-black text-gray-900 mt-1">{count} <span className="text-xs font-normal text-gray-400">/ 17</span></div>
            </div>
          );
        })}
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === "all" 
                ? "bg-gray-900 text-white" 
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Stories (17)
          </button>
          {Object.entries(CATEGORY_MAP).map(([catKey, config]) => {
            const Icon = config.icon;
            const count = tasks.filter(t => t.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  selectedCategory === catKey
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
                <span className="opacity-75 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search story, criteria..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-gray-50/70 border border-gray-200 rounded-2xl p-3 flex flex-col min-h-[500px]">
              
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200">
                <span className="font-bold text-xs text-gray-800 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    col.id === 'done' ? 'bg-emerald-500' :
                    col.id === 'in_progress' ? 'bg-amber-500' :
                    col.id === 'review' ? 'bg-purple-500' : 'bg-blue-500'
                  }`} />
                  {col.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {colTasks.map(task => {
                  const catConfig = CATEGORY_MAP[task.category] || CATEGORY_MAP.core;
                  const Icon = catConfig.icon;
                  return (
                    <div
                      key={task.id}
                      className="bg-white border border-gray-200/90 rounded-xl p-3 shadow-xs hover:shadow-md hover:border-gray-300 transition group flex flex-col justify-between"
                    >
                      <div>
                        {/* Story ID and Badge */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] font-black text-gray-900">
                            {task.id}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${catConfig.badge} flex items-center gap-1`}>
                            <Icon className="w-2.5 h-2.5" />
                            {catConfig.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 
                          onClick={() => setActiveModalTask(task)}
                          className="font-bold text-xs text-gray-900 group-hover:text-blue-600 transition cursor-pointer line-clamp-2"
                        >
                          {task.title}
                        </h4>

                        {/* User Story excerpt */}
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                          {task.user_story}
                        </p>
                      </div>

                      {/* Verification Gate & Quick Actions */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-1 text-[11px]">
                        <button
                          onClick={() => copyForAI(task)}
                          title="Copy Prompt for AI Agent"
                          className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-100 flex items-center gap-1 font-mono text-[10px]"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedId === task.id ? "Copied!" : "Prompt"}
                        </button>

                        {/* Move Status Dropdown */}
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as MasterStory["status"])}
                          className="text-[10px] bg-gray-50 border border-gray-200 text-gray-700 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>

                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="h-28 flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    No stories in this stage
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* OPEN-SOURCE PM RUNNER GUIDE */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-900 text-white rounded-2xl p-6 border border-gray-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-sm text-white">Self-Hosted Open Source Project Management (Plane &amp; Planka)</h3>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-3xl">
              Prefer a standalone external PM board? We include pre-configured Docker Compose stacks for <strong>Plane</strong> (the modern Linear/Jira alternative) and <strong>Planka</strong> in <code>deploy/pm/</code>, with a 1-command sync script for AI agents.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <code className="text-[11px] font-mono bg-black/60 px-3 py-1.5 rounded-lg border border-gray-700 text-cyan-300">
              docker compose -f deploy/pm/docker-compose.planka.yml up -d
            </code>
          </div>
        </div>
      </div>

      {/* TASK DETAIL MODAL */}
      {activeModalTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-blue-600">{activeModalTask.id}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                    {activeModalTask.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-1">{activeModalTask.title}</h2>
              </div>
              <button 
                onClick={() => setActiveModalTask(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              
              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[10px] text-gray-400 mb-1">User Story</h4>
                <p className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-800 leading-relaxed font-medium">
                  {activeModalTask.user_story}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[10px] text-gray-400 mb-1">Deliverables</h4>
                <ul className="space-y-1 list-disc pl-4 text-gray-700">
                  {activeModalTask.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[10px] text-gray-400 mb-1">Security &amp; Compliance</h4>
                <ul className="space-y-1 list-disc pl-4 text-gray-700">
                  {activeModalTask.security_compliance.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[10px] text-gray-400 mb-1">Acceptance Criteria</h4>
                <ul className="space-y-1 list-disc pl-4 text-gray-700">
                  {activeModalTask.acceptance_criteria.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[10px] text-gray-400 mb-1">Verification Gate</h4>
                <div className="font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {activeModalTask.verification_gate}
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => copyForAI(activeModalTask)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedId === activeModalTask.id ? "Copied Prompt!" : "Copy Prompt for AI"}
              </button>

              <button
                onClick={() => setActiveModalTask(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
