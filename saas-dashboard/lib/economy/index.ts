export * from "./types";
export * from "./wallet";
export * from "./catalog";
export * from "./service";

import { resetWalletsStorage } from "./wallet";
import { resetCatalogStorage } from "./catalog";
import { resetServiceStorage } from "./service";

export function resetEconomyStorage() {
  resetWalletsStorage();
  resetCatalogStorage();
  resetServiceStorage();
}
