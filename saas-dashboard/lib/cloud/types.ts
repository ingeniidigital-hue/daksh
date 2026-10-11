export type SuperRegion = "iad" | "fra" | "bom" | "nrt" | "gru";

export interface SuperRegionInfo {
  id: SuperRegion;
  name: string;
  location: string;
  flag: string;
}

export const SUPER_REGIONS: Record<SuperRegion, SuperRegionInfo> = {
  iad: { id: "iad", name: "US East (Virginia)", location: "Ashburn, VA", flag: "🇺🇸" },
  fra: { id: "fra", name: "Europe (Frankfurt)", location: "Frankfurt, Germany", flag: "🇩🇪" },
  bom: { id: "bom", name: "Asia South (Mumbai)", location: "Mumbai, India", flag: "🇮🇳" },
  nrt: { id: "nrt", name: "Asia East (Tokyo)", location: "Tokyo, Japan", flag: "🇯🇵" },
  gru: { id: "gru", name: "South America (São Paulo)", location: "São Paulo, Brazil", flag: "🇧🇷" }
};

export interface CloudDeployment {
  titleId: string;
  status: "HEALTHY" | "DEPLOYING" | "DEGRADED";
  provisionedRegions: SuperRegion[];
  uptimeSla: string;
  tier: string;
  activeCcu: number;
  avgTickrateHz: number;
  deployedAt: number;
}

export interface AgonesServerInstance {
  serverId: string;
  titleId: string;
  region: SuperRegion;
  ip: string;
  port: number;
  status: "READY" | "ALLOCATED" | "SHUTDOWN";
  gameMode: string;
  allocatedAt?: number;
}

export interface FailoverResult {
  failoverSuccess: boolean;
  promotedReplica: string;
  uncommittedDataLoss: number;
}
