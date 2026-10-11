export interface QueueTelemetry {
  activeQueuedTickets: number;
  avgWaitTimeSeconds: number;
  matchesFormedLastMinute: number;
  regionalDistribution: Record<string, number>;
  timestamp: number;
}
