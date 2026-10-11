import { ParsedIntent, CommandExecutionResult } from "./types";
import { addCatalogItem } from "../economy/catalog";
import { EconomyService } from "../economy/service";
import { TitleDataService } from "../title-data/service";

export class AICommandExecutor {
  /**
   * Executes a parsed intent and produces real database updates + event dispatch payload.
   */
  public static async executeIntent(
    titleId: string,
    intent: ParsedIntent
  ): Promise<CommandExecutionResult> {
    if (intent.action === "REJECTED") {
      throw new Error(`CANNOT_EXECUTE_REJECTED_INTENT: ${intent.error}`);
    }

    switch (intent.action) {
      case "CREATE_CATALOG_ITEM": {
        const item = addCatalogItem(titleId, {
          id: intent.payload.id,
          name: intent.payload.name,
          description: intent.payload.description || "",
          category: intent.payload.category,
          prices: intent.payload.prices,
          isActive: true,
          metadata: intent.payload.metadata || {}
        });

        return {
          success: true,
          action: "CREATE_CATALOG_ITEM",
          eventDispatched: "daksh_data_updated",
          eventPayload: {
            entity: "catalog",
            action: "create",
            itemId: item.id
          },
          data: { item },
          message: `Created catalog item '${item.name}' (${item.id})`
        };
      }

      case "ADJUST_WALLET": {
        const { playerId, currencyCode, amount } = intent.payload;
        const balance = EconomyService.creditWallet(titleId, playerId, currencyCode, amount);

        return {
          success: true,
          action: "ADJUST_WALLET",
          eventDispatched: "daksh_data_updated",
          eventPayload: {
            entity: "wallet",
            action: "credit",
            targetId: playerId,
            amount
          },
          data: { playerId, currencyCode, amount, balance },
          message: `Credited ${amount} ${currencyCode} to player '${playerId}'. New balance: ${balance}`
        };
      }

      case "SET_TITLE_DATA": {
        const { key, value, scope, description } = intent.payload;
        const result = await TitleDataService.setTitleData({
          titleId,
          key,
          value,
          scope,
          description,
          validateJson: false
        });

        return {
          success: true,
          action: "SET_TITLE_DATA",
          eventDispatched: "daksh_data_updated",
          eventPayload: {
            entity: "title_data",
            action: "set",
            key,
            scope
          },
          data: result,
          message: `Set title data key '${key}' (Revision ${result.revision})`
        };
      }

      default:
        throw new Error(`UNHANDLED_ACTION: ${intent.action}`);
    }
  }
}
