using System;

namespace Daksh.SDK
{
    [Serializable]
    public class LeaderboardEntry
    {
        public string playerId;
        public double score;
        public int rank;
        public long timestamp;
        public string displayName;
    }

    [Serializable]
    public class ScoreSubmissionPayload
    {
        public string playerId;
        public double score;
        public long timestamp;
    }

    [Serializable]
    public class ScoreSubmissionResult
    {
        public bool success;
        public string playerId;
        public double score;
        public int rank;
        public int totalPlayers;
        public long timestamp;
    }

    [Serializable]
    public class TopScoresResponse
    {
        public bool success;
        public LeaderboardEntry[] topScores;
    }

    [Serializable]
    public class PlayerRankResponse
    {
        public bool success;
        public LeaderboardEntry entry;
    }
}
