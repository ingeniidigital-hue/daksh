import { EventEmitter } from "events";
import { QueueTelemetry } from "./types";

interface TitleXRayState {
  latestTelemetry: QueueTelemetry;
  emitter: EventEmitter;
}

const xrayStores: Map<string, TitleXRayState> = new Map();

function getXRayState(titleId: string): TitleXRayState {
  let state = xrayStores.get(titleId);
  if (!state) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(100);
    state = {
      latestTelemetry: {
        activeQueuedTickets: 0,
        avgWaitTimeSeconds: 0,
        matchesFormedLastMinute: 0,
        regionalDistribution: {},
        timestamp: Date.now()
      },
      emitter
    };
    xrayStores.set(titleId, state);
  }
  return state;
}

export function resetXRayStorage(): void {
  for (const state of xrayStores.values()) {
    state.emitter.removeAllListeners();
  }
  xrayStores.clear();
}

export class MatchmakingXRayService {
  static subscribeToTelemetry(
    titleId: string,
    listener: (data: QueueTelemetry) => void
  ): () => void {
    const state = getXRayState(titleId);
    state.emitter.on("telemetry", listener);
    return () => {
      state.emitter.off("telemetry", listener);
    };
  }

  static publishTelemetry(
    titleId: string,
    data: Partial<QueueTelemetry>
  ): QueueTelemetry {
    const state = getXRayState(titleId);
    const updated: QueueTelemetry = {
      ...state.latestTelemetry,
      ...data,
      timestamp: Date.now()
    };
    state.latestTelemetry = updated;
    state.emitter.emit("telemetry", updated);
    return updated;
  }

  static getLatestTelemetry(titleId: string): QueueTelemetry {
    const state = getXRayState(titleId);
    return { ...state.latestTelemetry };
  }
}
