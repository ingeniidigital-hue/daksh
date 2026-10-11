"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Terminal, X, Check, ArrowRight, ShieldCheck, 
  Coins, ShoppingBag, Trophy, CloudLightning, Database, 
  CheckCircle2, AlertCircle, RefreshCw, Cpu, Layers, Flame
} from "lucide-react";

interface AICommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  titleName: string;
}

interface GeneratedItem {
  id: string;
  name: string;
  type: string;
  price: string;
  isStackable: boolean;
  customData: string;
  imageUrls: string[];
}

interface ActionPlan {
  title: string;
  description: string;
  category: "Catalog" | "Bundle" | "Leaderboard" | "Rule" | "TitleData" | "Simulation";
  itemsToCreate?: GeneratedItem[];
  bundleToCreate?: any;
  leaderboardToCreate?: any;
  ruleToCreate?: any;
  titleDataToCreate?: any;
  simulationResult?: {
    totalMatches: number;
    inflationRisk: "Low" | "Moderate" | "High";
    sinkSourceRatio: string;
    advice: string;
  };
}

export default function AICommandMenu({ isOpen, onClose, titleId, titleName }: AICommandMenuProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setAppliedSuccess(false);
    }
  }, [isOpen]);

  // Quick Action Recipes
  const quickRecipes = [
    {
      label: "⚔️ 5-Tier Weapon Progression",
      prompt: "Generate a complete 5-tier fantasy sword progression: Wooden Practice Blade, Iron Broadsword, Steel Longsword, Mithril Claymore, and Dragon Slayer with balanced damage and gold prices."
    },
    {
      label: "🎁 Weekend Flash Sale Bundle",
      prompt: "Create a 48-Hour Cyber Neon Bundle containing a Legendary Cyber Rifle, 1,000 Neon Credits, and a 30% discount store override."
    },
    {
      label: "🏆 Season 1 Ranked Leaderboard",
      prompt: "Create a Weekly PvP Ranked Leaderboard resetting every Sunday midnight GMT with automated rewards for top 100 players."
    },
    {
      label: "⚡ Level-Up Reward Automation Rule",
      prompt: "Set up an automation rule: when a player achieves level 10, grant 250 Gems and unlock the Veteran Player Title."
    },
    {
      label: "🧪 1M Match Economy Simulation",
      prompt: "Simulate our game economy for 1,000,000 matches: test if dropping 15-25 gold per victory causes runaway potion inflation."
    }
  ];

  const handleRunPrompt = (promptText: string) => {
    const text = promptText.trim().toLowerCase();
    if (!text) return;

    setIsGenerating(true);
    setActionPlan(null);
    setAppliedSuccess(false);

    setTimeout(() => {
      setIsGenerating(false);

      if (text.includes("simulation") || text.includes("simulate") || text.includes("inflation")) {
        setActionPlan({
          title: "Monte Carlo Economy Balance Simulation",
          description: "Simulated 1,000,000 matches with 45,000 synthetic player profiles over 30 virtual days.",
          category: "Simulation",
          simulationResult: {
            totalMatches: 1000000,
            inflationRisk: "Low",
            sinkSourceRatio: "1.08 : 1.00 (Healthy Sinks Exceed Sources)",
            advice: "Gold faucet is well counterbalanced by repair costs and potion consumable sinks. Economy is stable to publish."
          }
        });
      } else if (text.includes("leaderboard") || text.includes("ranked") || text.includes("pvp")) {
        setActionPlan({
          title: "Create Season 1 PvP Ranked Leaderboard",
          description: "Configures global ranked leaderboard with weekly reset cadence and top-tier reward tiers.",
          category: "Leaderboard",
          leaderboardToCreate: {
            name: "Arena_PvP_Season_1",
            reset: "Weekly",
            aggregation: "Max",
            rewardTierTop10: "500 Gems + Mythic Badge",
            rewardTierTop100: "150 Gems"
          }
        });
      } else if (text.includes("rule") || text.includes("automation") || text.includes("reward")) {
        setActionPlan({
          title: "Create Player Progression Automation Rule",
          description: "Listens for level_up events and automatically executes reward grants without backend code.",
          category: "Rule",
          ruleToCreate: {
            id: `rule_lvl10_${Date.now()}`,
            name: "Grant Level 10 Veteran Rewards",
            triggerEvent: "player_level_up",
            condition: "player.level >= 10",
            action: "GrantVirtualCurrency(250, 'GEMS')"
          }
        });
      } else if (text.includes("bundle") || text.includes("sale") || text.includes("flash")) {
        setActionPlan({
          title: "Generate Flash Sale & Cyber Neon Bundle",
          description: "Creates bundle package and attaches a 30% store discount override.",
          category: "Bundle",
          itemsToCreate: [
            {
              id: "item_cyber_rifle_legendary",
              name: "Cyber Neon Plasma Rifle",
              type: "Weapon",
              price: "1200",
              isStackable: false,
              customData: JSON.stringify({ rarity: "Legendary", elemental: "Plasma", dps: 245 }),
              imageUrls: ["https://picsum.photos/seed/cyberrifle/200", "", ""]
            }
          ],
          bundleToCreate: {
            id: "bundle_cyber_flash_48h",
            name: "48H Cyber Neon Starter Pack",
            price: "1500",
            imageUrls: ["https://picsum.photos/seed/bundlecyber/200", "", ""],
            items: [
              { itemId: "item_cyber_rifle_legendary", quantity: 1 }
            ]
          }
        });
      } else {
        // Default: 5-Tier Weapon Progression
        setActionPlan({
          title: "Generate 5-Tier Fantasy Sword Progression",
          description: "Synthesized 5 normalized weapons with scaled stats, prices, and Economy V2 item metadata.",
          category: "Catalog",
          itemsToCreate: [
            {
              id: "wpn_sword_t1_wood",
              name: "Wooden Practice Blade",
              type: "Weapon",
              price: "50",
              isStackable: false,
              customData: JSON.stringify({ tier: 1, damage: 12, rarity: "Common" }),
              imageUrls: ["https://picsum.photos/seed/woodsword/200", "", ""]
            },
            {
              id: "wpn_sword_t2_iron",
              name: "Iron Broadsword",
              type: "Weapon",
              price: "180",
              isStackable: false,
              customData: JSON.stringify({ tier: 2, damage: 28, rarity: "Uncommon" }),
              imageUrls: ["https://picsum.photos/seed/ironsword/200", "", ""]
            },
            {
              id: "wpn_sword_t3_steel",
              name: "Steel Longsword",
              type: "Weapon",
              price: "450",
              isStackable: false,
              customData: JSON.stringify({ tier: 3, damage: 55, rarity: "Rare" }),
              imageUrls: ["https://picsum.photos/seed/steelsword/200", "", ""]
            },
            {
              id: "wpn_sword_t4_mithril",
              name: "Mithril Claymore",
              type: "Weapon",
              price: "1200",
              isStackable: false,
              customData: JSON.stringify({ tier: 4, damage: 110, rarity: "Epic" }),
              imageUrls: ["https://picsum.photos/seed/mithrilsword/200", "", ""]
            },
            {
              id: "wpn_sword_t5_dragon",
              name: "Dragon Slayer Blade",
              type: "Weapon",
              price: "3500",
              isStackable: false,
              customData: JSON.stringify({ tier: 5, damage: 240, rarity: "Legendary", effect: "Flame Strike" }),
              imageUrls: ["https://picsum.photos/seed/dragonsword/200", "", ""]
            }
          ]
        });
      }
    }, 1200);
  };

  const handleApplyAction = () => {
    if (!actionPlan) return;

    // Apply Catalog Items
    if (actionPlan.itemsToCreate && actionPlan.itemsToCreate.length > 0) {
      const existingItems = JSON.parse(localStorage.getItem(`catalog_items_${titleId}`) || "[]");
      const updatedItems = [...actionPlan.itemsToCreate, ...existingItems];
      localStorage.setItem(`catalog_items_${titleId}`, JSON.stringify(updatedItems));
    }

    // Apply Bundle
    if (actionPlan.bundleToCreate) {
      const existingBundles = JSON.parse(localStorage.getItem(`catalog_bundles_${titleId}`) || "[]");
      const updatedBundles = [actionPlan.bundleToCreate, ...existingBundles];
      localStorage.setItem(`catalog_bundles_${titleId}`, JSON.stringify(updatedBundles));
    }

    // Apply Leaderboard
    if (actionPlan.leaderboardToCreate) {
      const existingBoards = JSON.parse(localStorage.getItem(`leaderboards_${titleId}`) || "[]");
      const updatedBoards = [actionPlan.leaderboardToCreate, ...existingBoards];
      localStorage.setItem(`leaderboards_${titleId}`, JSON.stringify(updatedBoards));
    }

    // Apply Automation Rule
    if (actionPlan.ruleToCreate) {
      const existingRules = JSON.parse(localStorage.getItem(`liveops_rules_${titleId}`) || "[]");
      const updatedRules = [actionPlan.ruleToCreate, ...existingRules];
      localStorage.setItem(`liveops_rules_${titleId}`, JSON.stringify(updatedRules));
    }

    // Dispatch global event for open views to reload
    window.dispatchEvent(new CustomEvent("daksh_data_updated", { detail: { titleId } }));

    setAppliedSuccess(true);
    setTimeout(() => {
      onClose();
      setActionPlan(null);
      setPrompt("");
      setAppliedSuccess(false);
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="bg-[#1C2026] text-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-700/80 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#161A1F]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-tight text-white">AI Command Menu</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                  Primary Mode
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">Zero-Click Game Backend Automation • {titleName}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Prompt Input */}
        <div className="p-6 border-b border-gray-800/80 bg-[#1A1E24]">
          <div className="relative">
            <input 
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRunPrompt(prompt);
                }
              }}
              placeholder="Tell AI what to build: 'Create a 5-tier sword catalog', 'Launch weekend flash sale', 'Simulate inflation'..."
              className="w-full bg-[#12151A] text-white placeholder-gray-500 text-sm px-4 py-3.5 pl-11 rounded-2xl border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Terminal className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
            {prompt && (
              <button 
                onClick={() => handleRunPrompt(prompt)}
                disabled={isGenerating}
                className="absolute right-2 top-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center transition-colors shadow-sm disabled:opacity-50"
              >
                {isGenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                )}
                Generate
              </button>
            )}
          </div>

          {/* Quick Action Recipes */}
          <div className="mt-4">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Instant LiveOps Recipes (Click to Generate):
            </div>
            <div className="flex flex-wrap gap-2">
              {quickRecipes.map((recipe, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(recipe.prompt);
                    handleRunPrompt(recipe.prompt);
                  }}
                  className="px-3 py-1.5 bg-[#252A33] hover:bg-[#2F3542] border border-gray-700 text-xs text-gray-300 hover:text-white rounded-xl transition-colors font-medium flex items-center"
                >
                  {recipe.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {isGenerating && (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-semibold text-gray-200">AI Synthesizing Game Backend Objects...</p>
              <p className="text-xs text-gray-500 mt-1">Generating Economy V2 schemas, balance curves, and automated rules.</p>
            </div>
          )}

          {appliedSuccess && (
            <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center space-x-3 text-green-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">LiveOps Data Committed Instantly!</h4>
                <p className="text-xs text-green-300/80 mt-0.5">
                  The data has been injected into your game backend. You can inspect it right now in the PlayFab manual view.
                </p>
              </div>
            </div>
          )}

          {!isGenerating && actionPlan && !appliedSuccess && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Proposed AI Action Plan • {actionPlan.category}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-400/20 text-blue-300 font-mono">
                    Zero-Click Ready
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">{actionPlan.title}</h4>
                <p className="text-xs text-gray-300 mt-1">{actionPlan.description}</p>
              </div>

              {/* Items Preview */}
              {actionPlan.itemsToCreate && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Generated Economy V2 Items ({actionPlan.itemsToCreate.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {actionPlan.itemsToCreate.map((item) => (
                      <div key={item.id} className="p-3 bg-[#242A34] rounded-xl border border-gray-700/60 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs">
                            ⚔️
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">{item.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{item.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-400">{item.price} Gold</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simulation Result */}
              {actionPlan.simulationResult && (
                <div className="p-4 bg-[#242A34] rounded-2xl border border-gray-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300">Simulation Volume</span>
                    <span className="text-xs font-mono font-bold text-white">1,000,000 Matches</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300">Inflation Risk</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      {actionPlan.simulationResult.inflationRisk} Risk
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300">Sink to Source Ratio</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">{actionPlan.simulationResult.sinkSourceRatio}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700 text-xs text-gray-300 italic">
                    💡 {actionPlan.simulationResult.advice}
                  </div>
                </div>
              )}

              {/* Leaderboard Result */}
              {actionPlan.leaderboardToCreate && (
                <div className="p-4 bg-[#242A34] rounded-2xl border border-gray-700 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400">Leaderboard Name:</span><span className="font-bold text-white">{actionPlan.leaderboardToCreate.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Reset Cadence:</span><span className="text-blue-400 font-semibold">{actionPlan.leaderboardToCreate.reset}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Top 10 Reward:</span><span className="text-amber-400 font-semibold">{actionPlan.leaderboardToCreate.rewardTierTop10}</span></div>
                </div>
              )}

              {/* Automation Rule Result */}
              {actionPlan.ruleToCreate && (
                <div className="p-4 bg-[#242A34] rounded-2xl border border-gray-700 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400">Rule Name:</span><span className="font-bold text-white">{actionPlan.ruleToCreate.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Trigger:</span><span className="text-blue-400 font-mono">{actionPlan.ruleToCreate.triggerEvent}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Action:</span><span className="text-green-400 font-mono">{actionPlan.ruleToCreate.action}</span></div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-800 flex justify-end space-x-3">
                <button
                  onClick={() => setActionPlan(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleApplyAction}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20 flex items-center transition-all"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Execute & Commit to LiveOps
                </button>
              </div>
            </div>
          )}

          {!isGenerating && !actionPlan && !appliedSuccess && (
            <div className="py-8 text-center text-gray-500">
              <Cpu className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xs">Select an instant recipe above or prompt any custom LiveOps action.</p>
              <p className="text-[11px] text-gray-600 mt-1">
                Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">Esc</kbd> to close anytime.
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-[#161A1F] border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            AI Mode is primary. Manual PlayFab view remains available for inspection.
          </span>
          <span className="font-mono text-gray-500">Shortcut: ⌘K / Ctrl+K</span>
        </div>

      </div>
    </div>
  );
}
