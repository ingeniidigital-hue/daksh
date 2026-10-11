import { TurnBasedMatch } from "./types";

// In-memory active rooms store. Matches run at 0 DB compute during gameplay.
const activeMatches = new Map<string, TurnBasedMatch>();

export function resetTurnBasedStorage(): void {
  activeMatches.clear();
}

export function saveMatchInMemory(match: TurnBasedMatch): void {
  activeMatches.set(match.matchId, match);
}

export function getMatchFromMemory(matchId: string): TurnBasedMatch | null {
  return activeMatches.get(matchId) || null;
}

export function listMatchesInMemory(titleId?: string): TurnBasedMatch[] {
  const matches = Array.from(activeMatches.values());
  if (titleId) {
    return matches.filter(m => m.titleId === titleId);
  }
  return matches;
}
