using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Daksh.SDK
{
    /// <summary>
    /// Redis-backed global leaderboards subsystem with microsecond tiebreaking
    /// and client-side offline score submission fallback.
    /// </summary>
    public class DakshLeaderboards
    {
        private readonly DakshClient _client;

        public event Action<ScoreSubmissionResult> OnScoreSubmitted;

        public DakshLeaderboards(DakshClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Submits a player's score to the specified leaderboard.
        /// Automatically records microsecond tiebreaker metadata.
        /// Can enqueue into local offline queue if disconnected.
        /// </summary>
        public async Task<ScoreSubmissionResult> SubmitScoreAsync(string leaderboardId, double score, bool queueIfOffline = true)
        {
            if (!_client.Auth.IsAuthenticated)
            {
                throw new DakshException("Cannot submit leaderboard score: Player is not authenticated.");
            }

            var payload = new ScoreSubmissionPayload
            {
                playerId = _client.Auth.CurrentPlayer.id,
                score = score,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            string endpoint = $"/api/titles/{_client.Config.titleId}/leaderboards/{leaderboardId}/scores";
            string json = JsonUtility.ToJson(payload);

            var result = await _client.PostAsync<ScoreSubmissionResult>(
                endpoint,
                json,
                requiresAuth: true,
                queueIfOffline: queueIfOffline,
                actionType: "LEADERBOARD_SCORE_SUBMISSION"
            );

            if (result != null && result.success)
            {
                Debug.Log($"[Daksh.Leaderboard] Score {score} submitted to {leaderboardId}. New Rank: {result.rank}/{result.totalPlayers}");
                OnScoreSubmitted?.Invoke(result);
            }

            return result;
        }

        /// <summary>
        /// Retrieves the top scores from the specified leaderboard.
        /// </summary>
        public async Task<TopScoresResponse> GetTopScoresAsync(string leaderboardId, int limit = 50)
        {
            string endpoint = $"/api/titles/{_client.Config.titleId}/leaderboards/{leaderboardId}/scores?limit={limit}";
            return await _client.GetAsync<TopScoresResponse>(endpoint, useETag: false, requiresAuth: false);
        }

        /// <summary>
        /// Retrieves the specific rank and score for a player.
        /// If playerId is null, queries the currently authenticated player.
        /// </summary>
        public async Task<PlayerRankResponse> GetPlayerRankAsync(string leaderboardId, string playerId = null)
        {
            string targetPlayerId = playerId ?? _client.Auth.CurrentPlayer?.id;
            if (string.IsNullOrEmpty(targetPlayerId))
            {
                throw new DakshException("No playerId specified and no active authenticated player session found.");
            }

            string endpoint = $"/api/titles/{_client.Config.titleId}/leaderboards/{leaderboardId}/scores?playerId={targetPlayerId}";
            return await _client.GetAsync<PlayerRankResponse>(endpoint, useETag: false, requiresAuth: false);
        }
    }
}
