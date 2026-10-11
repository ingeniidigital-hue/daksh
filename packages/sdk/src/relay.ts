export interface CreateRelayRoomParams {
  titleId: string;
  maxClients?: number;
  tickRateHz?: number;
  endpoint?: string;
}

export interface DispatchRelayPacketParams {
  titleId: string;
  roomId: string;
  senderId: string;
  packet: Uint8Array;
  endpoint?: string;
}

export class DakshRelayClient {
  /**
   * Creates a real-time relay netcode room instance.
   */
  public static async createRoomAsync(params: CreateRelayRoomParams) {
    const endpoint = params.endpoint || "http://localhost:3000";
    const res = await fetch(`${endpoint}/api/titles/${params.titleId}/multiplayer/relay/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maxClients: params.maxClients || 32,
        tickRateHz: params.tickRateHz || 30
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`[Daksh.Relay] Create room failed: ${data.error || res.statusText}`);
    }
    return data.room;
  }

  /**
   * Dispatches a binary datagram to all peers in the room.
   */
  public static async dispatchPacketAsync(params: DispatchRelayPacketParams) {
    const endpoint = params.endpoint || "http://localhost:3000";
    const res = await fetch(
      `${endpoint}/api/titles/${params.titleId}/multiplayer/relay/rooms/${params.roomId}/packet`,
      {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream", "x-sender-id": params.senderId },
        body: params.packet
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`[Daksh.Relay] Packet dispatch failed: ${data.error || res.statusText}`);
    }
    return data;
  }
}
