import {
  ParsedIntent,
  ParsePromptRequest,
  CreateCatalogItemSchema,
  AdjustWalletSchema,
  SetTitleDataSchema
} from "./types";
import { PromptSanitizer } from "./sanitizer";

export class AIIntentParser {
  private static readonly DEFAULT_SUGGESTIONS = [
    "Try: 'Create an Epic Sword for 200 Gold'",
    "Try: 'Give 500 Gems to player hero_1'",
    "Try: 'Set config XP_Multiplier to {\"value\": 2.0}'"
  ];

  /**
   * Parses natural language command into structured typed intents in <1.5s
   */
  public static async parsePrompt(req: ParsePromptRequest): Promise<ParsedIntent> {
    const raw = req.prompt || "";

    // 1. Security Sanitization Check
    if (PromptSanitizer.isSuspicious(raw)) {
      return {
        action: "REJECTED",
        confidence: 0,
        rawPrompt: raw,
        error: "PROMPT_SECURITY_VIOLATION: Input contains forbidden SQL, script, or injection syntax.",
        suggestions: this.DEFAULT_SUGGESTIONS,
        payload: null
      };
    }

    const clean = PromptSanitizer.clean(raw);

    // 2. Pattern 1: Create Catalog Item
    // Examples: "Create an Epic Dragon Armor for 500 Gems", "Add Rare Laser Rifle costing 150 Gold"
    const createItemRegex = /(?:create|add|make)(?:\s+an?)?\s+(?:(common|uncommon|rare|epic|legendary)\s+)?(.+?)\s+(?:for|costing|price)\s+(\d+)\s+([a-zA-Z]+)/i;
    const matchCreate = clean.match(createItemRegex);

    if (matchCreate) {
      const rarityRaw = matchCreate[1] ? matchCreate[1].toUpperCase() : "COMMON";
      const baseName = matchCreate[2].trim();
      const name = matchCreate[1]
        ? `${rarityRaw.charAt(0) + rarityRaw.slice(1).toLowerCase()} ${baseName}`
        : baseName;
      const priceVal = parseInt(matchCreate[3], 10);
      const currency = matchCreate[4].trim().toUpperCase();

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const itemId = `item_${slug}`;

      let category = "Equipment";
      if (/sword|blade|rifle|blaster|bow|axe|weapon/i.test(name)) category = "Weapons";
      else if (/armor|shield|helm|boots|robe/i.test(name)) category = "Armor";
      else if (/potion|elixir|scroll/i.test(name)) category = "Consumables";

      const candidatePayload = {
        id: itemId,
        name,
        description: `${rarityRaw} tier ${name} generated via Daksh AI Command Menu`,
        category,
        prices: { [currency]: priceVal },
        metadata: {
          rarity: rarityRaw as any,
          generatedBy: "Daksh_AI_Cmd_K"
        }
      };

      try {
        const validated = CreateCatalogItemSchema.parse(candidatePayload);
        return {
          action: "CREATE_CATALOG_ITEM",
          confidence: 0.95,
          payload: validated,
          rawPrompt: raw
        };
      } catch (err: any) {
        return {
          action: "REJECTED",
          confidence: 0.2,
          rawPrompt: raw,
          error: `Schema validation failed: ${err.message}`,
          suggestions: this.DEFAULT_SUGGESTIONS,
          payload: null
        };
      }
    }

    // 3. Pattern 2: Adjust / Credit Player Wallet
    // Examples: "Give 1000 Gold to player hero_99", "Credit 500 Gems to ply_007"
    const adjustWalletRegex = /(?:give|credit|add)\s+(\d+)\s+([a-zA-Z]+)\s+to(?:\s+player)?\s+([a-zA-Z0-9_\-]+)/i;
    const matchAdjust = clean.match(adjustWalletRegex);

    if (matchAdjust) {
      const amount = parseInt(matchAdjust[1], 10);
      const currencyCode = matchAdjust[2].trim().toUpperCase();
      const playerId = matchAdjust[3].trim();

      const candidatePayload = {
        playerId,
        currencyCode,
        amount
      };

      try {
        const validated = AdjustWalletSchema.parse(candidatePayload);
        return {
          action: "ADJUST_WALLET",
          confidence: 0.92,
          payload: validated,
          rawPrompt: raw
        };
      } catch (err: any) {
        return {
          action: "REJECTED",
          confidence: 0.2,
          rawPrompt: raw,
          error: `Schema validation failed: ${err.message}`,
          suggestions: this.DEFAULT_SUGGESTIONS,
          payload: null
        };
      }
    }

    // 4. Pattern 3: Set Title Data Remote Config
    // Examples: "Set config XP_Multiplier to 2.5", "Set title data Maintenance to true"
    const titleDataRegex = /set\s+(?:title\s*data|config)\s+([a-zA-Z0-9_\-]+)\s+to\s+(.+)/i;
    const matchTitleData = clean.match(titleDataRegex);

    if (matchTitleData) {
      const key = matchTitleData[1].trim();
      const value = matchTitleData[2].trim();

      const candidatePayload = {
        key,
        value,
        scope: "public" as const,
        description: "Generated via AI Command Menu"
      };

      try {
        const validated = SetTitleDataSchema.parse(candidatePayload);
        return {
          action: "SET_TITLE_DATA",
          confidence: 0.9,
          payload: validated,
          rawPrompt: raw
        };
      } catch (err: any) {
        return {
          action: "REJECTED",
          confidence: 0.2,
          rawPrompt: raw,
          error: `Schema validation failed: ${err.message}`,
          suggestions: this.DEFAULT_SUGGESTIONS,
          payload: null
        };
      }
    }

    // Default: Unable to match intent
    return {
      action: "REJECTED",
      confidence: 0,
      rawPrompt: raw,
      error: "Unable to recognize game operations intent from prompt.",
      suggestions: this.DEFAULT_SUGGESTIONS,
      payload: null
    };
  }
}
