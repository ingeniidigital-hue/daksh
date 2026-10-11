import { TelemetryEvent } from "./types";

export type FlushHandler = (events: TelemetryEvent[]) => Promise<void> | void;

export class RingBufferFlusher {
  private buffer: TelemetryEvent[] = [];
  private maxBatchSize: number;
  private flushIntervalMs: number;
  private flushHandler: FlushHandler;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    maxBatchSize: number = 1000,
    flushIntervalMs: number = 1000,
    flushHandler: FlushHandler
  ) {
    this.maxBatchSize = maxBatchSize;
    this.flushIntervalMs = flushIntervalMs;
    this.flushHandler = flushHandler;
    this.startTimer();
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
    // Don't keep Node alive if only timer is running in tests
    if (this.timer.unref) this.timer.unref();
  }

  push(event: TelemetryEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  pushBatch(events: TelemetryEvent[]): void {
    for (const e of events) {
      this.buffer.push(e);
      if (this.buffer.length >= this.maxBatchSize) {
        this.flush();
      }
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;
    const toFlush = [...this.buffer];
    this.buffer = [];
    this.flushHandler(toFlush);
  }

  size(): number {
    return this.buffer.length;
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }
}
