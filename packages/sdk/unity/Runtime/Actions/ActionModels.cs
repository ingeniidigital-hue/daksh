using System;

namespace Daksh.SDK
{
    [Serializable]
    public class ActionReportPayload
    {
        public string actionId;
        public string playerId;
        public string actionType;
        public string idempotencyKey;
        public long timestamp;
    }

    [Serializable]
    public class ServerRewardItem
    {
        public string itemId;
        public string name;
        public int quantity;
    }

    [Serializable]
    public class GrantedRewards
    {
        public int gold;
        public int xp;
        public ServerRewardItem[] items;
    }

    [Serializable]
    public class ActionReportResult
    {
        public bool success;
        public string actionId;
        public string actionType;
        public bool isDeduped;
        public bool antiCheatFlagged;
        public string error;
        public GrantedRewards grantedRewards;
        public string serverSignature;
    }
}
