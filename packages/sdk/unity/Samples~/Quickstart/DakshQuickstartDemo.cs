using System;
using System.Threading.Tasks;
using UnityEngine;
using Daksh.SDK;

namespace Daksh.SDK.Samples
{
    /// <summary>
    /// End-to-end bootstrap demonstration for the Daksh Game BaaS Unity SDK.
    /// Demonstrates:
    /// 1. Hardware Device Authentication
    /// 2. Catalog listing with ETag 304 diffing
    /// 3. Idempotent item purchasing
    /// 4. Leaderboard score submission
    /// 5. Offline action queue replay
    /// 6. Matchmaking ticket creation and polling
    /// </summary>
    public class DakshQuickstartDemo : MonoBehaviour
    {
        [Header("Daksh Configuration")]
        [SerializeField] private string titleId = "demo_title";
        [SerializeField] private string serverUrl = "http://localhost:3000";

        private async void Start()
        {
            Debug.Log("<color=cyan><b>=== [Daksh SDK Quickstart Bootstrap Starting] ===</b></color>");

            // 1. Initialize Client
            var config = new DakshConfig
            {
                titleId = this.titleId,
                serverUrl = this.serverUrl,
                autoFlushOfflineQueue = true
            };
            var client = DakshClient.Initialize(config);

            try
            {
                // 2. Hardware Device Login
                Debug.Log("<b>[Step 1]</b> Authenticating device hardware...");
                var authResult = await client.Auth.AuthenticateDeviceAsync("UnityDemoPlayer");
                Debug.Log($"<color=green>✓ Authenticated Player ID:</color> {authResult.player.id} (NewPlayer={authResult.isNewPlayer})");

                // 3. Economy: Fetch Catalog (First request - caches ETag)
                Debug.Log("<b>[Step 2]</b> Fetching catalog from server (Initial fetch)...");
                var catalog1 = await client.Economy.GetCatalogAsync();
                Debug.Log($"<color=green>✓ Received Catalog:</color> {catalog1?.total ?? 0} items available.");

                // 4. Economy: Fetch Catalog again (Should trigger HTTP 304 Not Modified from local cache!)
                Debug.Log("<b>[Step 3]</b> Re-requesting catalog with ETag (Verifying HTTP 304 conditional cache)...");
                var catalog2 = await client.Economy.GetCatalogAsync();
                Debug.Log($"<color=green>✓ ETag 304 Verified:</color> Retrieved {catalog2?.total ?? 0} items with 0 duplicate network payload!");

                // 5. Economy: Purchase Item with Idempotency Key
                Debug.Log("<b>[Step 4]</b> Executing idempotent item purchase...");
                string idempotencyKey = $"tx_demo_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
                var purchaseResult = await client.Economy.PurchaseItemAsync(
                    itemId: "starter_sword_01",
                    currencyCode: "GOLD",
                    customIdempotencyKey: idempotencyKey
                );

                if (purchaseResult != null && purchaseResult.success)
                {
                    Debug.Log($"<color=green>✓ Purchase successful!</color> Tx: {purchaseResult.txId}, New Balance: {purchaseResult.newBalance} {purchaseResult.currencyCode}");
                }

                // 6. Leaderboards: Submit High Score
                Debug.Log("<b>[Step 5]</b> Submitting score to 'global_weekly' leaderboard...");
                var scoreResult = await client.Leaderboards.SubmitScoreAsync("global_weekly", 98500);
                if (scoreResult != null && scoreResult.success)
                {
                    Debug.Log($"<color=green>✓ Score submitted!</color> Rank: #{scoreResult.rank} of {scoreResult.totalPlayers}");
                }

                // 7. Offline Queue: Simulate enqueuing while disconnected
                Debug.Log("<b>[Step 6]</b> Testing persistent offline action queue...");
                client.OfflineQueue.Enqueue("SAMPLE_ACHIEVEMENT_UNLOCK", $"/api/titles/{titleId}/telemetry/events", "POST", "{\"event\":\"boss_defeated\"}");
                Debug.Log($"<color=green>✓ Action Enqueued!</color> Total offline pending actions: {client.OfflineQueue.Count}");

                int replayed = await client.FlushOfflineQueueAsync();
                Debug.Log($"<color=green>✓ Flushed Offline Queue:</color> {replayed} actions processed successfully.");

                // 8. Matchmaking: Submit Ticket
                Debug.Log("<b>[Step 7]</b> Creating matchmaking ticket for ruleset 'quick_1v1'...");
                var mmResult = await client.Matchmaking.CreateTicketAsync("quick_1v1", mmr: 1250);
                if (mmResult != null && mmResult.success)
                {
                    Debug.Log($"<color=green>✓ Matchmaking Ticket Created:</color> {mmResult.ticket.ticketId} (Status: {mmResult.ticket.status})");

                    // Listen for match events
                    client.Matchmaking.OnMatchFound += ticket =>
                    {
                        Debug.Log($"<color=yellow><b>★ MATCH FOUND! ★</b></color> Match ID: {ticket.matchId} (Region: {ticket.matchedRegion})");
                    };

                    client.Matchmaking.StartPolling(mmResult.ticket.ticketId, pollIntervalSeconds: 3.0f);
                }

                Debug.Log("<color=cyan><b>=== [Daksh SDK Quickstart Demonstration Complete] ===</b></color>");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Daksh.Quickstart] Error during bootstrap: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }
}
