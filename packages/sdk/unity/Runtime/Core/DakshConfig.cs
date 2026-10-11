using System;
using UnityEngine;

namespace Daksh.SDK
{
    [Serializable]
    public class DakshConfig
    {
        [Tooltip("The unique Title ID provisioned in Daksh Console.")]
        public string titleId = "demo_title";

        [Tooltip("Base HTTP/HTTPS URL of the Daksh BaaS Server.")]
        public string serverUrl = "http://localhost:3000";

        [Tooltip("Optional Client Secret or API key.")]
        public string clientSecret = "";

        [Tooltip("Enable automatic replay of queued offline actions when network connectivity returns.")]
        public bool autoFlushOfflineQueue = true;

        [Tooltip("Timeout in seconds for network requests.")]
        public float requestTimeoutSeconds = 15f;

        [Tooltip("32-byte secret encryption key for local AES-256 caching. If empty, a hardware-derived key is generated.")]
        public string localEncryptionKey = "daksh_unity_secure_local_key_32";

        public static DakshConfig Default => new DakshConfig();
    }
}
