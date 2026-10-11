import { z } from "zod";

export type AIActionType =
  | "CREATE_CATALOG_ITEM"
  | "ADJUST_WALLET"
  | "SET_TITLE_DATA"
  | "QUERY_METRICS"
  | "REJECTED";

export const CreateCatalogItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  prices: z.record(z.string(), z.number().int().positive()),
  metadata: z.object({
    rarity: z.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]).optional(),
    tags: z.array(z.string()).optional()
  }).passthrough()
});

export const AdjustWalletSchema = z.object({
  playerId: z.string().min(1),
  currencyCode: z.string().min(1),
  amount: z.number().int().positive()
});

export const SetTitleDataSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  scope: z.enum(["public", "internal"]).default("public"),
  description: z.string().optional()
});

export interface ParsedIntent {
  action: AIActionType;
  confidence: number;
  payload: any;
  suggestions?: string[];
  error?: string;
  rawPrompt: string;
}

export interface ParsePromptRequest {
  titleId: string;
  prompt: string;
}

export interface CommandExecutionResult {
  success: boolean;
  action: AIActionType;
  eventDispatched: string;
  eventPayload: any;
  data: any;
  message: string;
}
