import { requireTitle } from "../title/title";

export interface RuleAction {
    type: string; // e.g. "GrantItem", "GrantCurrency", "CloudScript"
    itemId?: string;
    currencyCode?: string;
    amount?: number;
    scriptName?: string;
}

export interface Rule {
    id: string;
    name: string;
    eventName: string;
    conditions: any[];
    actions: RuleAction[];
    isActive: boolean;
}

/**
 * rpcEvaluateEvent is called by the client (or internal server systems)
 * to trigger the rules engine for a specific custom event.
 */
export const rpcEvaluateEvent: nkruntime.RpcFunction = function (ctx, logger, nk, payload) {
    if (!ctx.userId) {
        throw new Error("unauthenticated");
    }

    const titleId = requireTitle(ctx);
    let eventData: any = {};
    try {
        eventData = JSON.parse(payload);
    } catch (e) {
        throw new Error("invalid payload");
    }

    const eventName = eventData.eventName;
    if (!eventName) {
        throw new Error("eventName is required");
    }

    // 1. Fetch rules from storage
    // The dashboard stores rules in collection: `liveops_rules`, key: titleId
    let rules: Rule[] = [];
    try {
        const objects = nk.storageRead([{
            collection: "liveops_rules",
            key: titleId,
            userId: "00000000-0000-0000-0000-000000000000" // System user
        }]);

        if (objects.length > 0) {
            rules = objects[0].value.rules || [];
        }
    } catch (e: any) {
        logger.error(`Failed to read rules: ${e.message}`);
    }

    // 2. Filter active rules that match the event
    const activeRules = rules.filter(r => r.isActive && r.eventName === eventName);
    
    // 3. Execute actions for matched rules
    let executed = 0;
    for (const rule of activeRules) {
        logger.info(`Evaluating rule: ${rule.name}`);
        
        for (const action of rule.actions) {
            try {
                if (action.type === "GrantCurrency" && action.currencyCode && action.amount) {
                    nk.walletUpdate(ctx.userId, { [action.currencyCode]: action.amount }, {}, true);
                    logger.info(`[Rule ${rule.name}] Granted ${action.amount} ${action.currencyCode}`);
                } 
                else if (action.type === "GrantItem" && action.itemId) {
                    // Assuming inventory grant logic (could be simplified for this demo)
                    nk.storageWrite([{
                        collection: "inventory",
                        key: action.itemId + "_" + Date.now(),
                        userId: ctx.userId,
                        value: { itemId: action.itemId, grantedBy: rule.name },
                        permissionRead: 1,
                        permissionWrite: 0
                    }]);
                    logger.info(`[Rule ${rule.name}] Granted item ${action.itemId}`);
                }
                else if (action.type === "CloudScript" && action.scriptName) {
                    logger.info(`[Rule ${rule.name}] Executing CloudScript: ${action.scriptName}`);
                    // A real implementation would dynamically invoke the JS VM or TS module here.
                }
            } catch (err: any) {
                logger.error(`[Rule ${rule.name}] Action failed: ${err.message}`);
            }
        }
        executed++;
    }

    return JSON.stringify({ success: true, evaluatedEvent: eventName, rulesExecuted: executed });
};
