export enum RelayOpcode {
  POSITION = 1,
  VELOCITY = 2,
  ROTATION = 3,
  ANIMATION = 4,
  EVENT = 5,
  PEER_JOIN = 10,
  PEER_LEAVE = 11
}

export interface RelayRoom {
  roomId: string;
  titleId: string;
  maxClients: number;
  tickRateHz: number;
  connectedClients: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateRelayRoomRequest {
  titleId: string;
  maxClients?: number;
  tickRateHz?: number;
}

export interface DispatchPacketRequest {
  roomId: string;
  senderId: string;
  packet: Buffer;
  timestamp?: number;
}

export interface DispatchPacketResult {
  dropped: boolean;
  dropReason?: string;
  broadcastCount: number;
}

export interface DisconnectClientRequest {
  roomId: string;
  clientId: string;
  reason?: string;
}

export interface DisconnectClientResult {
  success: boolean;
  peerNotificationDispatched: boolean;
  remainingClients: string[];
}
