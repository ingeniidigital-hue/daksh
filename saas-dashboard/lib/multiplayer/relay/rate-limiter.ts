export const MAX_DATAGRAM_SIZE = 1024; // 1024 bytes
export const MAX_PACKETS_PER_SEC = 60; // 60 Hz rate limit

interface ClientRateLimitState {
  windowStart: number;
  packetCount: number;
}

const clientRateLimits = new Map<string, ClientRateLimitState>();

export function resetRateLimits(): void {
  clientRateLimits.clear();
}

/**
 * Validates datagram size and sliding-window rate limit per client.
 */
export function validatePacketIngress(
  senderId: string,
  packet: Buffer,
  timestamp: number = Date.now()
): { valid: boolean; reason?: string } {
  // 1. Enforce Datagram Size
  if (packet.length > MAX_DATAGRAM_SIZE) {
    return {
      valid: false,
      reason: "MAX_PACKET_SIZE_EXCEEDED"
    };
  }

  // 2. Enforce 60 packets/second rate limit
  const state = clientRateLimits.get(senderId);

  if (!state) {
    clientRateLimits.set(senderId, {
      windowStart: timestamp,
      packetCount: 1
    });
    return { valid: true };
  }

  // Check if current 1-second window has expired
  if (timestamp - state.windowStart >= 1000) {
    state.windowStart = timestamp;
    state.packetCount = 1;
    return { valid: true };
  }

  // Increment within current window
  state.packetCount++;
  if (state.packetCount > MAX_PACKETS_PER_SEC) {
    return {
      valid: false,
      reason: "RATE_LIMIT_EXCEEDED"
    };
  }

  return { valid: true };
}
