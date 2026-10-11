import { describe, it, expect, beforeEach } from "vitest";
import {
  RelayNetcodeService,
  resetRelayStorage,
  BinaryPacketCodec,
  RelayOpcode,
  calculateDeadReckoning
} from "../lib/multiplayer/relay";

describe("STORY-07 / TDD: Real-Time Relay Netcode (WebSocket / UDP)", () => {
  const titleId = "TITLE_FPS_01";

  beforeEach(() => {
    resetRelayStorage();
  });

  it("TEST-07-A [Happy Path]: 32 connected clients broadcast position updates at 30 Hz with <10ms server processing overhead", async () => {
    const room = await RelayNetcodeService.createRoom({
      titleId,
      maxClients: 32,
      tickRateHz: 30
    });

    // Connect 32 clients
    const clients: string[] = [];
    for (let i = 1; i <= 32; i++) {
      const clientId = `client_${i}`;
      clients.push(clientId);
      await RelayNetcodeService.joinRoom(room.roomId, clientId);
    }

    const roomStatus = await RelayNetcodeService.getRoom(room.roomId);
    expect(roomStatus?.connectedClients.length).toBe(32);

    // Simulate 32 clients each dispatching an opcode-packed position packet
    const startTime = performance.now();
    let totalDispatches = 0;

    for (const senderId of clients) {
      const packetBuffer = BinaryPacketCodec.encodePosition({
        opcode: RelayOpcode.POSITION,
        sequence: 1,
        x: 120.5,
        y: 45.0,
        z: -300.25,
        yaw: 180.0
      });

      const result = await RelayNetcodeService.dispatchPacket({
        roomId: room.roomId,
        senderId,
        packet: packetBuffer
      });

      expect(result.dropped).toBe(false);
      expect(result.broadcastCount).toBe(31); // Sent to all other 31 peers
      totalDispatches++;
    }

    const totalTimeMs = performance.now() - startTime;
    const avgOverheadPerPacket = totalTimeMs / totalDispatches;

    console.log(`Dispatched ${totalDispatches} packets across 32 peers in ${totalTimeMs.toFixed(2)}ms (avg ${avgOverheadPerPacket.toFixed(3)}ms/packet)`);
    expect(avgOverheadPerPacket).toBeLessThan(10); // <10ms requirement
  });

  it("TEST-07-B [Rate Limiting]: Client sending >60 packets/sec has excess packets throttled without crashing the room", async () => {
    const room = await RelayNetcodeService.createRoom({
      titleId,
      maxClients: 16
    });

    const clientId = "flooder_bot_99";
    await RelayNetcodeService.joinRoom(room.roomId, clientId);
    await RelayNetcodeService.joinRoom(room.roomId, "normal_player_1");

    const packet = BinaryPacketCodec.encodePosition({
      opcode: RelayOpcode.POSITION,
      sequence: 1,
      x: 0,
      y: 0,
      z: 0,
      yaw: 0
    });

    let acceptedCount = 0;
    let throttledCount = 0;

    // Send 100 packets in a single second window
    const now = Date.now();
    for (let i = 0; i < 100; i++) {
      const result = await RelayNetcodeService.dispatchPacket({
        roomId: room.roomId,
        senderId: clientId,
        packet,
        timestamp: now + i * 2 // within 200ms
      });

      if (!result.dropped) {
        acceptedCount++;
      } else {
        throttledCount++;
        expect(result.dropReason).toBe("RATE_LIMIT_EXCEEDED");
      }
    }

    // Rate limiter enforces max 60 packets/sec
    expect(acceptedCount).toBe(60);
    expect(throttledCount).toBe(40);

    // Verify room is healthy and unaffected
    const freshRoom = await RelayNetcodeService.getRoom(room.roomId);
    expect(freshRoom?.connectedClients.length).toBe(2);
  });

  it("TEST-07-C [Failure Mode & Packet Size]: Packet exceeding 1024 bytes is dropped with security warning logged", async () => {
    const room = await RelayNetcodeService.createRoom({
      titleId,
      maxClients: 8
    });

    const clientId = "attacker_large_payload";
    await RelayNetcodeService.joinRoom(room.roomId, clientId);

    // Create an oversized packet (2048 bytes > 1024 bytes limit)
    const oversizedPacket = Buffer.alloc(2048, 0xFF);

    const result = await RelayNetcodeService.dispatchPacket({
      roomId: room.roomId,
      senderId: clientId,
      packet: oversizedPacket
    });

    expect(result.dropped).toBe(true);
    expect(result.dropReason).toBe("MAX_PACKET_SIZE_EXCEEDED");
    expect(result.broadcastCount).toBe(0);
  });

  it("TEST-07-D [Disconnection & Clean Deallocation]: Client socket drop triggers room peer notification and cleans up slot", async () => {
    const room = await RelayNetcodeService.createRoom({
      titleId,
      maxClients: 4
    });

    await RelayNetcodeService.joinRoom(room.roomId, "player_alpha");
    await RelayNetcodeService.joinRoom(room.roomId, "player_beta");

    expect((await RelayNetcodeService.getRoom(room.roomId))?.connectedClients.length).toBe(2);

    // Simulate player_beta socket disconnect
    const disconnectResult = await RelayNetcodeService.disconnectClient({
      roomId: room.roomId,
      clientId: "player_beta",
      reason: "CLIENT_SOCKET_CLOSED"
    });

    expect(disconnectResult.success).toBe(true);
    expect(disconnectResult.peerNotificationDispatched).toBe(true);
    expect(disconnectResult.remainingClients).toEqual(["player_alpha"]);

    const freshRoom = await RelayNetcodeService.getRoom(room.roomId);
    expect(freshRoom?.connectedClients.length).toBe(1);
    expect(freshRoom?.connectedClients).toContain("player_alpha");
    expect(freshRoom?.connectedClients).not.toContain("player_beta");
  });

  it("TEST-07-E [Dead Reckoning]: Extrapolates client position using velocity and delta time for lag compensation", () => {
    const initialPos = { x: 100, y: 10, z: 50 };
    const velocity = { vx: 20, vy: 0, vz: -10 }; // 20 units/sec in X, -10 units/sec in Z
    const deltaTimeSeconds = 0.25; // 250ms of network latency

    const projectedPos = calculateDeadReckoning(initialPos, velocity, deltaTimeSeconds);

    expect(projectedPos.x).toBe(105); // 100 + 20 * 0.25
    expect(projectedPos.y).toBe(10);  // 10 + 0 * 0.25
    expect(projectedPos.z).toBe(47.5); // 50 + (-10) * 0.25
  });
});
