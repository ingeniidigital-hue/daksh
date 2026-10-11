export interface AirgapVerificationOptions {
  simulatedOffline: boolean;
  deviceId: string;
}

export interface AirgapResult {
  externalNetworkCallsBlocked: boolean;
  deviceAuthSuccess: boolean;
  walletDebitSuccess: boolean;
  inventoryGranted: boolean;
  errors: string[];
}

export interface StressOptions {
  titleId: string;
  virtualUsers: number;
  operationsPerUser: number;
  targetP99Ms: number;
}

export interface StressResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRatePercent: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
  durationMs: number;
}

export interface BuildCheckResult {
  isCompiled: boolean;
  routeCount: number;
  hasTypeErrors: boolean;
}

export interface OwaspAuditOptions {
  sqlInjectionVectors: string[];
  xssVectors: string[];
  tamperedTokens: string[];
}

export interface OwaspReport {
  highVulnerabilities: number;
  criticalVulnerabilities: number;
  passedAllChecks: boolean;
  scannedVectorsCount: number;
}
