import { MatchmakingRuleset } from "./types";

export const DEFAULT_RULESETS: Record<string, MatchmakingRuleset> = {
  ruleset_1v1_ranked: {
    rulesetId: "ruleset_1v1_ranked",
    name: "1v1 Ranked Duel",
    mode: "1v1",
    teamCount: 2,
    playersPerTeam: 1,
    baseMmrTolerance: 50,
    flexSteps: [
      { afterSeconds: 5, mmrTolerance: 150, stageName: "STEP_1_RELAXED_150" },
      { afterSeconds: 10, mmrTolerance: 300, stageName: "STEP_2_RELAXED_300" },
      { afterSeconds: 15, mmrTolerance: 500, stageName: "STEP_3_RELAXED_500" }
    ],
    maxLatencyDelta: 150
  },
  ruleset_2v2_competitive: {
    rulesetId: "ruleset_2v2_competitive",
    name: "2v2 Competitive Arena",
    mode: "2v2",
    teamCount: 2,
    playersPerTeam: 2,
    baseMmrTolerance: 80,
    flexSteps: [
      { afterSeconds: 5, mmrTolerance: 150, stageName: "STEP_1_RELAXED_150" },
      { afterSeconds: 10, mmrTolerance: 300, stageName: "STEP_2_RELAXED_300" },
      { afterSeconds: 15, mmrTolerance: 500, stageName: "STEP_3_RELAXED_500" }
    ],
    maxLatencyDelta: 150
  }
};
