using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Daksh.SDK
{
    /// <summary>
    /// PlayFab Economy V2 compatible subsystem.
    /// Manages virtual currency balances, catalog item listings with ETag conditional 304 diffing,
    /// and atomic server-reconciled inventory purchases with idempotency keys.
    /// </summary>
    public class DakshEconomy
    {
        private readonly DakshClient _client;
        private CatalogResponse _cachedCatalog;

        public CatalogResponse CachedCatalog => _cachedCatalog;

        public event Action<PurchaseResult> OnPurchaseCompleted;

        public DakshEconomy(DakshClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Retrieves the title's item catalog. Automatically attaches ETag header.
        /// If server returns 304 Not Modified, resolves locally with 0 byte transfer overhead.
        /// </summary>
        public async Task<CatalogResponse> GetCatalogAsync(bool forceRefresh = false)
        {
            string endpoint = $"/api/titles/{_client.Config.titleId}/economy/catalog";
            var response = await _client.GetAsync<CatalogResponse>(endpoint, useETag: !forceRefresh, requiresAuth: false);

            if (response != null)
            {
                _cachedCatalog = response;
            }

            return response;
        }

        /// <summary>
        /// Retrieves available virtual currencies configured for the active title.
        /// </summary>
        public async Task<CurrencyListResponse> GetCurrenciesAsync()
        {
            string endpoint = $"/api/titles/{_client.Config.titleId}/economy/currencies";
            return await _client.GetAsync<CurrencyListResponse>(endpoint, useETag: true, requiresAuth: false);
        }

        /// <summary>
        /// Purchases a catalog item using the specified virtual currency.
        /// Employs a unique idempotency key to prevent double-charging on network retries.
        /// Can automatically enqueue into the offline action queue if disconnected.
        /// </summary>
        public async Task<PurchaseResult> PurchaseItemAsync(string itemId, string currencyCode, string customIdempotencyKey = null, bool queueIfOffline = true)
        {
            if (!_client.Auth.IsAuthenticated)
            {
                throw new DakshException("Cannot purchase item: Player is not authenticated. Call DakshClient.Instance.Auth.AuthenticateDeviceAsync() first.");
            }

            string idempotencyKey = string.IsNullOrEmpty(customIdempotencyKey)
                ? $"tx_{Guid.NewGuid():N}"
                : customIdempotencyKey;

            var request = new PurchaseRequest
            {
                titleId = _client.Config.titleId,
                playerId = _client.Auth.CurrentPlayer.id,
                itemId = itemId,
                currencyCode = currencyCode.ToUpperInvariant(),
                idempotencyKey = idempotencyKey
            };

            string endpoint = $"/api/titles/{_client.Config.titleId}/economy/purchase";
            string json = JsonUtility.ToJson(request);

            var result = await _client.PostAsync<PurchaseResult>(
                endpoint,
                json,
                requiresAuth: true,
                queueIfOffline: queueIfOffline,
                actionType: "INVENTORY_PURCHASE"
            );

            if (result != null && result.success)
            {
                Debug.Log($"[Daksh.Economy] Successfully purchased {itemId} with {currencyCode} (Deduped={result.isDeduped}, Tx={result.txId})");
                OnPurchaseCompleted?.Invoke(result);
            }

            return result;
        }
    }
}
