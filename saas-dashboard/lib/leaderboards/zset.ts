import { LeaderboardEntry, SortOrder } from "./types";

interface InternalEntry {
  playerId: string;
  score: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class MemorySortedSet {
  private entriesMap: Map<string, InternalEntry> = new Map();
  private sortOrder: SortOrder;
  private cachedSorted: InternalEntry[] | null = null;

  constructor(sortOrder: SortOrder = "DESCENDING") {
    this.sortOrder = sortOrder;
  }

  private compare(a: InternalEntry, b: InternalEntry): number {
    if (a.score !== b.score) {
      return this.sortOrder === "DESCENDING" ? b.score - a.score : a.score - b.score;
    }
    // Tie-breaker: earlier timestamp wins (lower rank index)
    return a.timestamp - b.timestamp;
  }

  insertOrUpdate(
    playerId: string,
    score: number,
    timestamp: number = Date.now(),
    metadata?: Record<string, any>
  ): void {
    const entry: InternalEntry = { playerId, score, timestamp, metadata };
    this.entriesMap.set(playerId, entry);
    this.cachedSorted = null; // Invalidate cache
  }

  get(playerId: string): InternalEntry | undefined {
    return this.entriesMap.get(playerId);
  }

  private getSorted(): InternalEntry[] {
    if (!this.cachedSorted) {
      this.cachedSorted = Array.from(this.entriesMap.values()).sort((a, b) =>
        this.compare(a, b)
      );
    }
    return this.cachedSorted;
  }

  getRank(playerId: string): { rank: number; entry: LeaderboardEntry; totalPlayers: number } | null {
    if (!this.entriesMap.has(playerId)) return null;

    const sorted = this.getSorted();
    const index = sorted.findIndex(e => e.playerId === playerId);
    if (index === -1) return null;

    const found = sorted[index];
    return {
      rank: index + 1,
      totalPlayers: sorted.length,
      entry: {
        playerId: found.playerId,
        score: found.score,
        rank: index + 1,
        timestamp: found.timestamp,
        metadata: found.metadata
      }
    };
  }

  getTop(limit: number = 100): LeaderboardEntry[] {
    const sorted = this.getSorted();
    return sorted.slice(0, limit).map((e, idx) => ({
      playerId: e.playerId,
      score: e.score,
      rank: idx + 1,
      timestamp: e.timestamp,
      metadata: e.metadata
    }));
  }

  count(): number {
    return this.entriesMap.size;
  }

  clear(): void {
    this.entriesMap.clear();
    this.cachedSorted = null;
  }
}
