using System;
using UnityEngine;

namespace Daksh.SDK
{
    [Serializable]
    public class DakshConfig
    {
        [Header("Title Credentials")]
        [Tooltip("The unique Title ID provisioned in Daksh Console.")]
        public string titleId = "demo_title";

        [Tooltip("Base HTTP/HTTPS URL of the Daksh BaaS Server.")]
        public string serverUrl = "http://localhost:3000";

        [Tooltip("Optional Client Secret or API key.")]
        public string clientSecret = "";

        [Header("Offline & Caching")]
        [Tooltip("Enable automatic replay of queued offline actions when network connectivity returns.")]
        public bool autoFlushOfflineQueue = true;

        [Tooltip("Timeout in seconds for network requests.")]
        public float requestTimeoutSeconds = 15f;

        [Tooltip("32-byte secret encryption key for local AES-256 caching. If empty, a default key is generated.")]
        public string localEncryptionKey = "daksh_unity_secure_local_key_32";

        [Header("Modular Subsystems (Toggle to exclude unused modules from runtime initialization)")]
        [Tooltip("Enable PlayFab Economy V2 catalog, currencies, and purchases.")]
        public bool enableEconomy = true;

        [Tooltip("Enable Redis global leaderboards and tiebreaker score submissions.")]
        public bool enableLeaderboards = true;

        [Tooltip("Enable dynamic matchmaking ticket queuing and polling.")]
        public bool enableMatchmaking = true;

        [Tooltip("Enable resumable HTTP 206 OTA AssetBundle downloading.")]
        public bool enableOTA = true;

        [Tooltip("Enable Nakama-compatible real-time 30 Hz relay netcode.")]
        public bool enableRelay = true;

        public static DakshConfig Default => new DakshConfig();
    }
}
