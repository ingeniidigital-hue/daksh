using System;
using System.Collections;
using System.Threading.Tasks;
using UnityEngine;

namespace Daksh.SDK
{
    /// <summary>
    /// Matchmaking subsystem.
    /// Handles ticket creation, matchmaking queue polling, and match-found event dispatch.
    /// </summary>
    public class DakshMatchmaking
    {
        private readonly DakshClient _client;
        private Coroutine _activePollCoroutine;

        public event Action<MatchmakingTicket> OnMatchFound;
        public event Action<MatchmakingTicket> OnMatchStatusUpdated;
        public event Action<string> OnMatchmakingFailed;

        public DakshMatchmaking(DakshClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Submits a matchmaking ticket for the authenticated player into the specified queue.
        /// </summary>
        public async Task<CreateTicketResponse> CreateTicketAsync(string rulesetId, int mmr = 1000)
        {
            if (!_client.Auth.IsAuthenticated)
            {
                throw new DakshException("Cannot queue for matchmaking: Player is not authenticated.");
            }

            var request = new CreateTicketRequest
            {
                rulesetId = rulesetId,
                queueTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                players = new[]
                {
                    new PlayerMatchInfo
                    {
                        playerId = _client.Auth.CurrentPlayer.id,
                        mmr = mmr
                    }
                }
            };

            string endpoint = $"/api/titles/{_client.Config.titleId}/multiplayer/matchmaking/tickets";
            string json = JsonUtility.ToJson(request);

            return await _client.PostAsync<CreateTicketResponse>(endpoint, json, requiresAuth: true);
        }

        /// <summary>
        /// Queries current status of an active matchmaking ticket.
        /// </summary>
        public async Task<GetTicketResponse> GetTicketAsync(string ticketId)
        {
            string endpoint = $"/api/titles/{_client.Config.titleId}/multiplayer/matchmaking/tickets?ticketId={ticketId}";
            return await _client.GetAsync<GetTicketResponse>(endpoint, useETag: false, requiresAuth: true);
        }

        /// <summary>
        /// Cancels a pending matchmaking ticket.
        /// </summary>
        public async Task<CancelTicketResponse> CancelTicketAsync(string ticketId)
        {
            StopPolling();
            string endpoint = $"/api/titles/{_client.Config.titleId}/multiplayer/matchmaking/tickets?ticketId={ticketId}";
            return await _client.DeleteAsync<CancelTicketResponse>(endpoint, requiresAuth: true);
        }

        /// <summary>
        /// Starts automatic coroutine polling for an active matchmaking ticket until a match is found or cancelled.
        /// </summary>
        public void StartPolling(string ticketId, float pollIntervalSeconds = 2.0f)
        {
            StopPolling();
            _activePollCoroutine = _client.StartCoroutine(PollTicketLoop(ticketId, pollIntervalSeconds));
        }

        public void StopPolling()
        {
            if (_activePollCoroutine != null)
            {
                _client.StopCoroutine(_activePollCoroutine);
                _activePollCoroutine = null;
            }
        }

        private IEnumerator PollTicketLoop(string ticketId, float interval)
        {
            while (true)
            {
                yield return new WaitForSeconds(interval);

                Task<GetTicketResponse> task = GetTicketAsync(ticketId);
                while (!task.IsCompleted)
                {
                    yield return null;
                }

                if (task.IsFaulted || task.Result == null || !task.Result.success)
                {
                    Debug.LogWarning($"[Daksh.Matchmaking] Polling error for ticket {ticketId}");
                    continue;
                }

                var ticket = task.Result.ticket;
                OnMatchStatusUpdated?.Invoke(ticket);

                if (ticket.status == "MATCHED")
                {
                    Debug.Log($"[Daksh.Matchmaking] Match found! Match ID: {ticket.matchId} (Region: {ticket.matchedRegion})");
                    OnMatchFound?.Invoke(ticket);
                    _activePollCoroutine = null;
                    yield break;
                }

                if (ticket.status == "CANCELLED")
                {
                    Debug.LogWarning($"[Daksh.Matchmaking] Ticket {ticketId} was cancelled.");
                    OnMatchmakingFailed?.Invoke("Ticket was cancelled.");
                    _activePollCoroutine = null;
                    yield break;
                }
            }
        }
    }
}
