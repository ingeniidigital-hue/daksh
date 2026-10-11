using System;
using UnityEngine;

namespace Daksh.Multiplayer
{
    public enum RelayOpcode : byte
    {
        Position = 1,
        Velocity = 2,
        Rotation = 3,
        Animation = 4,
        Event = 5,
        PeerJoin = 10,
        PeerLeave = 11
    }

    /// <summary>
    /// High-performance real-time netcode helper for Unity.
    /// Implements client-side prediction, dead reckoning, and binary packet packing.
    /// </summary>
    public static class DakshRelay
    {
        public const int MaxDatagramBytes = 1024;

        /// <summary>
        /// Serializes transform into compact 21-byte binary datagram.
        /// </summary>
        public static byte[] PackPosition(uint sequence, Vector3 position, float yaw)
        {
            byte[] buffer = new byte[21];
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
        /// Extrapolates predicted position based on last verified position, velocity vector, and latency delta time.
        /// Formula: P_pred = P_0 + (V * dt)
        /// </summary>
        public static Vector3 ExtrapolateDeadReckoning(Vector3 lastPosition, Vector3 velocity, float latencySeconds)
        {
            return lastPosition + (velocity * latencySeconds);
        }

        /// <summary>
        /// Performs smooth visual interpolation (Hermite/LERP) between current render position and predicted network position.
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
    }
}
