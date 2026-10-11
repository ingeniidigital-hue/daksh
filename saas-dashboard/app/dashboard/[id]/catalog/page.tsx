"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Settings, HelpCircle, PackageOpen, Coins, Search, Edit3, Trash2, Save, FileSpreadsheet, Download, Upload, Sparkles } from "lucide-react";
import Papa from "papaparse";

interface Item {
  id: string;
  name: string;
  type: string;
  price: string;
  isStackable: boolean;
  customData: string;
  imageUrls: string[];
  realPrice?: number;
  realCurrency?: string;
  iosProductId?: string;
  googleProductId?: string;
  steamProductId?: string;
  epicProductId?: string;
  nintendoProductId?: string;
  xboxProductId?: string;
}

interface BundleItem {
  itemId: string;
  quantity: number;
}

interface Bundle {
  id: string;
  name: string;
  price: string;
  imageUrls: string[];
  items: BundleItem[];
  realPrice?: number;
  realCurrency?: string;
  iosProductId?: string;
  googleProductId?: string;
  steamProductId?: string;
  epicProductId?: string;
  nintendoProductId?: string;
  xboxProductId?: string;
}

interface StoreOverride {
  itemId: string;
  overridePrice: string;
}

interface StoreCatalog {
  id: string;
  name: string;
  description?: string;
  imageUrls?: string[];
  customData?: string;
  overrides: StoreOverride[];
}

interface Currency {
  code: string;
  name: string;
  type: string;
  imageUrls: string[];
}

interface DropItem {
  itemId: string;
  weight: number;
}

interface Lootbox {
  id: string;
  name: string;
  price: number;
  currencyCode: string;
  imageUrls: string[];
  drops: DropItem[];
  realPrice?: number;
  realCurrency?: string;
  iosProductId?: string;
  googleProductId?: string;
  steamProductId?: string;
  epicProductId?: string;
  nintendoProductId?: string;
  xboxProductId?: string;
}

interface SubscriptionReward {
  itemId: string;
  amount: number;
  type: "Initial" | "Daily";
}

interface Subscription {
  id: string;
  name: string;
  price: number;
  currencyCode: string;
  durationDays: number;
  imageUrls: string[];
  rewards: SubscriptionReward[];
  iosProductId?: string;
  googleProductId?: string;
  steamProductId?: string;
  epicProductId?: string;
  nintendoProductId?: string;
  xboxProductId?: string;
}

interface UGCItem {
  id: string;
  name: string;
  creatorId: string;
  description: string;
  status: "Pending" | "Approved" | "Rejected";
  tags: string[];
  imageUrls: string[];
}

