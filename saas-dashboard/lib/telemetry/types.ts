export interface TelemetryEvent {
  eventId?: string;
  titleId: string;
  eventName: string;
  playerId: string;
  timestamp: number;
  properties: Record<string, any>;
  ingestedAt?: number;
}

export interface IngestionAck {
  status: number;
  acceptedCount: number;
  timestamp: number;
}
