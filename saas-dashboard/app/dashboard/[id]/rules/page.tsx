"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Edit, Save, Play, Power, AlertCircle, Zap } from "lucide-react";

interface Action {
  type: "GrantItem" | "GrantCurrency" | "ExecuteCloudScript" | "BanUser";
  payload?: string;
  itemId?: string;
  amount?: number;
}

interface Condition {
  field: string;
  operator: "Equals" | "GreaterThan" | "LessThan" | "NotEquals";
  value: string;
}

interface Rule {
  id: string;
  name: string;
  isActive: boolean;
  triggerEvent: string;
  conditions: Condition[];
  actions: Action[];
}

export default function RulesPage() {
  const params = useParams();
  const titleId = params?.id as string;

  const [rules, setRules] = useState<Rule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Catalog References
  const [items, setItems] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [lootboxes, setLootboxes] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  // Modal State
  const [newRule, setNewRule] = useState<Rule>({
    id: "",
    name: "",
    isActive: true,
    triggerEvent: "com.playfab.player_added_title",
    conditions: [],
    actions: []
  });

  const [newAction, setNewAction] = useState<Action>({ type: "GrantItem", itemId: "", amount: 100, payload: "" });

  const triggerEvents = [
    { value: "com.playfab.player_added_title", label: "Player Created Account" },
    { value: "com.playfab.player_logged_in", label: "Player Logged In" },
    { value: "com.playfab.player_statistic_changed", label: "Statistic Changed" },
    { value: "custom.game.level_completed", label: "Custom Event: Level Completed" }
  ];

  useEffect(() => {
    if (!titleId) return;
    const savedRules = localStorage.getItem(`liveops_rules_${titleId}`);
    if (savedRules) setRules(JSON.parse(savedRules));
    
    // Load catalog items for dropdowns
    const loadCat = (key: string, setter: any) => {
      const data = localStorage.getItem(`catalog_${key}_${titleId}`);
      if (data) setter(JSON.parse(data));
    };
    loadCat("items", setItems);
    loadCat("curr", setCurrencies);
    loadCat("lootboxes", setLootboxes);
    loadCat("bundles", setBundles);
    loadCat("subs", setSubscriptions);
  }, [titleId]);

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.triggerEvent || newRule.actions.length === 0) return;
    
    const id = newRule.id || `rule_${Date.now()}`;
    const updated = [...rules.filter(r => r.id !== newRule.id), { ...newRule, id }];
    setRules(updated);
    localStorage.setItem(`liveops_rules_${titleId}`, JSON.stringify(updated));
    
    setNewRule({ id: "", name: "", isActive: true, triggerEvent: "com.playfab.player_added_title", conditions: [], actions: [] });
    setIsModalOpen(false);
  };

  const handleAddAction = () => {
    if (newAction.type === 'GrantItem' && !newAction.itemId) return;
    if (newAction.type === 'GrantCurrency' && !newAction.itemId) return;
    if (newAction.type === 'ExecuteCloudScript' && !newAction.payload) return;
    
    setNewRule({
      ...newRule,
      actions: [...newRule.actions, { ...newAction }]
    });
    setNewAction({ type: "GrantItem", itemId: "", amount: 100, payload: "" });
  };

  const deleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    localStorage.setItem(`liveops_rules_${titleId}`, JSON.stringify(updated));
  };

  const toggleRuleActive = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setRules(updated);
    localStorage.setItem(`liveops_rules_${titleId}`, JSON.stringify(updated));
  };

  const handleDeployToNakama = async () => {
    setIsSaving(true);
    // In a real app, POST to /api/titles/[id]/rules
    setTimeout(() => {
      setIsSaving(false);
      alert("Successfully deployed LiveOps Rules to Nakama!");
    }, 800);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Automation Rules</h1>
          <p className="text-gray-500 text-sm">Create real-time triggers and actions to drive engagement.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> 
            New Rule
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

      {rules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">No rules created</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Automate your game's economy by granting items on login, giving welcome rewards, or responding to custom client events.</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Create your first Rule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.id} className={`bg-white border ${rule.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'} rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all`}>
              <div className="flex items-start gap-4 flex-1">
                <div className="mt-1 shrink-0">
                  <button 
                    onClick={() => toggleRuleActive(rule.id)}
                    className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${rule.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
                    {rule.name}
                    {!rule.isActive && <span className="ml-3 text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Disabled</span>}
                  </h3>
                  <div className="flex items-center text-sm mt-2 flex-wrap gap-2">
                    <span className="font-semibold text-gray-600">ON</span>
                    <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">{rule.triggerEvent}</span>
                    <span className="font-semibold text-gray-600 ml-2">DO</span>
                    {rule.actions.map((act, i) => (
                      <span key={i} className="font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs border border-purple-100">
                        {act.type}({act.type === 'GrantCurrency' ? `${act.amount} ${act.itemId}` : act.type === 'GrantItem' ? act.itemId : act.payload})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                <button className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Edit Rule">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete Rule">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
              <Zap className="w-6 h-6 mr-3 text-blue-600" />
              Create Automation Rule
            </h2>
            
            <form onSubmit={handleSaveRule} className="space-y-6">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rule Name</label>
                  <input type="text" required value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} placeholder="e.g. Initial Welcome Grant" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-colors text-sm font-medium" />
                </div>
                
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                  <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">1. Event Trigger (When this happens...)</label>
                  <select value={newRule.triggerEvent} onChange={e => setNewRule({...newRule, triggerEvent: e.target.value})} className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm font-mono shadow-sm text-blue-900">
                    {triggerEvents.map(t => (
                      <option key={t.value} value={t.value}>{t.label} ({t.value})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
                <label className="block text-xs font-bold text-purple-800 uppercase tracking-wider mb-3">2. Actions (Do these things...)</label>
                
                {newRule.actions.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {newRule.actions.map((act, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-white px-4 py-3 rounded-xl border border-purple-200 shadow-sm">
                        <span className="font-bold text-purple-900">{act.type}</span>
                        <span className="font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded">
                          {act.type === 'GrantCurrency' ? `${act.amount} ${act.itemId}` : act.type === 'GrantItem' ? act.itemId : act.payload}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-1/3">
                    <select value={newAction.type} onChange={e => setNewAction({ type: e.target.value as any, itemId: "", amount: 100, payload: "" })} className="w-full bg-white border border-purple-200 rounded-xl px-3 py-3 outline-none focus:border-purple-500 text-sm shadow-sm font-medium text-purple-900">
                      <option value="GrantItem">Grant Item</option>
                      <option value="GrantCurrency">Grant Currency</option>
                      <option value="ExecuteCloudScript">Run Script</option>
                      <option value="BanUser">Ban User</option>
                    </select>
                  </div>
                  <div className="flex-1 flex gap-2">
                    {newAction.type === 'GrantItem' ? (
                      <select value={newAction.itemId || ""} onChange={e => setNewAction({...newAction, itemId: e.target.value})} className="flex-1 bg-white border border-purple-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 font-mono text-sm shadow-sm">
                        <option value="">Select an Item...</option>
                        <optgroup label="Items">
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
                        </optgroup>
                        <optgroup label="Bundles">
                          {bundles.map(b => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
                        </optgroup>
                        <optgroup label="Lootboxes">
                          {lootboxes.map(l => <option key={l.id} value={l.id}>{l.name} ({l.id})</option>)}
                        </optgroup>
                        <optgroup label="Subscriptions">
                          {subscriptions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                        </optgroup>
                      </select>
                    ) : newAction.type === 'GrantCurrency' ? (
                      <>
                        <input type="number" value={newAction.amount || 100} onChange={e => setNewAction({...newAction, amount: parseInt(e.target.value) || 0})} className="w-24 bg-white border border-purple-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 font-mono text-sm shadow-sm" />
                        <select value={newAction.itemId || ""} onChange={e => setNewAction({...newAction, itemId: e.target.value})} className="flex-1 bg-white border border-purple-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 font-mono text-sm shadow-sm">
                          <option value="">Select Currency...</option>
                          {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                        </select>
                      </>
                    ) : (
                      <input type="text" value={newAction.payload || ""} onChange={e => setNewAction({...newAction, payload: e.target.value})} placeholder="e.g. some_value" className="flex-1 bg-white border border-purple-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 font-mono text-sm shadow-sm" />
                    )}
                    <button type="button" onClick={handleAddAction} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors shadow-sm whitespace-nowrap">
                      Add Action
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={newRule.actions.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
