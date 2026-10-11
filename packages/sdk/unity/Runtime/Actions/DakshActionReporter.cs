using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Daksh.SDK
{
    /// <summary>
    /// Zero-Trust Server-Authoritative Action Reporting Subsystem.
    /// Eliminates memory-editing and proxy tampering by preventing clients from ever directly setting state.
    /// The client reports gameplay action intentions; the server autonomously validates anti-cheat rules,
    /// calculates state deltas, and commits rewards.
    /// </summary>
    public class DakshActionReporter : IDakshSubsystem
    {
        private DakshClient _client;

        public string SubsystemName => "Actions";

        public event Action<ActionReportResult> OnActionResolved;
        public event Action<ActionReportResult> OnExploitDetected;

        public DakshActionReporter() { }

        public DakshActionReporter(DakshClient client)
        {
            Initialize(client);
        }

        public void Initialize(DakshClient client)
        {
            _client = client;
            Debug.Log("[Daksh.Actions] Initialized Zero-Trust Server-Authoritative Action Reporter.");
        }

        public void Shutdown()
        {
            Debug.Log("[Daksh.Actions] Shutdown Action Reporter subsystem.");
        }

        /// <summary>
        /// Reports an in-game action intention to the server for authoritative validation and reward calculation.
        /// The client NEVER specifies gold, XP, or inventory deltas — the server determines rewards exclusively.
        /// </summary>
        /// <param name="actionType">The category of action (e.g. "DUNGEON_CLEARED", "BOSS_DEFEATED", "DAILY_LOGIN").</param>
        /// <param name="customIdempotencyKey">Optional deduplication key. Auto-generated if omitted.</param>
        /// <param name="queueIfOffline">If true, enqueues the action into encrypted disk storage when disconnected.</param>
        public async Task<ActionReportResult> ReportActionAsync(
            string actionType,
            string customIdempotencyKey = null,
            bool queueIfOffline = true)
        {
            if (_client == null)
            {
                throw new InvalidOperationException("DakshActionReporter subsystem is not initialized.");
            }

            if (!_client.Auth.IsAuthenticated)
            {
                throw new DakshException("Cannot report action: Player is not authenticated. Login via DakshClient.Instance.Auth first.");
            }

            string actionId = $"act_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Guid.NewGuid():N}";
            string idempotencyKey = string.IsNullOrEmpty(customIdempotencyKey)
                ? $"tx_{actionId}"
                : customIdempotencyKey;

            var payload = new ActionReportPayload
            {
                actionId = actionId,
                playerId = _client.Auth.CurrentPlayer.id,
                actionType = actionType,
                idempotencyKey = idempotencyKey,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            string endpoint = $"/api/titles/{_client.Config.titleId}/actions/report";
            string json = JsonUtility.ToJson(payload);

            var result = await _client.PostAsync<ActionReportResult>(
                endpoint,
                json,
                requiresAuth: true,
                queueIfOffline: queueIfOffline,
                actionType: actionType
            );

            if (result != null)
            {
                if (result.antiCheatFlagged)
                {
                    Debug.LogWarning($"[Daksh.AntiCheat] Server flagged action '{actionType}' as exploit: {result.error}");
                    OnExploitDetected?.Invoke(result);
                }
                else if (result.success)
                {
                    Debug.Log($"[Daksh.Actions] Action '{actionType}' resolved authoritatively by server. Gold: {result.grantedRewards?.gold ?? 0}, XP: {result.grantedRewards?.xp ?? 0}");
                    OnActionResolved?.Invoke(result);
                }
            }

            return result;
        }
    }
}
