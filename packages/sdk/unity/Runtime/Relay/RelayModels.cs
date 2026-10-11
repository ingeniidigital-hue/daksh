using System;

namespace Daksh.SDK
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

    [Serializable]
    public class RelayRoomInfo
    {
        public string roomId;
        public string titleId;
        public int peerCount;
        public int maxPeers;
    }

    [Serializable]
    public class RelayDispatchResponse
    {
        public bool success;
        public int broadcastCount;
        public bool dropped;
        public string reason;
    }
}
