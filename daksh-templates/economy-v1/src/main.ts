// Daksh Game Backend - Economy V1 Template
// This script runs securely on the Nakama server.

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.NakamaModule, initializer: nkruntime.Initializer) {
    logger.info("Economy V1 Template Loaded!");

    // Register our custom Game Rules (RPCs) that clients can call
    initializer.registerRpc("purchase_item", rpcPurchaseItem);
    initializer.registerRpc("open_lootbox", rpcOpenLootbox);
}

// 1. Virtual Storefront System
// Deducts currency and grants a specific item to the player.
function rpcPurchaseItem(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.NakamaModule, payload: string): string {
    const userId = ctx.userId;
    if (!userId) {
        throw Error("Must be logged in.");
    }

    // Parse payload to get the item ID they want to buy
    let request: { itemId: string } = { itemId: "" };
    try {
        request = JSON.parse(payload);
    } catch (e) {
        return JSON.stringify({ success: false, error: "Invalid payload." });
    }

    // Securely define shop prices on the server
    const shopPrices: Record<string, { currency: string, cost: number }> = {
        "starter_pack": { currency: "gold", cost: 500 },
        "premium_skin": { currency: "gems", cost: 150 }
    };

    const item = shopPrices[request.itemId];
    if (!item) {
        return JSON.stringify({ success: false, error: "Item not found in store." });
    }

    // Deduct cost
    const changeset = { [item.currency]: -item.cost };
    
    try {
        nk.walletUpdate(userId, changeset, { reason: "Store Purchase" }, true);
    } catch (error: any) {
        return JSON.stringify({ success: false, error: `Not enough ${item.currency}!` });
    }

    // Grant Item
    const writeRequest: nkruntime.StorageWriteRequest = {
        collection: "inventory",
        key: request.itemId,
        userId: userId,
        value: { obtainedAt: Date.now(), source: "store" },
        permissionRead: 1, 
        permissionWrite: 0 
    };

    nk.storageWrite([writeRequest]);
    
    logger.info(`Player ${userId} purchased ${request.itemId}`);
    return JSON.stringify({ success: true, item: request.itemId });
}

// 2. Lootbox System
// Deducts 50 Gold and grants a random item to the player's inventory.
function rpcOpenLootbox(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.NakamaModule, payload: string): string {
    const userId = ctx.userId;
    if (!userId) {
        throw Error("Must be logged in.");
    }

    // Cost is 50 Gold
    const changeset = {
        "gold": -50
    };

    try {
        // This will fail if the user doesn't have 50 gold (updateLedger = true handles negative checks if strict)
        nk.walletUpdate(userId, changeset, { reason: "Opened Lootbox" }, true);
    } catch (error: any) {
        return JSON.stringify({ success: false, error: "Not enough gold!" });
    }

    // RNG for lootbox
    const random = Math.random();
    let itemGranted = "common_sword";
    let rarity = "Common";

    if (random > 0.9) {
        itemGranted = "legendary_dragon_blade";
        rarity = "Legendary";
    } else if (random > 0.6) {
        itemGranted = "rare_shield";
        rarity = "Rare";
    }

    // Add item to inventory (Nakama Storage Engine)
    const writeRequest: nkruntime.StorageWriteRequest = {
        collection: "inventory",
        key: itemGranted,
        userId: userId,
        value: { obtainedAt: Date.now(), rarity: rarity },
        permissionRead: 1, // Owner read
        permissionWrite: 0 // Server write only
    };

    nk.storageWrite([writeRequest]);
    
    return JSON.stringify({ success: true, item: itemGranted, rarity: rarity });
}
