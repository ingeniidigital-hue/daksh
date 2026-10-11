using System;
using UnityEngine;

namespace Daksh.SDK
{
    /// <summary>
    /// High-performance real-time netcode helper for Unity.
    /// Implements client-side prediction, dead reckoning, and 21-byte binary packet serialization.
    /// </summary>
    public static class DakshRelay
    {
        public const int MaxDatagramBytes = 1024;
        public const int PositionDatagramLength = 21;

        /// <summary>
        /// Serializes transform into compact 21-byte binary datagram:
        /// [0] = Opcode (Position = 1)
        /// [1..4] = Sequence (uint32)
        /// [5..8] = PosX (float32)
        /// [9..12] = PosY (float32)
        /// [13..16] = PosZ (float32)
        /// [17..20] = Yaw (float32)
        /// </summary>
        public static byte[] PackPosition(uint sequence, Vector3 position, float yaw)
        {
            byte[] buffer = new byte[PositionDatagramLength];
            buffer[0] = (byte)RelayOpcode.Position;

            // Sequence (4 bytes Big-Endian)
            byte[] seqBytes = BitConverter.GetBytes(sequence);
            if (BitConverter.IsLittleEndian) Array.Reverse(seqBytes);
            Buffer.BlockCopy(seqBytes, 0, buffer, 1, 4);

            // X, Y, Z floats (4 bytes each Big-Endian)
            WriteBigEndianFloat(buffer, 5, position.x);
            WriteBigEndianFloat(buffer, 9, position.y);
            WriteBigEndianFloat(buffer, 13, position.z);

            // Yaw float (4 bytes Big-Endian)
            WriteBigEndianFloat(buffer, 17, yaw);

            return buffer;
        }

        /// <summary>
        /// Unpacks a 21-byte position datagram back into sequence, position vector, and yaw.
        /// </summary>
        public static bool TryUnpackPosition(byte[] buffer, out uint sequence, out Vector3 position, out float yaw)
        {
            sequence = 0;
            position = Vector3.zero;
            yaw = 0f;

            if (buffer == null || buffer.Length < PositionDatagramLength || buffer[0] != (byte)RelayOpcode.Position)
            {
                return false;
            }

            byte[] seqBytes = new byte[4];
            Buffer.BlockCopy(buffer, 1, seqBytes, 0, 4);
            if (BitConverter.IsLittleEndian) Array.Reverse(seqBytes);
            sequence = BitConverter.ToUInt32(seqBytes, 0);

            float x = ReadBigEndianFloat(buffer, 5);
            float y = ReadBigEndianFloat(buffer, 9);
            float z = ReadBigEndianFloat(buffer, 13);
            position = new Vector3(x, y, z);

            yaw = ReadBigEndianFloat(buffer, 17);
            return true;
        }

        /// <summary>
        /// Extrapolates predicted position based on last verified position, velocity vector, and latency delta time.
        /// Formula: P_pred = P_0 + (V * dt)
        /// </summary>
        public static Vector3 ExtrapolateDeadReckoning(Vector3 lastPosition, Vector3 velocity, float latencySeconds)
        {
            return lastPosition + (velocity * latencySeconds);
        }

        /// <summary>
        /// Performs smooth visual interpolation (Hermite/LERP) between current render position and target network position.
        /// </summary>
        public static Vector3 SmoothPosition(Vector3 currentRenderPos, Vector3 targetNetworkPos, float smoothFactor, float deltaTime)
        {
            return Vector3.Lerp(currentRenderPos, targetNetworkPos, 1.0f - Mathf.Exp(-smoothFactor * deltaTime));
        }

        private static void WriteBigEndianFloat(byte[] buffer, int offset, float value)
        {
            byte[] bytes = BitConverter.GetBytes(value);
            if (BitConverter.IsLittleEndian) Array.Reverse(bytes);
            Buffer.BlockCopy(bytes, 0, buffer, offset, 4);
        }

        private static float ReadBigEndianFloat(byte[] buffer, int offset)
        {
            byte[] bytes = new byte[4];
            Buffer.BlockCopy(buffer, offset, bytes, 0, 4);
            if (BitConverter.IsLittleEndian) Array.Reverse(bytes);
            return BitConverter.ToSingle(bytes, 0);
        }
    }
}
