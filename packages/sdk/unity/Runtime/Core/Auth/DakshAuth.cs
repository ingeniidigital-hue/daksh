using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Daksh.SDK
{
    [Serializable]
    public class DeviceAuthPayload
    {
        public string deviceId;
        public string clientPlatform;
        public string displayName;
    }

    [Serializable]
    public class PlayerProfile
    {
        public string id;
        public string deviceId;
        public string username;
        public string displayName;
        public string status;
    }

    [Serializable]
    public class PlayerSessionResponse
    {
        public bool success;
        public string token;
        public string refreshToken;
        public int expiresIn;
        public bool isNewPlayer;
        public PlayerProfile player;
    }

    /// <summary>
    /// Handles zero-friction hardware device authentication, anonymous guest onboarding,
    /// session token persistence, and cryptographic credential caching.
    /// </summary>
    public class DakshAuth
    {
        private readonly DakshCoreClient _client;
        private const string CacheKeySession = "auth_player_session";

        public string ActiveToken { get; private set; }
        public string RefreshToken { get; private set; }
        public PlayerProfile CurrentPlayer { get; private set; }
        public bool IsAuthenticated => !string.IsNullOrEmpty(ActiveToken) && CurrentPlayer != null;

        public event Action<PlayerProfile> OnAuthenticated;
        public event Action OnLoggedOut;

        public DakshAuth(DakshCoreClient client)
        {
            _client = client;
            TryRestoreCachedSession();
        }

        public bool TryRestoreCachedSession()
        {
            var saved = _client.Cache.GetObject<PlayerSessionResponse>(CacheKeySession);
            if (saved != null && !string.IsNullOrEmpty(saved.token) && saved.player != null)
            {
                ActiveToken = saved.token;
                RefreshToken = saved.refreshToken;
                CurrentPlayer = saved.player;
                Debug.Log($"[Daksh.Auth] Restored offline session for player: {CurrentPlayer.id} ({CurrentPlayer.displayName})");
                return true;
            }
            return false;
        }

        public async Task<PlayerSessionResponse> AuthenticateDeviceAsync(string customDisplayName = null)
        {
            string deviceId = SystemInfo.deviceUniqueIdentifier;
            string platform = Application.platform.ToString();
            string displayName = string.IsNullOrEmpty(customDisplayName)
                ? $"Player_{deviceId.Substring(0, Math.Min(6, deviceId.Length))}"
                : customDisplayName;

            var payload = new DeviceAuthPayload
            {
                deviceId = deviceId,
                clientPlatform = platform,
                displayName = displayName
            };

            string endpoint = $"/api/titles/{_client.Config.titleId}/players";
            string json = JsonUtility.ToJson(payload);

            var response = await _client.PostAsync<PlayerSessionResponse>(endpoint, json, requiresAuth: false);

            if (response != null && response.success)
            {
                ActiveToken = response.token;
                RefreshToken = response.refreshToken;
                CurrentPlayer = response.player;

                _client.Cache.SetObject(CacheKeySession, response);
                Debug.Log($"[Daksh.Auth] Authenticated player: {CurrentPlayer.id} (NewPlayer={response.isNewPlayer})");
                OnAuthenticated?.Invoke(CurrentPlayer);
            }

            return response;
        }

        public void Logout()
        {
            ActiveToken = null;
            RefreshToken = null;
            CurrentPlayer = null;
            _client.Cache.DeleteKey(CacheKeySession);
            Debug.Log("[Daksh.Auth] Player logged out and session cleared.");
            OnLoggedOut?.Invoke();
        }
    }
}
