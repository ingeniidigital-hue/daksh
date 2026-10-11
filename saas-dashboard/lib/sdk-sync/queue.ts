export interface QueuedAction {
  actionId: string;
  actionType: string;
  payload: Record<string, any>;
  timestamp: number;
  retryCount?: number;
}

export class OfflineActionQueue {
  private queue: QueuedAction[] = [];

  enqueue(action: QueuedAction): void {
    this.queue.push({
      ...action,
      retryCount: action.retryCount || 0
    });
  }

  size(): number {
    return this.queue.length;
  }

  peek(): QueuedAction | null {
    return this.queue[0] || null;
  }

  async replayAll(
    handler: (action: QueuedAction) => Promise<{ success: boolean; error?: string }>
  ): Promise<{ replayedCount: number; failedCount: number }> {
    let replayedCount = 0;
    let failedCount = 0;

    while (this.queue.length > 0) {
      const next = this.queue[0];
      try {
        const res = await handler(next);
        if (res.success) {
          this.queue.shift(); // Remove processed action
          replayedCount++;
        } else {
          failedCount++;
          break; // Stop replay on consecutive failure to preserve FIFO ordering
        }
      } catch (e) {
        failedCount++;
        break;
      }
    }

    return { replayedCount, failedCount };
  }

  clear(): void {
    this.queue = [];
  }
}
