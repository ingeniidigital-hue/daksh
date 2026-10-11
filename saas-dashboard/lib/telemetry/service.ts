import { randomUUID } from "crypto";
import { TelemetryEvent, IngestionAck } from "./types";
import { scrubPii } from "./pii";
import { RingBufferFlusher } from "./ring-buffer";

const MAX_EVENT_PAYLOAD_BYTES = 4096; // 4KB Limit

export class PayloadTooLargeError extends Error {
  public bytes: number;
  public maxBytes: number;

  constructor(bytes: number, maxBytes: number) {
    super(`Payload size (${bytes} bytes) exceeds maximum allowable limit of ${maxBytes} bytes`);
    this.name = "PayloadTooLargeError";
    this.bytes = bytes;
    this.maxBytes = maxBytes;
  }
}

interface StoredTelemetryState {
  events: TelemetryEvent[];
}

const storage: Map<string, StoredTelemetryState> = new Map();
const flushListeners: Array<(events: TelemetryEvent[]) => void> = [];

function getTitleStorage(titleId: string): StoredTelemetryState {
  let s = storage.get(titleId);
  if (!s) {
    s = { events: [] };
    storage.set(titleId, s);
  }
  return s;
}

const flusher = new RingBufferFlusher(1000, 1000, (flushedChunk) => {
  for (const event of flushedChunk) {
    const s = getTitleStorage(event.titleId);
    s.events.push(event);
  }
  for (const listener of flushListeners) {
    try {
      listener(flushedChunk);
    } catch (e) {
      console.error("Flush listener error", e);
    }
  }
});

export async function resetTelemetryStorage(): Promise<void> {
  flusher.flush();
  storage.clear();
  flushListeners.length = 0;
}

export class TelemetryIngestionService {
  private static validateAndPrepare(titleId: string, event: TelemetryEvent): TelemetryEvent {
    const serialized = JSON.stringify(event);
    const bytes = Buffer.byteLength(serialized, "utf8");

    if (bytes > MAX_EVENT_PAYLOAD_BYTES) {
      throw new PayloadTooLargeError(bytes, MAX_EVENT_PAYLOAD_BYTES);
    }

    const scrubbedProps = scrubPii(event.properties || {});

    return {
      eventId: event.eventId || `evt_${randomUUID()}`,
      titleId,
      eventName: event.eventName,
      playerId: event.playerId,
      timestamp: event.timestamp || Date.now(),
      properties: scrubbedProps,
      ingestedAt: Date.now()
    };
  }

  static async ingestEvent(titleId: string, event: TelemetryEvent): Promise<IngestionAck> {
    const prepared = this.validateAndPrepare(titleId, event);
    flusher.push(prepared);

    return {
      status: 202,
      acceptedCount: 1,
      timestamp: Date.now()
    };
  }

  static async ingestBatch(titleId: string, events: TelemetryEvent[]): Promise<IngestionAck> {
    const preparedBatch: TelemetryEvent[] = new Array(events.length);
    for (let i = 0; i < events.length; i++) {
      preparedBatch[i] = this.validateAndPrepare(titleId, events[i]);
    }

    flusher.pushBatch(preparedBatch);

    return {
      status: 202,
      acceptedCount: events.length,
      timestamp: Date.now()
    };
  }

  static async flushAll(): Promise<void> {
    flusher.flush();
  }

  static async getEventCount(titleId: string): Promise<number> {
    const s = getTitleStorage(titleId);
    return s.events.length;
  }

  static async queryRecentEvents(titleId: string, limit: number = 50): Promise<TelemetryEvent[]> {
    const s = getTitleStorage(titleId);
    return s.events.slice(-limit).reverse();
  }

  static onFlush(callback: (events: TelemetryEvent[]) => void): () => void {
    flushListeners.push(callback);
    return () => {
      const idx = flushListeners.indexOf(callback);
      if (idx !== -1) flushListeners.splice(idx, 1);
    };
  }
}
