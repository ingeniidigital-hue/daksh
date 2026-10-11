import { RelayOpcode } from "./types";

export interface PositionPacketData {
  opcode: RelayOpcode;
  sequence: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export class BinaryPacketCodec {
  /**
   * Encodes a 3D position and orientation transform into a compact binary packet.
   * Format:
   * [0]     : uint8 opcode (1 = POSITION)
   * [1..4]  : uint32 sequence
   * [5..8]  : float32 X
   * [9..12] : float32 Y
   * [13..16]: float32 Z
   * [17..20]: float32 Yaw
   * Total length: 21 bytes
   */
  public static encodePosition(data: PositionPacketData): Buffer {
    const buf = Buffer.alloc(21);
    buf.writeUInt8(data.opcode, 0);
    buf.writeUInt32BE(data.sequence, 1);
    buf.writeFloatBE(data.x, 5);
    buf.writeFloatBE(data.y, 9);
    buf.writeFloatBE(data.z, 13);
    buf.writeFloatBE(data.yaw, 17);
    return buf;
  }

  /**
   * Decodes a binary position packet.
   */
  public static decodePosition(buffer: Buffer): PositionPacketData {
    if (buffer.length < 21) {
      throw new Error(`INVALID_PACKET_LENGTH: Buffer is ${buffer.length} bytes, expected at least 21 bytes`);
    }

    const opcode = buffer.readUInt8(0) as RelayOpcode;
    const sequence = buffer.readUInt32BE(1);
    const x = buffer.readFloatBE(5);
    const y = buffer.readFloatBE(9);
    const z = buffer.readFloatBE(13);
    const yaw = buffer.readFloatBE(17);

    return { opcode, sequence, x, y, z, yaw };
  }
}
