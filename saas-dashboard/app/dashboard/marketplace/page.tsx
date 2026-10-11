"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ShoppingBag, Zap, Shield, Users, Download, CheckCircle2 } from "lucide-react";

export default function Marketplace() {
  const [userName, setUserName] = useState("Studio Admin");
  const [titles, setTitles] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Install Modal State
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [installTemplate, setInstallTemplate] = useState<any>(null);
  const [selectedTitleId, setSelectedTitleId] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Template Config State (Economy)
  const [softCurrencyName, setSoftCurrencyName] = useState("Gold");
  const [softCurrencyCode, setSoftCurrencyCode] = useState("gold");
  const [hardCurrencyName, setHardCurrencyName] = useState("Gems");
  const [hardCurrencyCode, setHardCurrencyCode] = useState("gems");

  // Template Config State (Energy & Saga)
  const [energyMax, setEnergyMax] = useState("5");
  const [energyRegen, setEnergyRegen] = useState("30");
  const [energyName, setEnergyName] = useState("Lives");

  const templates = [
    {
      id: "economy-v1",
      name: "Economy V1",
      author: "Daksh Official",
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      description: "A complete virtual economy for your game. Design customizable soft and hard currencies, set up virtual storefronts, and configure secure mystery lootboxes.",
      price: "Free",
      version: "v1.0"
    },
    {
      id: "energy-saga-v1",
      name: "Casual Puzzle Engine",
      author: "Daksh Official",
      icon: <CheckCircle2 className="w-8 h-8 text-pink-500" />,
      description: "The complete meta-wrapper for Match-3 and puzzle games. Includes a regenerating Lives/Energy system, a visual Saga Map progression, and Pre-game Booster shops.",
      price: "Free",
      version: "v1.0"
    }
  ];

  useEffect(() => {
    setIsClient(true);
    const user = localStorage.getItem("daksh_user");
    if (user) setUserName(JSON.parse(user).name);

    const savedTitles = localStorage.getItem("daksh_titles");
    if (savedTitles) {
      const parsed = JSON.parse(savedTitles);
      setTitles(parsed);
      if (parsed.length > 0) setSelectedTitleId(parsed[0].id);
    }
  }, []);

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTitleId) return;

    setIsInstalling(true);
    
    try {
      const response = await fetch("/api/install-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          titleId: selectedTitleId, 
          templateId: installTemplate.id,
          config: {
            softCurrencyCode,
            hardCurrencyCode
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update LocalStorage to reflect the new version
        const saved = localStorage.getItem("daksh_titles");
        if (saved) {
          let currentTitles = JSON.parse(saved);
          currentTitles = currentTitles.map((t: any) => 
            t.id === selectedTitleId ? { ...t, tsVersion: `${installTemplate.name} ${installTemplate.version}` } : t
          );
          localStorage.setItem("daksh_titles", JSON.stringify(currentTitles));
        }
        
        setIsInstalling(false);
        setInstallSuccess(true);
        
        setTimeout(() => {
          setInstallTemplate(null);
          setInstallSuccess(false);
        }, 2000);
      } else {
        console.error("Installation failed:", data.error);
        setIsInstalling(false);
        alert("Failed to install template. See console for details.");
      }
    } catch (err) {
      console.error("API error:", err);
      setIsInstalling(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans pb-20">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="font-semibold text-lg tracking-tight">Daksh <span className="text-blue-600">Meta Engine</span></span>
            <div className="h-4 w-px bg-gray-300"></div>
            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Titles</Link>
            <Link href="/dashboard/marketplace" className="text-sm font-medium text-gray-900">Marketplace</Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 font-medium">{userName}</span>
            <div className="w-8 h-8 bg-gray-200 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold">
              {userName.substring(0, 1).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-12">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-[2.5rem] font-bold tracking-tight mb-1">Meta Systems Marketplace</h1>
            <p className="text-gray-500 text-lg">Discover, customize, and deploy ready-made metagame systems to your live titles.</p>
          </div>
          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-medium text-sm flex items-center">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Creator Hub
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mb-6">
                {template.icon}
              </div>
              <h2 className="text-xl font-bold mb-1">{template.name}</h2>
              <p className="text-sm text-gray-400 font-medium mb-4">by {template.author}</p>
              <p className="text-gray-500 text-sm flex-grow mb-8 leading-relaxed">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100">
                <span className="font-semibold">{template.price}</span>
                <button 
                  onClick={() => setPreviewTemplate(template)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-5 py-2 rounded-full font-medium text-sm transition-colors"
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Preview Modal */}
      {previewTemplate && !installTemplate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl transform transition-all overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center">
                {previewTemplate.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{previewTemplate.name}</h2>
                <p className="text-sm font-medium text-gray-500">by {previewTemplate.author} • {previewTemplate.version}</p>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-grow mb-6 pr-2">
              <h3 className="text-lg font-semibold mb-2">Overview</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {previewTemplate.description}
              </p>

              <h3 className="text-lg font-semibold mb-2">Game Rules Included</h3>
              <ul className="list-disc pl-5 mb-6 text-gray-600 space-y-2">
                {previewTemplate.id === "economy-v1" && (
                  <>
                    <li><strong>Virtual Storefronts:</strong> Allow players to exchange soft/hard currencies for items and bundles. Prices are strictly enforced by the platform.</li>
                    <li><strong>Mystery Box (Gacha):</strong> Players can spend their currency to open a mystery box. Reward probabilities are handled securely so players cannot hack the drop rates.</li>
                    <li><strong>Player Inventory:</strong> All acquired items, weapons, and cosmetics are permanently and securely saved to the player's profile.</li>
                  </>
                )}
                {previewTemplate.id === "energy-saga-v1" && (
                  <>
                    <li><strong>Energy System:</strong> A regenerating life system (e.g., 5 Lives maximum, 1 regenerates every 30 minutes) managed securely on the backend so players cannot time-cheat by changing their phone's clock.</li>
                    <li><strong>Saga Map Progression:</strong> Unlock nodes sequentially. Level 2 cannot be played until Level 1 is securely verified as completed.</li>
                    <li><strong>Pre-Game Shop:</strong> A pop-up storefront to purchase level boosters using Hard Currency before starting a match.</li>
                  </>
                )}
              </ul>

              {previewTemplate.id === "economy-v1" && (
                <>
                  <h3 className="text-lg font-semibold mb-2">Configure System Design</h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-500 mb-4 font-medium">Customize your virtual currencies before deploying to your server.</p>
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Currency 1 */}
                      <div className="bg-[#F5F5F7] p-4 rounded-lg flex flex-col space-y-3 border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 border border-yellow-200 rounded-full flex items-center justify-center text-xl shadow-sm">
                            🪙
                          </div>
                          <div className="text-sm font-bold text-gray-900">Soft Currency</div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Name</label>
                            <input 
                              type="text" 
                              value={softCurrencyName}
                              onChange={(e) => setSoftCurrencyName(e.target.value)}
                              className="w-full mt-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Shortcode</label>
                            <input 
                              type="text" 
                              value={softCurrencyCode}
                              onChange={(e) => setSoftCurrencyCode(e.target.value)}
                              className="w-full mt-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Currency 2 */}
                      <div className="bg-[#F5F5F7] p-4 rounded-lg flex flex-col space-y-3 border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 border border-purple-200 rounded-full flex items-center justify-center text-xl shadow-sm">
                            💎
                          </div>
                          <div className="text-sm font-bold text-gray-900">Hard Currency</div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Name</label>
                            <input 
                              type="text" 
                              value={hardCurrencyName}
                              onChange={(e) => setHardCurrencyName(e.target.value)}
                              className="w-full mt-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Shortcode</label>
                            <input 
                              type="text" 
                              value={hardCurrencyCode}
                              onChange={(e) => setHardCurrencyCode(e.target.value)}
                              className="w-full mt-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Asset Icons</span>
                      <button className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full font-semibold transition-colors">
                        Upload Custom Icons...
                      </button>
                    </div>
                  </div>
                </>
              )}

              {previewTemplate.id === "energy-saga-v1" && (
                <>
                  <h3 className="text-lg font-semibold mb-2">Configure System Design</h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-500 mb-4 font-medium">Design your game's energy rules and monetization structure.</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Energy Config */}
                      <div className="bg-[#F5F5F7] p-4 rounded-lg flex flex-col space-y-3 border border-gray-100 col-span-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-pink-100 border border-pink-200 rounded-full flex items-center justify-center text-xl shadow-sm">
                            ❤️
                          </div>
                          <div className="text-sm font-bold text-gray-900">Energy System (Lives)</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Entity Name</label>
                            <input 
                              type="text" 
                              value={energyName}
                              onChange={(e) => setEnergyName(e.target.value)}
                              className="w-full mt-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Max Capacity</label>
                            <input 
                              type="number" 
                              value={energyMax}
                              onChange={(e) => setEnergyMax(e.target.value)}
                              className="w-full mt-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Regen Time (Mins)</label>
                            <input 
                              type="number" 
                              value={energyRegen}
                              onChange={(e) => setEnergyRegen(e.target.value)}
                              className="w-full mt-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Hard Currency */}
                      <div className="bg-[#F5F5F7] p-4 rounded-lg flex flex-col space-y-3 border border-gray-100 col-span-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 border border-yellow-200 rounded-full flex items-center justify-center text-xl shadow-sm">
                            🏆
                          </div>
                          <div className="text-sm font-bold text-gray-900">Premium Currency (For Boosters)</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Name</label>
                            <input 
                              type="text" 
                              value={hardCurrencyName}
                              onChange={(e) => setHardCurrencyName(e.target.value)}
                              className="w-full mt-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-semibold uppercase">Shortcode</label>
                            <input 
                              type="text" 
                              value={hardCurrencyCode}
                              onChange={(e) => setHardCurrencyCode(e.target.value)}
                              className="w-full mt-1 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-auto">
              <button 
                type="button" 
                onClick={() => setPreviewTemplate(null)}
                className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close Preview
              </button>
              <button 
                onClick={() => setInstallTemplate(previewTemplate)}
                className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-full font-medium transition-colors flex items-center"
              >
                Continue to Install <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Modal */}
      {installTemplate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            {installSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Installed Successfully!</h2>
                <p className="text-gray-500">The template rules are now live on your server.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-2">Install Template</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Select which Title you want to deploy <strong>{installTemplate.name}</strong> to.
                </p>
                
                <form onSubmit={handleInstall}>
                  <div className="mb-8">
                    <label className="block text-sm font-semibold mb-2">Target Game Title</label>
                    {titles.length === 0 ? (
                      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm font-medium">
                        You need to create a Title first before installing templates.
                      </div>
                    ) : (
                      <select 
                        value={selectedTitleId}
                        onChange={(e) => setSelectedTitleId(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors appearance-none font-medium text-gray-800"
                        required
                      >
                        {titles.map(t => (
                          <option key={t.id} value={t.id}>{t.name} (ID: {t.id})</option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={() => setInstallTemplate(null)}
                      className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      disabled={isInstalling}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isInstalling || titles.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isInstalling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" /> Install to Server
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
