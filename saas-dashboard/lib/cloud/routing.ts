import { SuperRegion, SUPER_REGIONS } from "./types";

const COUNTRY_TO_REGION_MAP: Record<string, SuperRegion> = {
  IN: "bom",
  PK: "bom",
  BD: "bom",
  LK: "bom",
  NP: "bom",
  DE: "fra",
  FR: "fra",
  GB: "fra",
  NL: "fra",
  IT: "fra",
  ES: "fra",
  PL: "fra",
  US: "iad",
  CA: "iad",
  MX: "iad",
  JP: "nrt",
  KR: "nrt",
  TW: "nrt",
  HK: "nrt",
  SG: "bom",
  BR: "gru",
  AR: "gru",
  CL: "gru",
  CO: "gru"
};

export function routeNearestPoP(client: {
  ipCountry?: string;
  latencyMap?: Record<string, number>;
}): { selectedRegion: SuperRegion; expectedPingMs: number } {
  // 1. If client provided explicit ping latency map across Super Regions, pick lowest ping
  if (client.latencyMap && Object.keys(client.latencyMap).length > 0) {
    let bestRegion: SuperRegion = "bom";
    let lowestPing = Infinity;

    for (const [reg, ping] of Object.entries(client.latencyMap)) {
      const lowerReg = reg.toLowerCase() as SuperRegion;
      if (SUPER_REGIONS[lowerReg] && ping < lowestPing) {
        lowestPing = ping;
        bestRegion = lowerReg;
      }
    }

    if (lowestPing < Infinity) {
      return {
        selectedRegion: bestRegion,
        expectedPingMs: lowestPing
      };
    }
  }

  // 2. Fallback to GeoIP Country code
  const country = (client.ipCountry || "").toUpperCase();
  const matchedRegion = COUNTRY_TO_REGION_MAP[country] || "bom";

  // Estimated baseline ping based on regional PoP
  const estimatedPings: Record<SuperRegion, number> = {
    bom: 18,
    fra: 14,
    iad: 22,
    nrt: 25,
    gru: 35
  };

  return {
    selectedRegion: matchedRegion,
    expectedPingMs: estimatedPings[matchedRegion] || 25
  };
}
