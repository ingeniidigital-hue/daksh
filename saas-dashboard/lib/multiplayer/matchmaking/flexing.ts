import { MatchmakingRuleset, MatchmakingTicket } from "./types";

export interface ActiveFlexTolerance {
  mmrTolerance: number;
  stageName?: string;
  waitTimeSec: number;
}

export function calculateFlexTolerance(
  ticket: MatchmakingTicket,
  ruleset: MatchmakingRuleset,
  currentTime: number = Date.now()
): ActiveFlexTolerance {
  const waitTimeSec = Math.max(0, (currentTime - ticket.queueTimestamp) / 1000);
  let mmrTolerance = ruleset.baseMmrTolerance;
  let stageName: string | undefined = undefined;

  // Sort flex steps by afterSeconds ascending
  const sortedSteps = [...ruleset.flexSteps].sort((a, b) => a.afterSeconds - b.afterSeconds);

  for (const step of sortedSteps) {
    if (waitTimeSec >= step.afterSeconds) {
      mmrTolerance = step.mmrTolerance;
      stageName = step.stageName;
    }
  }

  return {
    mmrTolerance,
    stageName,
    waitTimeSec
  };
}

export function getPairwiseFlexTolerance(
  ticketA: MatchmakingTicket,
  ticketB: MatchmakingTicket,
  ruleset: MatchmakingRuleset,
  currentTime: number = Date.now()
): { mmrTolerance: number; stageName?: string } {
  const flexA = calculateFlexTolerance(ticketA, ruleset, currentTime);
  const flexB = calculateFlexTolerance(ticketB, ruleset, currentTime);

  if (flexA.mmrTolerance >= flexB.mmrTolerance) {
    return {
      mmrTolerance: flexA.mmrTolerance,
      stageName: flexA.stageName
    };
  } else {
    return {
      mmrTolerance: flexB.mmrTolerance,
      stageName: flexB.stageName
    };
  }
}