export default function CatalogPage() {
  const params = useParams();
  const titleId = params?.id as string;
  
  const [activeTab, setActiveTab] = useState("Items");
  const [items, setItems] = useState<Item[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Item>({ id: "", name: "", type: "Weapon", price: "0", isStackable: false, customData: "{}", imageUrls: ["", "", ""] });

  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState<Currency>({ code: "", name: "", type: "Soft Currency", imageUrls: ["", "", ""] });
  
  const [lootboxes, setLootboxes] = useState<Lootbox[]>([]);
  const [isLootboxModalOpen, setIsLootboxModalOpen] = useState(false);
  const [newLootbox, setNewLootbox] = useState<Lootbox>({ id: "", name: "", price: 100, currencyCode: "", imageUrls: ["", "", ""], drops: [] });
  const [newDrop, setNewDrop] = useState<DropItem>({ itemId: "", weight: 1 });

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [newBundle, setNewBundle] = useState<Bundle>({ id: "", name: "", price: "0", imageUrls: ["", "", ""], items: [] });
  const [newBundleItem, setNewBundleItem] = useState<BundleItem>({ itemId: "", quantity: 1 });

  const [stores, setStores] = useState<StoreCatalog[]>([]);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [newStore, setNewStore] = useState<StoreCatalog>({ id: "", name: "", description: "", imageUrls: ["", ""], customData: "{}", overrides: [] });
  const [newStoreOverride, setNewStoreOverride] = useState<StoreOverride>({ itemId: "", overridePrice: "0" });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [newSub, setNewSub] = useState<Subscription>({ id: "", name: "", price: 999, currencyCode: "RM", durationDays: 30, imageUrls: ["", "", ""], rewards: [] });
  const [newSubReward, setNewSubReward] = useState<SubscriptionReward>({ itemId: "", amount: 1, type: "Initial" });

  const [ugcItems, setUgcItems] = useState<UGCItem[]>([
    { id: "ugc_map_01", name: "Cyberpunk City Arena", creatorId: "usr_9921", description: "A high-octane neon city map for 4v4.", status: "Pending", tags: ["Map", "Sci-Fi"], imageUrls: ["https://picsum.photos/seed/cyber/200"] },
    { id: "ugc_skin_02", name: "Dragon Knight Armor", creatorId: "usr_1024", description: "Awesome dragon themed armor skin.", status: "Approved", tags: ["Skin", "Fantasy"], imageUrls: ["https://picsum.photos/seed/dragon/200"] },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [syncStatus, setSyncStatus] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileUpload = async (file: File) => {
    setUploadError("");
    
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setUploadError("File exceeds 5MB limit.");
      return null;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed.");
      return null;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("titleId", titleId);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      setIsUploading(false);
      return data.url;
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message);
      return null;
    }
  };

  const tabs = ["Items", "Currency", "UGC", "Bundles", "Lootboxes", "Stores", "Subscriptions"];

  // Load from local storage and listen for AI menu updates
  useEffect(() => {
    const loadData = () => {
      const savedItems = localStorage.getItem(`catalog_items_${titleId}`);
      if (savedItems) setItems(JSON.parse(savedItems));
      
      const savedCurrencies = localStorage.getItem(`catalog_curr_${titleId}`);
      if (savedCurrencies) setCurrencies(JSON.parse(savedCurrencies));

      const savedLootboxes = localStorage.getItem(`catalog_lootboxes_${titleId}`);
      if (savedLootboxes) setLootboxes(JSON.parse(savedLootboxes));

      const savedBundles = localStorage.getItem(`catalog_bundles_${titleId}`);
      if (savedBundles) setBundles(JSON.parse(savedBundles));

      const savedStores = localStorage.getItem(`catalog_stores_${titleId}`);
      if (savedStores) setStores(JSON.parse(savedStores));

      const savedSubs = localStorage.getItem(`catalog_subs_${titleId}`);
      if (savedSubs) setSubscriptions(JSON.parse(savedSubs));

      const savedUgc = localStorage.getItem(`catalog_ugc_${titleId}`);
      if (savedUgc) setUgcItems(JSON.parse(savedUgc));
    };

    loadData();

    window.addEventListener("daksh_data_updated", loadData);
    return () => window.removeEventListener("daksh_data_updated", loadData);
  }, [titleId]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.id || !newItem.name) return;
    const updated = [...items, newItem];
    setItems(updated);
    localStorage.setItem(`catalog_items_${titleId}`, JSON.stringify(updated));
    setNewItem({ id: "", name: "", type: "Weapon", price: "0", isStackable: false, customData: "{}", imageUrls: ["", "", ""] });
    setIsItemModalOpen(false);
  };

  const handleAddCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrency.code || !newCurrency.name) return;
    const updated = [...currencies, newCurrency];
    setCurrencies(updated);
    localStorage.setItem(`catalog_curr_${titleId}`, JSON.stringify(updated));
    setNewCurrency({ code: "", name: "", type: "Soft Currency", imageUrls: ["", "", ""] });
    setIsCurrencyModalOpen(false);
  };

  const handleAddLootbox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLootbox.id || !newLootbox.name || newLootbox.drops.length === 0) {
      alert("Please provide ID, Name, and at least one drop item.");
      return;
    }
    const updated = [...lootboxes, newLootbox];
    setLootboxes(updated);
    localStorage.setItem(`catalog_lootboxes_${titleId}`, JSON.stringify(updated));
    setNewLootbox({ id: "", name: "", price: 100, currencyCode: "", imageUrls: ["", "", ""], drops: [] });
    setIsLootboxModalOpen(false);
  };

  const handleAddDropItem = () => {
    if (!newDrop.itemId || newDrop.weight <= 0) return;
    setNewLootbox({
      ...newLootbox,
      drops: [...newLootbox.drops, { ...newDrop }]
    });
    setNewDrop({ itemId: "", weight: 1 });
  };

  const handleAddBundle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBundle.id || !newBundle.name) return;
    const updated = [...bundles, newBundle];
    setBundles(updated);
    localStorage.setItem(`catalog_bundles_${titleId}`, JSON.stringify(updated));
    setNewBundle({ id: "", name: "", price: "0", imageUrls: ["", "", ""], items: [] });
    setIsBundleModalOpen(false);
  };

  const handleAddBundleItem = () => {
    if (!newBundleItem.itemId || newBundleItem.quantity <= 0) return;
    setNewBundle({
      ...newBundle,
      items: [...newBundle.items, { ...newBundleItem }]
    });
    setNewBundleItem({ itemId: "", quantity: 1 });
  };

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.id || !newStore.name) return;
    const updated = [...stores, newStore];
    setStores(updated);
    localStorage.setItem(`catalog_stores_${titleId}`, JSON.stringify(updated));
    setNewStore({ id: "", name: "", description: "", imageUrls: ["", ""], customData: "{}", overrides: [] });
    setIsStoreModalOpen(false);
  };

  const handleAddStoreOverride = () => {
    if (!newStoreOverride.itemId || !newStoreOverride.overridePrice) return;
    setNewStore({
      ...newStore,
      overrides: [...newStore.overrides, { ...newStoreOverride }]
    });
    setNewStoreOverride({ itemId: "", overridePrice: "0" });
  };

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.id || !newSub.name) return;
    const updated = [...subscriptions, newSub];
    setSubscriptions(updated);
    localStorage.setItem(`catalog_subs_${titleId}`, JSON.stringify(updated));
    setNewSub({ id: "", name: "", price: 999, currencyCode: "RM", durationDays: 30, imageUrls: ["", "", ""], rewards: [] });
    setIsSubModalOpen(false);
  };

  const handleUpdateUgcStatus = (id: string, status: "Pending" | "Approved" | "Rejected") => {
    const updated = ugcItems.map(i => i.id === id ? { ...i, status } : i);
    setUgcItems(updated);
    localStorage.setItem(`catalog_ugc_${titleId}`, JSON.stringify(updated));
  };

  const handleAddSubReward = () => {
    if (!newSubReward.itemId || newSubReward.amount <= 0) return;
    setNewSub({
      ...newSub,
      rewards: [...newSub.rewards, { ...newSubReward }]
    });
    setNewSubReward({ itemId: "", amount: 1, type: "Initial" });
  };

  const downloadTemplate = () => {
    const headers = "Category,ID,Name,Type,Price,RealPrice,RealCurrency,IosProductId,GoogleProductId,SteamProductId,EpicProductId,NintendoProductId,XboxProductId,IsStackable,CustomData,Contents,ImageUrl1,ImageUrl2,ImageUrl3\n";
    const sampleData = `Item,itm_sword_01,Iron Sword,Weapon,100,0,,ios_sword,gp_sword,steam_sword,,,,FALSE,"{""damage"": 10}","","https://example.com/sword1.png","",""
Currency,GO,Gold Coins,Soft Currency,0,0,,,,,,,,FALSE,"{}","","","",""
Lootbox,lb_basic,Basic Chest,Chest,500,0,,,,,,,,FALSE,"{}","[{""itemId"":""itm_sword_01"",""weight"":10}]","","",""
Bundle,bd_starter,Starter Pack,Bundle,0,4.99,USD,,,,,,,,FALSE,"{}","[{""itemId"":""itm_sword_01"",""quantity"":1}]","","",""
Subscription,sub_vip,VIP Monthly,Subscription,0,9.99,USD,,,,,,,,FALSE,"{}","[{""itemId"":""GO"",""amount"":100,""type"":""recurring""}]","","",""\n`;
    const blob = new Blob([headers + sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "daksh_economy_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncFromSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl) return;
    setSyncStatus("Fetching...");
    try {
      const res = await fetch(sheetUrl);
      if (!res.ok) throw new Error("Failed to fetch");
      const csvData = await res.text();
      
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const newItems: Item[] = [];
          const newCurrencies: Currency[] = [];
          const newLootboxes: Lootbox[] = [];
          const newBundles: Bundle[] = [];
          const newSubscriptions: Subscription[] = [];
          
          results.data.forEach((row: any) => {
            const urls = [row.ImageUrl1 || "", row.ImageUrl2 || "", row.ImageUrl3 || ""];
            let parsedContents: any[] = [];
            try {
              if (row.Contents) parsedContents = JSON.parse(row.Contents);
            } catch(e) {}
            
            const realPrice = row.RealPrice ? parseFloat(row.RealPrice) : undefined;
            const rpVal = isNaN(realPrice as number) ? undefined : realPrice;
            const rCur = row.RealCurrency || undefined;
            const iosProductId = row.IosProductId || undefined;
            const googleProductId = row.GoogleProductId || undefined;
            const steamProductId = row.SteamProductId || undefined;
            const epicProductId = row.EpicProductId || undefined;
            const nintendoProductId = row.NintendoProductId || undefined;
            const xboxProductId = row.XboxProductId || undefined;

            if (row.Category === 'Item') {
              newItems.push({
                id: row.ID,
                name: row.Name,
                type: row.Type,
                price: row.Price || "0",
                realPrice: rpVal,
                realCurrency: rCur,
                iosProductId, googleProductId, steamProductId, epicProductId, nintendoProductId, xboxProductId,
                isStackable: row.IsStackable?.toUpperCase() === 'TRUE',
                customData: row.CustomData || "{}",
                imageUrls: urls
              });
            } else if (row.Category === 'Currency') {
              newCurrencies.push({
                code: row.ID,
                name: row.Name,
                type: row.Type,
                imageUrls: urls
              });
            } else if (row.Category === 'Lootbox') {
              newLootboxes.push({
                id: row.ID,
                name: row.Name,
                price: parseInt(row.Price) || 0,
                realPrice: rpVal,
                realCurrency: rCur,
                iosProductId, googleProductId, steamProductId, epicProductId, nintendoProductId, xboxProductId,
                currencyCode: row.Type || "GO",
                imageUrls: urls,
                drops: parsedContents
              });
            } else if (row.Category === 'Bundle') {
              newBundles.push({
                id: row.ID,
                name: row.Name,
                price: row.Price || "0",
                realPrice: rpVal,
                realCurrency: rCur,
                iosProductId, googleProductId, steamProductId, epicProductId, nintendoProductId, xboxProductId,
                imageUrls: urls,
                items: parsedContents
              });
            } else if (row.Category === 'Subscription') {
              newSubscriptions.push({
                id: row.ID,
                name: row.Name,
                price: rpVal !== undefined ? rpVal : (parseInt(row.Price) || 0),
                currencyCode: rCur || row.Type || "RM",
                iosProductId, googleProductId, steamProductId, epicProductId, nintendoProductId, xboxProductId,
                durationDays: 30, // Or extract from somewhere
                imageUrls: urls,
                rewards: parsedContents
              });
            }
          });
          
          if(newItems.length > 0) { setItems(newItems); localStorage.setItem(`catalog_items_${titleId}`, JSON.stringify(newItems)); }
          if(newCurrencies.length > 0) { setCurrencies(newCurrencies); localStorage.setItem(`catalog_curr_${titleId}`, JSON.stringify(newCurrencies)); }
          if(newLootboxes.length > 0) { setLootboxes(newLootboxes); localStorage.setItem(`catalog_lootboxes_${titleId}`, JSON.stringify(newLootboxes)); }
          if(newBundles.length > 0) { setBundles(newBundles); localStorage.setItem(`catalog_bundles_${titleId}`, JSON.stringify(newBundles)); }
          if(newSubscriptions.length > 0) { setSubscriptions(newSubscriptions); localStorage.setItem(`catalog_subs_${titleId}`, JSON.stringify(newSubscriptions)); }
          
          setSyncStatus("Success! Catalog synchronized.");
          setTimeout(() => {
            setIsSheetModalOpen(false);
            setSyncStatus("");
            setSheetUrl("");
          }, 2000);
        },
        error: (error: any) => {
          console.error(error);
          setSyncStatus("Error parsing CSV.");
        }
      });
    } catch (err) {
      console.error(err);
      setSyncStatus("Failed to fetch. Ensure it is a valid published CSV link.");
    }
  };

  const handleSaveToNakama = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/titles/${titleId}/catalog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          currencies,
          lootboxes,
          bundles,
          stores,
          subscriptions,
          ugcItems,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to deploy to Nakama');
      }

      alert("Catalog successfully deployed to Nakama Storage Engine!");
    } catch (error) {
      console.error(error);
      alert("Failed to deploy catalog.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-gray-900">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Catalog</h1>
          <p className="text-gray-500 text-sm">Design and manage your in-game economy, items, and storefronts.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsSheetModalOpen(true)}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> 
            Sync from Sheets
          </button>
          <button 
            onClick={handleSaveToNakama}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" /> 
            {isSaving ? "Deploying..." : "Deploy to Nakama"}
          </button>
        </div>
      </div>

      {/* AI-First Mode Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-gray-900">AI Menu Active: Zero Manual Clicking Required</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase tracking-wider">
                Primary Driver
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Instead of manually creating items, bundles, or drop tables one by one, press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-gray-700 font-mono text-[10px]">⌘K</kbd> to let AI generate complete balanced catalogs in seconds.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center shadow-sm transition-all shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-200" />
          Prompt AI Menu
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab}
              {tab === "Lootboxes" && (
                <span className="absolute -top-3 -right-6 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  NEW
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm min-h-[500px]">
        
        {/* ITEMS TAB */}
        {activeTab === "Items" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button 
                onClick={() => setIsItemModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> New Item
              </button>
            </div>
            
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No items created yet. Click "New Item" to start building your catalog.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item ID</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prices</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">IAP Maps</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4 font-mono text-sm text-gray-500">{item.id}</td>
                      <td className="py-4 font-medium flex items-center">
                        {item.imageUrls[0] ? (
                          <img src={item.imageUrls[0]} alt={item.name} className="w-6 h-6 object-cover rounded mr-2" />
                        ) : (
                          <div className="w-6 h-6 bg-gray-100 rounded mr-2 flex items-center justify-center text-gray-400 text-xs">?</div>
                        )}
                        {item.name}
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.type}</span>
                      </td>
                      <td className="py-4 text-sm font-medium text-gray-600">
                        <div>{item.price}</div>
                        {item.realPrice && (
                          <div className="text-[10px] text-green-600 font-bold bg-green-50 inline-block px-1.5 py-0.5 rounded mt-1">
                            {item.realPrice} {item.realCurrency}
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.iosProductId && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 inline-block">iOS: {item.iosProductId}</span>}
                          {item.googleProductId && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 inline-block">GP: {item.googleProductId}</span>}
                          {item.steamProductId && <span className="text-[10px] bg-gray-700 text-white px-1.5 py-0.5 rounded border border-gray-800 inline-block">Steam: {item.steamProductId}</span>}
                          {item.epicProductId && <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded border border-gray-900 inline-block">Epic: {item.epicProductId}</span>}
                          {item.nintendoProductId && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200 inline-block">Nin: {item.nintendoProductId}</span>}
                          {item.xboxProductId && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 inline-block">Xbox: {item.xboxProductId}</span>}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setItems(items.filter(i => i.id !== item.id))}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* CURRENCY TAB */}
        {activeTab === "Currency" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold flex items-center">
                <Coins className="w-5 h-5 mr-2 text-yellow-500" /> Virtual Currencies
              </h2>
              <button 
                onClick={() => setIsCurrencyModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> New Currency
              </button>
            </div>
            
            {currencies.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No currencies created yet. Click "New Currency".</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currencies.map((curr) => (
                    <tr key={curr.code} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4 font-mono text-sm font-bold text-gray-500">{curr.code}</td>
                      <td className="py-4 font-medium flex items-center">
                        {curr.imageUrls[0] ? (
                          <img src={curr.imageUrls[0]} alt={curr.name} className="w-6 h-6 object-cover rounded mr-2" />
                        ) : (
                          <div className="w-6 h-6 bg-yellow-50 rounded mr-2 flex items-center justify-center text-yellow-500 text-xs"><Coins className="w-4 h-4"/></div>
                        )}
                        {curr.name}
                      </td>
                      <td className="py-4 text-sm text-gray-600">{curr.type}</td>
                      <td className="py-4 text-right">
                        <button className="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setCurrencies(currencies.filter(c => c.code !== curr.code))}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* LOOTBOXES TAB */}
        {activeTab === "Lootboxes" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <PackageOpen className="w-5 h-5 mr-2 text-purple-500" /> Gacha / Drop Tables
                </h2>
                <p className="text-xs text-gray-500 mt-1">Configure lootboxes with weighted probabilities.</p>
              </div>
              <button 
                onClick={() => setIsLootboxModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Gacha Box
              </button>
            </div>
            
            {lootboxes.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <PackageOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No gacha boxes created yet.</p>
                <p className="text-gray-400 text-sm mt-1">Click "New Gacha Box" to set up drop tables.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lootboxes.map((lb) => {
                  const totalWeight = lb.drops.reduce((sum, drop) => sum + drop.weight, 0);

                  return (
                    <div key={lb.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white hover:border-purple-300 transition-colors">
                      {/* Header */}
                      <div className="bg-purple-50/50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center">
                          {lb.imageUrls && lb.imageUrls[0] ? (
                            <img src={lb.imageUrls[0]} alt={lb.name} className="w-10 h-10 object-cover rounded-lg mr-3 shadow-sm border border-gray-100" />
                          ) : (
                            <div className="w-10 h-10 bg-purple-100 rounded-lg mr-3 flex items-center justify-center text-purple-500">
                              <PackageOpen className="w-5 h-5"/>
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-gray-900">{lb.name}</h3>
                            <p className="text-xs font-mono text-gray-500">{lb.id}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                            {lb.price} {lb.currencyCode}
                          </div>
                          {lb.realPrice && (
                            <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              {lb.realPrice} {lb.realCurrency}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Drop Table */}
                      <div className="p-6">
                        {(lb.iosProductId || lb.googleProductId || lb.steamProductId || lb.epicProductId || lb.nintendoProductId || lb.xboxProductId) && (
                          <div className="mb-4 flex flex-wrap gap-2 pb-4 border-b border-gray-100">
                            {lb.iosProductId && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-mono">iOS: {lb.iosProductId}</span>}
                            {lb.googleProductId && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 font-mono">GP: {lb.googleProductId}</span>}
                            {lb.steamProductId && <span className="text-[10px] bg-gray-700 text-white px-2 py-1 rounded border border-gray-800 font-mono">Steam: {lb.steamProductId}</span>}
                            {lb.epicProductId && <span className="text-[10px] bg-black text-white px-2 py-1 rounded border border-gray-900 font-mono">Epic: {lb.epicProductId}</span>}
                            {lb.nintendoProductId && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 font-mono">Nin: {lb.nintendoProductId}</span>}
                            {lb.xboxProductId && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-mono">Xbox: {lb.xboxProductId}</span>}
                          </div>
                        )}
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Drop Probabilities</p>
                        
                        <div className="space-y-3">
                          {lb.drops.map((drop, idx) => {
                            const percentage = totalWeight > 0 ? ((drop.weight / totalWeight) * 100).toFixed(1) : "0.0";
                            const baseItem = items.find(i => i.id === drop.itemId) || currencies.find(c => c.code === drop.itemId);
                            const itemName = baseItem ? (baseItem as any).name : drop.itemId;
                            const imgUrl = baseItem && baseItem.imageUrls && baseItem.imageUrls[0] ? baseItem.imageUrls[0] : null;

                            return (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                <div className="flex items-center">
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={itemName} className="w-8 h-8 rounded object-cover mr-3 border border-gray-200" />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-gray-200 mr-3 flex items-center justify-center text-gray-400 text-xs">?</div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-gray-800">{itemName}</p>
                                    <p className="text-[10px] font-mono text-gray-400">{drop.itemId}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-purple-600">{percentage}%</p>
                                  <p className="text-[10px] text-gray-500">Weight: {drop.weight}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs text-gray-500">Total Weight: <strong className="text-gray-700">{totalWeight}</strong></span>
                          <button 
                            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                            onClick={() => setLootboxes(lootboxes.filter(l => l.id !== lb.id))}
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BUNDLES TAB */}
        {activeTab === "Bundles" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold flex items-center">
                <PackageOpen className="w-5 h-5 mr-2 text-indigo-500" /> Catalog Bundles
              </h2>
              <button 
                onClick={() => setIsBundleModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> New Bundle
              </button>
            </div>
            
            {bundles.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No bundles created yet. Click "New Bundle".</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bundles.map((bd) => (
                  <div key={bd.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        {bd.imageUrls[0] ? (
                          <img src={bd.imageUrls[0]} alt={bd.name} className="w-10 h-10 object-cover rounded-lg mr-3 shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-50 rounded-lg mr-3 flex items-center justify-center text-indigo-300"><PackageOpen className="w-5 h-5"/></div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900">{bd.name}</h3>
                          <p className="text-xs font-mono text-gray-500">{bd.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold">
                          {bd.price}
                        </div>
                        {bd.realPrice && (
                          <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {bd.realPrice} {bd.realCurrency}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(bd.iosProductId || bd.googleProductId || bd.steamProductId || bd.epicProductId || bd.nintendoProductId || bd.xboxProductId) && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {bd.iosProductId && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-mono">iOS: {bd.iosProductId}</span>}
                        {bd.googleProductId && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 font-mono">GP: {bd.googleProductId}</span>}
                        {bd.steamProductId && <span className="text-[10px] bg-gray-700 text-white px-2 py-1 rounded border border-gray-800 font-mono">Steam: {bd.steamProductId}</span>}
                        {bd.epicProductId && <span className="text-[10px] bg-black text-white px-2 py-1 rounded border border-gray-900 font-mono">Epic: {bd.epicProductId}</span>}
                        {bd.nintendoProductId && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 font-mono">Nin: {bd.nintendoProductId}</span>}
                        {bd.xboxProductId && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-mono">Xbox: {bd.xboxProductId}</span>}
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Contains Items</p>
                      {bd.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded border border-gray-100">
                          <span className="font-medium text-gray-700">{it.itemId}</span>
                          <span className="text-gray-500">Qty: {it.quantity}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                      onClick={() => setBundles(bundles.filter(b => b.id !== bd.id))}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STORES TAB */}
        {activeTab === "Stores" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-orange-500" /> Multiple Storefronts
                </h2>
                <p className="text-xs text-gray-500 mt-1">Create multiple stores (e.g. Weekend Sale, VIP Shop) with price overrides.</p>
              </div>
              <button 
                onClick={() => setIsStoreModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Store
              </button>
            </div>
            
            {stores.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <Settings className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No stores created yet.</p>
                <p className="text-gray-400 text-sm mt-1">Click "New Store" to set up your first storefront.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {stores.map((st) => (
                  <div key={st.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                    {/* Store Header */}
                    <div className="bg-orange-50/50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        {st.imageUrls && st.imageUrls[0] && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm shrink-0 border border-orange-100">
                            <img src={st.imageUrls[0]} alt="Store Banner" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{st.name}</h3>
                          <p className="text-xs font-mono text-gray-500 mt-0.5 mb-1">Store ID: {st.id}</p>
                          {st.description && <p className="text-sm text-gray-600">{st.description}</p>}
                          {st.customData && st.customData !== "{}" && <span className="inline-block mt-1 bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-mono">Data: {st.customData}</span>}
                        </div>
                      </div>
                      <button 
                        className="text-gray-400 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors"
                        onClick={() => setStores(stores.filter(s => s.id !== st.id))}
                        title="Delete Store"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Store Contents (Grid) */}
                    <div className="p-6 bg-gray-50/30">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Store Inventory</p>
                      {st.overrides.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">This store is empty.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {st.overrides.map((ov, idx) => {
                            // Look up the actual item to get its image and name
                            const baseItem = items.find(i => i.id === ov.itemId) || currencies.find(c => c.code === ov.itemId);
                            const itemName = baseItem ? (baseItem as any).name : ov.itemId;
                            const basePrice = baseItem ? (baseItem as any).price || "N/A" : "N/A";
                            const imgUrl = baseItem && baseItem.imageUrls && baseItem.imageUrls[0] ? baseItem.imageUrls[0] : null;

                            return (
                              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
                                <div className="aspect-square w-full rounded-lg bg-gray-100 flex items-center justify-center mb-3 overflow-hidden">
                                  {imgUrl ? (
                                    <img src={imgUrl} alt={itemName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                  ) : (
                                    <span className="text-gray-300 text-xs">No Image</span>
                                  )}
                                </div>
                                <h4 className="font-bold text-sm text-gray-900 truncate" title={itemName}>{itemName}</h4>
                                <p className="text-[10px] font-mono text-gray-400 truncate">{ov.itemId}</p>
                                
                                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col">
                                  <span className="text-xs text-gray-400 line-through">{basePrice}</span>
                                  <span className="text-sm font-bold text-orange-600">{ov.overridePrice}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === "Subscriptions" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <PackageOpen className="w-5 h-5 mr-2 text-teal-500" /> Subscriptions
                </h2>
                <p className="text-xs text-gray-500 mt-1">Manage recurring passes and VIP subscriptions.</p>
              </div>
              <button 
                onClick={() => setIsSubModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Subscription
              </button>
            </div>
            
            {subscriptions.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <PackageOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No subscriptions created yet.</p>
                <p className="text-gray-400 text-sm mt-1">Click "New Subscription" to set up passes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="border border-gray-200 rounded-2xl p-5 shadow-sm bg-white hover:border-teal-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        {sub.imageUrls[0] ? (
                          <img src={sub.imageUrls[0]} alt={sub.name} className="w-10 h-10 object-cover rounded-lg mr-3 shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 bg-teal-50 rounded-lg mr-3 flex items-center justify-center text-teal-300"><PackageOpen className="w-5 h-5"/></div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900">{sub.name}</h3>
                          <p className="text-xs font-mono text-gray-500">{sub.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-teal-100 text-teal-700 px-2.5 py-1 rounded-md text-xs font-bold mb-1">
                          {sub.price} {sub.currencyCode}
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{sub.durationDays} Days</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Rewards</p>
                      {sub.rewards.map((rw, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-teal-50/50 p-2 rounded border border-teal-100">
                          <span className="font-medium text-teal-900">{rw.itemId}</span>
                          <span className="text-teal-700 font-mono text-xs font-bold">+{rw.amount} ({rw.type})</span>
                        </div>
                      ))}
                    </div>

                    {(sub.iosProductId || sub.googleProductId || sub.steamProductId || sub.epicProductId || sub.nintendoProductId || sub.xboxProductId) && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {sub.iosProductId && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-mono">iOS: {sub.iosProductId}</span>}
                        {sub.googleProductId && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 font-mono">GP: {sub.googleProductId}</span>}
                        {sub.steamProductId && <span className="text-[10px] bg-gray-700 text-white px-2 py-1 rounded border border-gray-800 font-mono">Steam: {sub.steamProductId}</span>}
                        {sub.epicProductId && <span className="text-[10px] bg-black text-white px-2 py-1 rounded border border-gray-900 font-mono">Epic: {sub.epicProductId}</span>}
                        {sub.nintendoProductId && <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 font-mono">Nin: {sub.nintendoProductId}</span>}
                        {sub.xboxProductId && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-mono">Xbox: {sub.xboxProductId}</span>}
                      </div>
                    )}
                    
                    <button 
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                      onClick={() => setSubscriptions(subscriptions.filter(s => s.id !== sub.id))}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UGC TAB */}
        {activeTab === "UGC" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <PackageOpen className="w-5 h-5 mr-2 text-rose-500" /> User Generated Content (Moderation)
                </h2>
                <p className="text-xs text-gray-500 mt-1">Review and approve items submitted by your community creators.</p>
              </div>
            </div>
            
            {ugcItems.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <PackageOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No UGC items submitted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ugcItems.map((ugc) => (
                  <div key={ugc.id} className="border border-gray-200 rounded-2xl p-5 shadow-sm bg-white hover:border-rose-300 transition-colors flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        {ugc.imageUrls[0] ? (
                          <img src={ugc.imageUrls[0]} alt={ugc.name} className="w-16 h-16 object-cover rounded-lg mr-4 shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-16 h-16 bg-rose-50 rounded-lg mr-4 flex items-center justify-center text-rose-300"><PackageOpen className="w-6 h-6"/></div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900">{ugc.name}</h3>
                          <p className="text-xs font-mono text-gray-500">{ugc.id}</p>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Creator: <span className="font-bold text-gray-600">{ugc.creatorId}</span></p>
                        </div>
                      </div>
                      <div>
                        {ugc.status === "Pending" && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold uppercase">Pending</span>}
                        {ugc.status === "Approved" && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Approved</span>}
                        {ugc.status === "Rejected" && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Rejected</span>}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 italic">"{ugc.description}"</p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {ugc.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                      {ugc.status === "Pending" && (
                        <>
                          <button 
                            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                            onClick={() => handleUpdateUgcStatus(ugc.id, "Approved")}
                          >
                            Approve
                          </button>
                          <button 
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                            onClick={() => handleUpdateUgcStatus(ugc.id, "Rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {ugc.status !== "Pending" && (
                        <button 
                          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                          onClick={() => handleUpdateUgcStatus(ugc.id, "Pending")}
                        >
                          Revert to Pending
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NEW ITEM MODAL */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Create New Item</h2>
            <form onSubmit={handleAddItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Item ID</label>
                  <input type="text" required value={newItem.id} onChange={e => setNewItem({...newItem, id: e.target.value})} placeholder="e.g. itm_sword_01" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Display Name</label>
                  <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="e.g. Iron Sword" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                    <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm">
                      <option>Weapon</option><option>Armor</option><option>Consumable</option><option>Material</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Base Price</label>
                    <input type="text" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="e.g. 500 Coins" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Real Money Price</label>
                    <input type="number" step="0.01" value={newItem.realPrice || ""} onChange={e => setNewItem({...newItem, realPrice: parseFloat(e.target.value) || undefined})} placeholder="e.g. 4.99" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">RM Currency</label>
                    <input type="text" value={newItem.realCurrency || ""} onChange={e => setNewItem({...newItem, realCurrency: e.target.value.toUpperCase()})} placeholder="USD" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono text-sm uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">iOS Product ID</label>
                    <input type="text" value={newItem.iosProductId || ""} onChange={e => setNewItem({...newItem, iosProductId: e.target.value})} placeholder="e.g. com.game.item" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Google Product ID</label>
                    <input type="text" value={newItem.googleProductId || ""} onChange={e => setNewItem({...newItem, googleProductId: e.target.value})} placeholder="e.g. com.game.item" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Steam Item ID</label>
                    <input type="text" value={newItem.steamProductId || ""} onChange={e => setNewItem({...newItem, steamProductId: e.target.value})} placeholder="e.g. 12345" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Epic Store ID</label>
                    <input type="text" value={newItem.epicProductId || ""} onChange={e => setNewItem({...newItem, epicProductId: e.target.value})} placeholder="e.g. egs_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nintendo eShop ID</label>
                    <input type="text" value={newItem.nintendoProductId || ""} onChange={e => setNewItem({...newItem, nintendoProductId: e.target.value})} placeholder="e.g. nin_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Xbox Store ID</label>
                    <input type="text" value={newItem.xboxProductId || ""} onChange={e => setNewItem({...newItem, xboxProductId: e.target.value})} placeholder="e.g. xbx_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Image URLs (up to 3)</label>
                  <div className="space-y-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex gap-2">
                        <input type="text" value={newItem.imageUrls[i]} onChange={e => { const newUrls = [...newItem.imageUrls]; newUrls[i] = e.target.value; setNewItem({...newItem, imageUrls: newUrls}); }} placeholder={`Image URL ${i+1}`} className="flex-1 bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                        <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-xl flex items-center justify-center transition-colors">
                          <Upload className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const url = await handleFileUpload(e.target.files[0]);
                              if (url) {
                                const newUrls = [...newItem.imageUrls];
                                newUrls[i] = url;
                                setNewItem({...newItem, imageUrls: newUrls});
                              }
                            }
                          }} />
                        </label>
                      </div>
                    ))}
                  </div>
                  {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Custom Data (JSON)</label>
                  <textarea value={newItem.customData} onChange={e => setNewItem({...newItem, customData: e.target.value})} placeholder='{"damage": 50}' rows={2} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="isStackable" checked={newItem.isStackable} onChange={e => setNewItem({...newItem, isStackable: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <label htmlFor="isStackable" className="ml-2 text-sm text-gray-700 font-medium">Is Stackable in Inventory?</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 text-sm">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium text-sm">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CURRENCY MODAL */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Create New Currency</h2>
            <form onSubmit={handleAddCurrency}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Currency Code (2 Letters)</label>
                  <input type="text" required maxLength={2} value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} placeholder="e.g. GO" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono text-sm uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Display Name</label>
                  <input type="text" required value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value})} placeholder="e.g. Gold Coins" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                  <select value={newCurrency.type} onChange={e => setNewCurrency({...newCurrency, type: e.target.value})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm">
                    <option>Soft Currency</option><option>Hard Currency (Premium)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Image URLs (up to 3)</label>
                  <div className="space-y-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex gap-2">
                        <input type="text" value={newCurrency.imageUrls[i]} onChange={e => { const newUrls = [...newCurrency.imageUrls]; newUrls[i] = e.target.value; setNewCurrency({...newCurrency, imageUrls: newUrls}); }} placeholder={`Image URL ${i+1}`} className="flex-1 bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                        <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-xl flex items-center justify-center transition-colors">
                          <Upload className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const url = await handleFileUpload(e.target.files[0]);
                              if (url) {
                                const newUrls = [...newCurrency.imageUrls];
                                newUrls[i] = url;
                                setNewCurrency({...newCurrency, imageUrls: newUrls});
                              }
                            }
                          }} />
                        </label>
                      </div>
                    ))}
                  </div>
                  {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setIsCurrencyModalOpen(false)} className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 text-sm">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium text-sm">Add Currency</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* NEW LOOTBOX MODAL */}
      {isLootboxModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">Create New Lootbox / Drop Table</h2>
            <form onSubmit={handleAddLootbox}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lootbox ID</label>
                  <input type="text" required value={newLootbox.id} onChange={e => setNewLootbox({...newLootbox, id: e.target.value})} placeholder="e.g. box_premium_01" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Display Name</label>
                  <input type="text" required value={newLootbox.name} onChange={e => setNewLootbox({...newLootbox, name: e.target.value})} placeholder="e.g. Premium Hero Box" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price</label>
                    <input type="number" required value={newLootbox.price} onChange={e => setNewLootbox({...newLootbox, price: parseInt(e.target.value) || 0})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Currency Code</label>
                    <input type="text" required value={newLootbox.currencyCode} onChange={e => setNewLootbox({...newLootbox, currencyCode: e.target.value.toUpperCase()})} placeholder="e.g. GO" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono text-sm uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Real Money Price</label>
                    <input type="number" step="0.01" value={newLootbox.realPrice || ""} onChange={e => setNewLootbox({...newLootbox, realPrice: parseFloat(e.target.value) || undefined})} placeholder="e.g. 4.99" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">RM Currency</label>
                    <input type="text" value={newLootbox.realCurrency || ""} onChange={e => setNewLootbox({...newLootbox, realCurrency: e.target.value.toUpperCase()})} placeholder="USD" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono text-sm uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">iOS Product ID</label>
                    <input type="text" value={newLootbox.iosProductId || ""} onChange={e => setNewLootbox({...newLootbox, iosProductId: e.target.value})} placeholder="e.g. com.game.box" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Google Product ID</label>
                    <input type="text" value={newLootbox.googleProductId || ""} onChange={e => setNewLootbox({...newLootbox, googleProductId: e.target.value})} placeholder="e.g. com.game.box" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Steam Item ID</label>
                    <input type="text" value={newLootbox.steamProductId || ""} onChange={e => setNewLootbox({...newLootbox, steamProductId: e.target.value})} placeholder="e.g. 12345" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Epic Store ID</label>
                    <input type="text" value={newLootbox.epicProductId || ""} onChange={e => setNewLootbox({...newLootbox, epicProductId: e.target.value})} placeholder="e.g. egs_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nintendo eShop ID</label>
                    <input type="text" value={newLootbox.nintendoProductId || ""} onChange={e => setNewLootbox({...newLootbox, nintendoProductId: e.target.value})} placeholder="e.g. nin_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Xbox Store ID</label>
                    <input type="text" value={newLootbox.xboxProductId || ""} onChange={e => setNewLootbox({...newLootbox, xboxProductId: e.target.value})} placeholder="e.g. xbx_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Image URLs (up to 3)</label>
                  <div className="space-y-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex gap-2">
                        <input type="text" value={newLootbox.imageUrls[i]} onChange={e => { const newUrls = [...newLootbox.imageUrls]; newUrls[i] = e.target.value; setNewLootbox({...newLootbox, imageUrls: newUrls}); }} placeholder={`Image URL ${i+1}`} className="flex-1 bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                        <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-xl flex items-center justify-center transition-colors">
                          <Upload className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const url = await handleFileUpload(e.target.files[0]);
                              if (url) {
                                const newUrls = [...newLootbox.imageUrls];
                                newUrls[i] = url;
                                setNewLootbox({...newLootbox, imageUrls: newUrls});
                              }
                            }
                          }} />
                        </label>
                      </div>
                    ))}
                  </div>
                  {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-sm mb-4 text-gray-700">Drop Table Config</h3>
                  
                  {newLootbox.drops.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {newLootbox.drops.map((drop, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-purple-50 px-3 py-2 rounded-lg border border-purple-100 text-purple-900">
                          <span>{drop.itemId}</span>
                          <span className="font-mono bg-purple-200 px-2 py-0.5 rounded text-xs">Weight: {drop.weight}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Item ID</label>
                      <select value={newDrop.itemId} onChange={e => setNewDrop({...newDrop, itemId: e.target.value})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 font-mono text-sm">
                        <option value="">Select an Item...</option>
                        <optgroup label="Currencies">
                          {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                        </optgroup>
                        <optgroup label="Items">
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Weight</label>
                      <input type="number" value={newDrop.weight} onChange={e => setNewDrop({...newDrop, weight: parseInt(e.target.value) || 1})} min="1" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 text-sm" />
                    </div>
                    <button type="button" onClick={handleAddDropItem} className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg font-medium text-sm h-[38px]">
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setIsLootboxModalOpen(false)} className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 text-sm">Cancel</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-full font-medium text-sm">Save Lootbox</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* NEW BUNDLE MODAL */}
      {isBundleModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">Create New Bundle</h2>
            <form onSubmit={handleAddBundle}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bundle ID</label>
                  <input type="text" required value={newBundle.id} onChange={e => setNewBundle({...newBundle, id: e.target.value})} placeholder="e.g. starter_pack" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Display Name</label>
                  <input type="text" required value={newBundle.name} onChange={e => setNewBundle({...newBundle, name: e.target.value})} placeholder="e.g. Starter Pack" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price</label>
                  <input type="text" required value={newBundle.price} onChange={e => setNewBundle({...newBundle, price: e.target.value})} placeholder="e.g. 499 RM" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Real Money Price</label>
                    <input type="number" step="0.01" value={newBundle.realPrice || ""} onChange={e => setNewBundle({...newBundle, realPrice: parseFloat(e.target.value) || undefined})} placeholder="e.g. 4.99" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">RM Currency</label>
                    <input type="text" value={newBundle.realCurrency || ""} onChange={e => setNewBundle({...newBundle, realCurrency: e.target.value.toUpperCase()})} placeholder="USD" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono text-sm uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">iOS Product ID</label>
                    <input type="text" value={newBundle.iosProductId || ""} onChange={e => setNewBundle({...newBundle, iosProductId: e.target.value})} placeholder="e.g. com.game.bundle" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Google Product ID</label>
                    <input type="text" value={newBundle.googleProductId || ""} onChange={e => setNewBundle({...newBundle, googleProductId: e.target.value})} placeholder="e.g. com.game.bundle" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Steam Item ID</label>
                    <input type="text" value={newBundle.steamProductId || ""} onChange={e => setNewBundle({...newBundle, steamProductId: e.target.value})} placeholder="e.g. 12345" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Epic Store ID</label>
                    <input type="text" value={newBundle.epicProductId || ""} onChange={e => setNewBundle({...newBundle, epicProductId: e.target.value})} placeholder="e.g. egs_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nintendo eShop ID</label>
                    <input type="text" value={newBundle.nintendoProductId || ""} onChange={e => setNewBundle({...newBundle, nintendoProductId: e.target.value})} placeholder="e.g. nin_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Xbox Store ID</label>
                    <input type="text" value={newBundle.xboxProductId || ""} onChange={e => setNewBundle({...newBundle, xboxProductId: e.target.value})} placeholder="e.g. xbx_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Image URLs (up to 3)</label>
                  <div className="space-y-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex gap-2">
                        <input type="text" value={newBundle.imageUrls[i]} onChange={e => { const newUrls = [...newBundle.imageUrls]; newUrls[i] = e.target.value; setNewBundle({...newBundle, imageUrls: newUrls}); }} placeholder={`Image URL ${i+1}`} className="flex-1 bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm" />
                        <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2.5 rounded-xl flex items-center justify-center transition-colors">
                          <Upload className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const url = await handleFileUpload(e.target.files[0]);
                              if (url) {
                                const newUrls = [...newBundle.imageUrls];
                                newUrls[i] = url;
                                setNewBundle({...newBundle, imageUrls: newUrls});
                              }
                            }
                          }} />
                        </label>
                      </div>
                    ))}
                  </div>
                  {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-sm mb-4 text-gray-700">Bundle Contents</h3>
                  
                  {newBundle.items.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {newBundle.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 text-indigo-900">
                          <span>{it.itemId}</span>
                          <span className="font-mono bg-indigo-200 px-2 py-0.5 rounded text-xs">Qty: {it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Item/Currency ID</label>
                      <select value={newBundleItem.itemId} onChange={e => setNewBundleItem({...newBundleItem, itemId: e.target.value})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono text-sm">
                        <option value="">Select...</option>
                        <optgroup label="Currencies">
                          {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                        </optgroup>
                        <optgroup label="Items">
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Qty</label>
                      <input type="number" value={newBundleItem.quantity} onChange={e => setNewBundleItem({...newBundleItem, quantity: parseInt(e.target.value) || 1})} min="1" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-sm" />
                    </div>
                    <button type="button" onClick={handleAddBundleItem} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium text-sm h-[38px]">
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setIsBundleModalOpen(false)} className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium text-sm">Save Bundle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW STORE MODAL */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">Create New Store</h2>
            <form onSubmit={handleAddStore}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Store ID</label>
                  <input type="text" required value={newStore.id} onChange={e => setNewStore({...newStore, id: e.target.value})} placeholder="e.g. weekend_promo" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Display Name</label>
                  <input type="text" required value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} placeholder="e.g. Weekend Promo Store" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                  <input type="text" value={newStore.description || ""} onChange={e => setNewStore({...newStore, description: e.target.value})} placeholder="e.g. Huge weekend discounts!" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Banner Image URL</label>
                  <input type="url" value={newStore.imageUrls && newStore.imageUrls.length > 0 ? newStore.imageUrls[0] : ""} onChange={e => setNewStore({...newStore, imageUrls: [e.target.value, "", ""]})} placeholder="https://..." className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Custom Data (JSON)</label>
                  <input type="text" value={newStore.customData || ""} onChange={e => setNewStore({...newStore, customData: e.target.value})} placeholder='{"startDate": "2024-10-31"}' className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 font-mono text-sm" />
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-sm mb-4 text-gray-700">Price Overrides</h3>
                  
                  {newStore.overrides.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {newStore.overrides.map((ov, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-orange-50 px-3 py-2 rounded-lg border border-orange-100 text-orange-900">
                          <span>{ov.itemId}</span>
                          <span className="font-bold text-orange-700">{ov.overridePrice}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Item ID</label>
                      <select value={newStoreOverride.itemId} onChange={e => setNewStoreOverride({...newStoreOverride, itemId: e.target.value})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-orange-500 font-mono text-sm">
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
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Override Price</label>
                      <input type="text" value={newStoreOverride.overridePrice} onChange={e => setNewStoreOverride({...newStoreOverride, overridePrice: e.target.value})} placeholder="e.g. 50 GO" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-orange-500 text-sm" />
                    </div>
                    <button type="button" onClick={handleAddStoreOverride} className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-2 rounded-lg font-medium text-sm h-[38px]">
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setIsStoreModalOpen(false)} className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 text-sm">Cancel</button>
                <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-full font-medium text-sm">Save Store</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* GOOGLE SHEETS SYNC MODAL */}
      {isSheetModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-2 flex items-center">
              <FileSpreadsheet className="w-6 h-6 mr-2 text-green-600" />
              Sync from Google Sheets
            </h2>
            <p className="text-gray-500 text-sm mb-6">Manage your catalog in a spreadsheet and sync it instantly.</p>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="font-bold text-sm mb-2 text-gray-800">Step 1: Get the Template</h3>
                <p className="text-xs text-gray-500 mb-3">Download our CSV template and import it into a new Google Sheet. Fill out your items and currencies.</p>
                <button onClick={downloadTemplate} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                  <Download className="w-4 h-4 mr-2" /> Download CSV Template
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="font-bold text-sm mb-2 text-gray-800">Step 2: Publish & Sync</h3>
                <p className="text-xs text-gray-500 mb-3">In Google Sheets, go to <strong>File {'>'} Share {'>'} Publish to web</strong>. Select <strong>CSV</strong> format, and paste the generated link here.</p>
                <form onSubmit={handleSyncFromSheets}>
                  <input 
                    type="url" 
                    required 
                    value={sheetUrl} 
                    onChange={e => setSheetUrl(e.target.value)} 
                    placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" 
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-green-500 text-sm mb-3" 
                  />
                  {syncStatus && (
                    <p className={`text-xs font-bold mb-3 ${syncStatus.includes("Error") || syncStatus.includes("Failed") ? "text-red-500" : "text-green-600"}`}>
                      {syncStatus}
                    </p>
                  )}
                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setIsSheetModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-200 text-sm">Cancel</button>
                    <button type="submit" disabled={syncStatus === "Fetching..."} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm">
                      {syncStatus === "Fetching..." ? "Syncing..." : "Sync Catalog"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* NEW SUBSCRIPTION MODAL */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">Create New Subscription</h2>
            <form onSubmit={handleAddSubscription}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subscription ID</label>
                  <input type="text" required value={newSub.id} onChange={e => setNewSub({...newSub, id: e.target.value})} placeholder="e.g. vip_pass_30" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Display Name</label>
                  <input type="text" required value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} placeholder="e.g. 30-Day VIP Pass" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 text-sm" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price</label>
                    <input type="number" required value={newSub.price} onChange={e => setNewSub({...newSub, price: parseInt(e.target.value) || 0})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Currency</label>
                    <input type="text" required value={newSub.currencyCode} onChange={e => setNewSub({...newSub, currencyCode: e.target.value.toUpperCase()})} placeholder="RM" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 font-mono text-sm uppercase" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Duration (Days)</label>
                    <input type="number" required value={newSub.durationDays} onChange={e => setNewSub({...newSub, durationDays: parseInt(e.target.value) || 30})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">iOS Product ID</label>
                    <input type="text" value={newSub.iosProductId || ""} onChange={e => setNewSub({...newSub, iosProductId: e.target.value})} placeholder="e.g. com.game.vip_30" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-teal-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Google Product ID</label>
                    <input type="text" value={newSub.googleProductId || ""} onChange={e => setNewSub({...newSub, googleProductId: e.target.value})} placeholder="e.g. com.game.vip_30" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-teal-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Steam Item ID</label>
                    <input type="text" value={newSub.steamProductId || ""} onChange={e => setNewSub({...newSub, steamProductId: e.target.value})} placeholder="e.g. 12345" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-teal-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Epic Store ID</label>
                    <input type="text" value={newSub.epicProductId || ""} onChange={e => setNewSub({...newSub, epicProductId: e.target.value})} placeholder="e.g. egs_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-teal-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nintendo eShop ID</label>
                    <input type="text" value={newSub.nintendoProductId || ""} onChange={e => setNewSub({...newSub, nintendoProductId: e.target.value})} placeholder="e.g. nin_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-teal-500 font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Xbox Store ID</label>
                    <input type="text" value={newSub.xboxProductId || ""} onChange={e => setNewSub({...newSub, xboxProductId: e.target.value})} placeholder="e.g. xbx_123" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-teal-500 font-mono text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Image URLs (up to 3)</label>
                  <div className="space-y-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex gap-2">
                        <input type="text" value={newSub.imageUrls[i]} onChange={e => { const newUrls = [...newSub.imageUrls]; newUrls[i] = e.target.value; setNewSub({...newSub, imageUrls: newUrls}); }} placeholder={`Image URL ${i+1}`} className="flex-1 bg-[#F5F5F7] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 text-sm" />
                        <label className="cursor-pointer bg-teal-100 hover:bg-teal-200 text-teal-700 px-3 py-2.5 rounded-xl flex items-center justify-center transition-colors">
                          <Upload className="w-4 h-4" />
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const url = await handleFileUpload(e.target.files[0]);
                              if (url) {
                                const newUrls = [...newSub.imageUrls];
                                newUrls[i] = url;
                                setNewSub({...newSub, imageUrls: newUrls});
                              }
                            }
                          }} />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-sm mb-4 text-gray-700">Subscription Rewards</h3>
                  
                  {newSub.rewards.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {newSub.rewards.map((rw, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-teal-50 px-3 py-2 rounded-lg border border-teal-100 text-teal-900">
                          <span>{rw.itemId}</span>
                          <span className="font-mono bg-teal-200 px-2 py-0.5 rounded text-xs">+{rw.amount} ({rw.type})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Item/Currency ID</label>
                      <select value={newSubReward.itemId} onChange={e => setNewSubReward({...newSubReward, itemId: e.target.value})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 font-mono text-sm">
                        <option value="">Select...</option>
                        <optgroup label="Currencies">
                          {currencies.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                        </optgroup>
                        <optgroup label="Items">
                          {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                      <input type="number" value={newSubReward.amount} onChange={e => setNewSubReward({...newSubReward, amount: parseInt(e.target.value) || 1})} min="1" className="w-full bg-[#F5F5F7] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 text-sm" />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                      <select value={newSubReward.type} onChange={e => setNewSubReward({...newSubReward, type: e.target.value as any})} className="w-full bg-[#F5F5F7] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 text-sm">
                        <option value="Initial">Initial</option>
                        <option value="Daily">Daily</option>
                      </select>
                    </div>
                    <button type="button" onClick={handleAddSubReward} className="bg-teal-100 hover:bg-teal-200 text-teal-700 px-3 py-2 rounded-lg font-medium text-sm h-[38px]">
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setIsSubModalOpen(false)} className="px-5 py-2.5 rounded-full font-medium text-gray-700 hover:bg-gray-100 text-sm">Cancel</button>
                <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-full font-medium text-sm">Save Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
