"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Clock, Plus, CheckCircle2 } from "lucide-react";

function ScheduledTasksPageContent() {
  const params = useParams();
  const titleId = params?.id as string;

  const [tasks, setTasks] = useState<any[]>([]);

  const reloadTasks = () => {
    try {
      const saved = localStorage.getItem(`daksh_scheduled_${titleId}`) || localStorage.getItem(`daksh_tasks_${titleId}`);
      setTasks(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setTasks([]);
    }
  };

  useEffect(() => {
    reloadTasks();
    window.addEventListener("daksh_data_updated", reloadTasks);
    return () => window.removeEventListener("daksh_data_updated", reloadTasks);
  }, [titleId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskId, setTaskId] = useState("");
  const [cronExpr, setCronExpr] = useState("0 0 * * *");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !taskId) return;
    const updated = [...tasks, { id: taskId, name: taskName, cron: cronExpr, nextRun: "Configured", status: "Active" }];
    setTasks(updated);
    localStorage.setItem(`daksh_scheduled_${titleId}`, JSON.stringify(updated));
    setTaskName("");
    setTaskId("");
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Scheduled Tasks & LiveOps Cron Jobs
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Automate recurring backend maintenance, leaderboard prize drops, and season resets.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="text-gray-500">
            <Link href="/dashboard" className="text-blue-600 hover:underline">Titles</Link> / <span className="font-semibold text-gray-700">{titleId}</span> / Scheduled Tasks
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> New Task
          </button>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/75 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Configured Cron Jobs ({tasks.length})</h2>
          <span className="text-[11px] text-gray-500 font-mono">UTC Timezone</span>
        </div>
        {tasks.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-xs">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="font-semibold text-gray-700">No Scheduled Cron Tasks</div>
            <p className="text-gray-400 mt-0.5 mb-3">Schedule automated daily logins, weekly ranking distributions, or season rollouts.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium"
            >
              Add Scheduled Task
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task, idx) => (
              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{task.name}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{task.status}</span>
                  </div>
                  <p className="text-gray-400 font-mono text-[11px]">ID: {task.id} • Schedule: {task.cron} • Next Run: {task.nextRun}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-gray-200 p-6 max-w-md w-full shadow-lg">
            <h2 className="text-base font-bold text-gray-900 mb-1">Schedule New Task</h2>
            <p className="text-xs text-gray-500 mb-4">Define standard 5-part cron syntax for automated execution.</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Task ID</label>
                <input 
                  type="text" 
                  value={taskId} 
                  onChange={e => setTaskId(e.target.value)} 
                  placeholder="e.g. task_weekly_reset"
                  className="w-full text-xs font-mono px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Task Name</label>
                <input 
                  type="text" 
                  value={taskName} 
                  onChange={e => setTaskName(e.target.value)} 
                  placeholder="e.g. Weekly Season Reward Rollout"
                  className="w-full text-xs px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cron Expression (UTC)</label>
                <input 
                  type="text" 
                  value={cronExpr} 
                  onChange={e => setCronExpr(e.target.value)} 
                  placeholder="0 0 * * 0"
                  className="w-full text-xs font-mono px-3 py-1.5 border border-gray-300 rounded focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-xs font-medium"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScheduledTasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading scheduled tasks...</div>}>
      <ScheduledTasksPageContent />
    </Suspense>
  );
}
