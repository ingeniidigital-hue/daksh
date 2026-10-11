using System;

namespace Daksh.SDK
{
    [Serializable]
    public class PlayerMatchInfo
    {
        public string playerId;
        public int mmr;
    }

    [Serializable]
    public class MatchmakingTicket
    {
        public string ticketId;
        public string titleId;
        public string rulesetId;
        public string status; // "QUEUED", "MATCHED", "CANCELLED"
        public long queueTimestamp;
        public int partyEffectiveMmr;
        public string matchId;
        public string matchedRegion;
    }

    [Serializable]
    public class CreateTicketRequest
    {
        public string rulesetId;
        public PlayerMatchInfo[] players;
        public long queueTimestamp;
    }

    [Serializable]
    public class CreateTicketResponse
    {
        public bool success;
        public MatchmakingTicket ticket;
    }

    [Serializable]
    public class GetTicketResponse
    {
        public bool success;
        public MatchmakingTicket ticket;
    }

    [Serializable]
    public class CancelTicketResponse
    {
        public bool success;
        public string message;
    }
}
