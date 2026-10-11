"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Edit, Save, Database, Code, Check } from "lucide-react";

interface TitleDataEntry {
  key: string;
  value: string;
  isJson: boolean;
  lastUpdated: string;
}

export default function TitleDataPage() {
  const params = useParams();
  const titleId = params?.id as string;

  const [titleData, setTitleData] = useState<TitleDataEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal State
  const [newEntry, setNewEntry] = useState<TitleDataEntry>({
    key: "",
    value: "",
    isJson: false,
    lastUpdated: new Date().toISOString()
  });

  const [isEditing, setIsEditing] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!titleId) return;
    const saved = localStorage.getItem(`title_data_${titleId}`);
    if (saved) {
      setTitleData(JSON.parse(saved));
    }
  }, [titleId]);

  const validateJson = (val: string) => {
    if (!val) return true;
    try {
      JSON.parse(val);
      setJsonError(null);
      return true;
    } catch (e: any) {
      setJsonError(e.message);
      return false;
    }
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.key || !newEntry.value) return;
    
    if (newEntry.isJson && !validateJson(newEntry.value)) {
      return; // Stop if JSON is invalid
    }

    const updatedEntry = { ...newEntry, lastUpdated: new Date().toISOString() };
    
    let updated;
    if (isEditing) {
      updated = titleData.map(t => t.key === updatedEntry.key ? updatedEntry : t);
    } else {
      // Check for duplicates
      if (titleData.some(t => t.key === updatedEntry.key)) {
        alert("A Title Data entry with this key already exists!");
        return;
      }
      updated = [...titleData, updatedEntry];
    }
    
    setTitleData(updated);
    localStorage.setItem(`title_data_${titleId}`, JSON.stringify(updated));
    
    setNewEntry({ key: "", value: "", isJson: false, lastUpdated: new Date().toISOString() });
    setIsModalOpen(false);
    setIsEditing(false);
    setJsonError(null);
  };

  const deleteEntry = (key: string) => {
    const updated = titleData.filter(t => t.key !== key);
    setTitleData(updated);
    localStorage.setItem(`title_data_${titleId}`, JSON.stringify(updated));
  };

  const editEntry = (entry: TitleDataEntry) => {
    setNewEntry(entry);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openNewEntryModal = () => {
    setNewEntry({ key: "", value: "", isJson: false, lastUpdated: new Date().toISOString() });
    setIsEditing(false);
    setJsonError(null);
    setIsModalOpen(true);
  };

  const handleDeployToNakama = async () => {
    setIsSaving(true);
    // Simulate API call to Nakama storage
    setTimeout(() => {
      setIsSaving(false);
      alert("Successfully deployed Title Data to Nakama Storage Engine!");
    }, 800);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatValue = (val: string, isJson: boolean) => {
    if (!isJson) return val;
    try {
      // Pretty print JSON for display if possible, but keep it truncated
      return val;
    } catch {
      return val;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Title Data (Remote Config)</h1>
          <p className="text-gray-500 text-sm">Store global game configuration data as key-value pairs to update your game over-the-air.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={openNewEntryModal}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> 
            New Key
          </button>
          <button 
            onClick={handleDeployToNakama}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" /> 
            {isSaving ? "Deploying..." : "Deploy to Nakama"}
          </button>
        </div>
      </div>

      {titleData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Title Data found</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Store configuration variables like "Boss_Health" or "Current_Season" here so your client can fetch them securely on startup.</p>
          <button onClick={openNewEntryModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add First Key
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">Key</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">Value</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {titleData.map((data) => (
                <tr key={data.key} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <span className="font-mono text-sm font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                        {data.key}
                      </span>
                      {data.isJson && <span title="JSON Format"><Code className="w-3.5 h-3.5 text-indigo-500 ml-2" /></span>}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 font-mono uppercase">
                      Updated: {new Date(data.lastUpdated).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="relative">
                      <pre className={`text-xs text-gray-600 font-mono p-3 rounded-lg overflow-x-auto max-w-xl max-h-32 overflow-y-auto ${data.isJson ? 'bg-indigo-50/50 border border-indigo-100' : 'bg-[#F5F5F7] border border-gray-200'}`}>
                        {formatValue(data.value, data.isJson)}
                      </pre>
                      <button 
                        onClick={() => copyToClipboard(data.value, data.key)}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-md border border-gray-200 text-gray-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy Value"
                      >
                        {copiedKey === data.key ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Code className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => editEntry(data)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteEntry(data.key)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
              <Database className="w-6 h-6 mr-3 text-indigo-600" />
              {isEditing ? "Edit Title Data" : "New Title Data Entry"}
            </h2>
            
            <form onSubmit={handleSaveEntry} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Key</label>
                <input 
                  type="text" 
                  required 
                  disabled={isEditing}
                  value={newEntry.key} 
                  onChange={e => setNewEntry({...newEntry, key: e.target.value.replace(/\s+/g, '_')})} 
                  placeholder="e.g. Current_Season_Config" 
                  className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-mono text-sm disabled:opacity-60 disabled:cursor-not-allowed" 
                />
                {!isEditing && <p className="text-xs text-gray-400 mt-1">Keys must be unique and cannot contain spaces.</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Value</label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={newEntry.isJson}
                      onChange={(e) => {
                        setNewEntry({...newEntry, isJson: e.target.checked});
                        if (!e.target.checked) setJsonError(null);
                      }}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                    <span className="ml-2 text-xs font-bold text-gray-500">Format as JSON</span>
                  </label>
                </div>
                
                <textarea 
                  required 
                  rows={8}
                  value={newEntry.value} 
                  onChange={e => {
                    setNewEntry({...newEntry, value: e.target.value});
                    if (newEntry.isJson) validateJson(e.target.value);
                  }} 
                  placeholder={newEntry.isJson ? '{\n  "season": 3,\n  "multiplier": 1.5\n}' : "Enter string or numeric value..."} 
                  className={`w-full bg-[#F5F5F7] border ${jsonError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'} rounded-xl px-4 py-3 outline-none font-mono text-sm`} 
                />
                {jsonError && (
                  <p className="text-xs text-red-500 font-bold mt-1">Invalid JSON: {jsonError}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={newEntry.isJson && !!jsonError} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">
                  {isEditing ? "Update Entry" : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
