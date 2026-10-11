import { randomUUID } from "crypto";
import { SecurityAlert } from "./types";

export class AntiCheatViolationError extends Error {
  public attemptedDelta: number;
  public maxAllowedDelta: number;

  constructor(message: string, attemptedDelta: number, maxAllowedDelta: number) {
    super(message);
    this.name = "AntiCheatViolationError";
    this.attemptedDelta = attemptedDelta;
    this.maxAllowedDelta = maxAllowedDelta;
  }
}

export function validateScoreDelta(params: {
  titleId: string;
  leaderboardId: string;
  playerId: string;
  newScore: number;
  previousScore?: number;
  maxScoreDelta?: number;
}): SecurityAlert | null {
  const { titleId, leaderboardId, playerId, newScore, previousScore, maxScoreDelta } = params;

  if (maxScoreDelta !== undefined && previousScore !== undefined) {
    const delta = Math.abs(newScore - previousScore);
    if (delta > maxScoreDelta) {
      const alert: SecurityAlert = {
        alertId: `alert_${randomUUID()}`,
        titleId,
        leaderboardId,
        playerId,
        reason: `Score delta ${delta} exceeds maximum allowable delta ${maxScoreDelta}`,
        attemptedScore: newScore,
        previousScore,
        attemptedDelta: delta,
        timestamp: Date.now()
      };
      return alert;
    }
  }

  return null;
}
