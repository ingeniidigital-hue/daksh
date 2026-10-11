using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Daksh.SDK
{
    /// <summary>
    /// Master coordinator for the Daksh Game BaaS Unity SDK.
    /// Manages client lifecycle, HTTP dispatch with ETag caching, offline action queues, and subsystems.
    /// </summary>
    public class DakshClient : MonoBehaviour
    {
        private static DakshClient _instance;
        public static DakshClient Instance
        {
            get
            {
                if (_instance == null)
                {
                    var go = new GameObject("[DakshClient]");
                    _instance = go.AddComponent<DakshClient>();
                    DontDestroyOnLoad(go);
                    _instance.Initialize(DakshConfig.Default);
                }
                return _instance;
            }
        }

        public DakshConfig Config { get; private set; }
        public DakshCache Cache { get; private set; }
        public ETagStore ETag { get; private set; }
        public OfflineActionQueue OfflineQueue { get; private set; }
        public DakshAuth Auth { get; private set; }
        public DakshEconomy Economy { get; private set; }
        public DakshLeaderboards Leaderboards { get; private set; }
        public DakshMatchmaking Matchmaking { get; private set; }
        public DakshAddressablesDownloader OTA { get; private set; }
        public DakshRelayClient Relay { get; private set; }

        public bool IsOnline => Application.internetReachability != NetworkReachability.NotReachable;
        private NetworkReachability _lastReachability;
        private bool _isInitialized;

        public static DakshClient Initialize(DakshConfig config)
        {
            if (_instance == null)
            {
                var go = new GameObject("[DakshClient]");
                _instance = go.AddComponent<DakshClient>();
                DontDestroyOnLoad(go);
            }

            _instance.Setup(config);
            return _instance;
        }

        private void Awake()
        {
            if (_instance == null)
            {
                _instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else if (_instance != this)
            {
                Destroy(gameObject);
            }
        }

        private void Setup(DakshConfig config)
        {
            Config = config ?? DakshConfig.Default;
            Cache = new DakshCache(Config.localEncryptionKey);
            ETag = new ETagStore(Cache);
            OfflineQueue = new OfflineActionQueue(Cache);
            Auth = new DakshAuth(this);
            Economy = new DakshEconomy(this);
            Leaderboards = new DakshLeaderboards(this);
            Matchmaking = new DakshMatchmaking(this);
            OTA = new DakshAddressablesDownloader(this);
            Relay = new DakshRelayClient(this);

            _lastReachability = Application.internetReachability;
            _isInitialized = true;
            Debug.Log($"[Daksh.Client] Initialized Daksh Game BaaS SDK v1.0.0 (Title: {Config.titleId}, Server: {Config.serverUrl})");

            if (Config.autoFlushOfflineQueue && IsOnline && OfflineQueue.Count > 0)
            {
                _ = FlushOfflineQueueAsync();
            }
        }

        private void Update()
        {
            if (!_isInitialized) return;

            var currentReachability = Application.internetReachability;
            if (currentReachability != _lastReachability)
            {
                Debug.Log($"[Daksh.Client] Network reachability changed from {_lastReachability} to {currentReachability}");
                if (currentReachability != NetworkReachability.NotReachable && Config.autoFlushOfflineQueue)
                {
                    _ = FlushOfflineQueueAsync();
                }
                _lastReachability = currentReachability;
            }
        }

        public async Task<int> FlushOfflineQueueAsync()
        {
            if (!IsOnline || OfflineQueue.Count == 0) return 0;
            Debug.Log($"[Daksh.Client] Flushing {OfflineQueue.Count} queued offline actions...");

            return await OfflineQueue.ReplayAllAsync(async (action) =>
            {
                try
                {
                    string url = Config.serverUrl.TrimEnd('/') + action.endpoint;
                    using (var req = new UnityWebRequest(url, action.httpMethod))
                    {
                        if (!string.IsNullOrEmpty(action.payloadJson))
                        {
                            byte[] bodyRaw = Encoding.UTF8.GetBytes(action.payloadJson);
                            req.uploadHandler = new UploadHandlerRaw(bodyRaw);
                        }
                        req.downloadHandler = new DownloadHandlerBuffer();
                        req.SetRequestHeader("Content-Type", "application/json");
                        if (!string.IsNullOrEmpty(Auth?.ActiveToken))
                        {
                            req.SetRequestHeader("Authorization", $"Bearer {Auth.ActiveToken}");
                        }
                        req.SetRequestHeader("X-Daksh-Replayed", "true");
                        req.SetRequestHeader("X-Daksh-Action-Id", action.actionId);

                        var op = req.SendWebRequest();
                        while (!op.isDone) await Task.Yield();

                        return req.result == UnityWebRequest.Result.Success;
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[Daksh.Client] Failed to replay action {action.actionId}: {ex.Message}");
                    return false;
                }
            });
        }

        public async Task<T> GetAsync<T>(string endpoint, bool useETag = false, bool requiresAuth = true)
        {
            string url = Config.serverUrl.TrimEnd('/') + endpoint;
            string cachedEtag = useETag ? ETag.GetETag(endpoint) : null;

            using (var req = UnityWebRequest.Get(url))
            {
                req.timeout = (int)Config.requestTimeoutSeconds;

                if (requiresAuth && !string.IsNullOrEmpty(Auth?.ActiveToken))
                {
                    req.SetRequestHeader("Authorization", $"Bearer {Auth.ActiveToken}");
                }

                if (useETag && !string.IsNullOrEmpty(cachedEtag))
                {
                    req.SetRequestHeader("If-None-Match", cachedEtag);
                }

                var op = req.SendWebRequest();
                while (!op.isDone) await Task.Yield();

                // HTTP 304 Not Modified: Read directly from local encrypted ETag cache!
                if (useETag && req.responseCode == 304)
                {
                    Debug.Log($"[Daksh.Client] HTTP 304 Not Modified for {endpoint}. Serving from encrypted local cache.");
                    string cachedJson = ETag.GetCachedPayload(endpoint);
                    if (!string.IsNullOrEmpty(cachedJson))
                    {
                        return JsonUtility.FromJson<T>(cachedJson);
                    }
                }

                if (req.result != UnityWebRequest.Result.Success)
                {
                    // Fallback to local cache if network is unavailable
                    if (useETag)
                    {
                        string fallback = ETag.GetCachedPayload(endpoint);
                        if (!string.IsNullOrEmpty(fallback))
                        {
                            Debug.LogWarning($"[Daksh.Client] Network failure for {endpoint}. Falling back to cached payload.");
                            return JsonUtility.FromJson<T>(fallback);
                        }
                    }

                    throw new DakshException(
                        $"GET {endpoint} failed: {req.error}",
                        req.responseCode,
                        req.error,
                        req.downloadHandler?.text
                    );
                }

                string responseText = req.downloadHandler.text;

                // Cache response if ETag header returned
                if (useETag)
                {
                    string etagHeader = req.GetResponseHeader("ETag");
                    if (!string.IsNullOrEmpty(etagHeader))
                    {
                        ETag.Store(endpoint, etagHeader, responseText);
                    }
                }

                return JsonUtility.FromJson<T>(responseText);
            }
        }

        public async Task<T> PostAsync<T>(string endpoint, string jsonPayload, bool requiresAuth = true, bool queueIfOffline = false, string actionType = null)
        {
            if (!IsOnline && queueIfOffline)
            {
                OfflineQueue.Enqueue(actionType ?? "POST_ACTION", endpoint, "POST", jsonPayload);
                return default;
            }

            string url = Config.serverUrl.TrimEnd('/') + endpoint;
            using (var req = new UnityWebRequest(url, "POST"))
            {
                req.timeout = (int)Config.requestTimeoutSeconds;

                if (!string.IsNullOrEmpty(jsonPayload))
                {
                    byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);
                    req.uploadHandler = new UploadHandlerRaw(bodyRaw);
                }

                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");

                if (requiresAuth && !string.IsNullOrEmpty(Auth?.ActiveToken))
                {
                    req.SetRequestHeader("Authorization", $"Bearer {Auth.ActiveToken}");
                }

                var op = req.SendWebRequest();
                while (!op.isDone) await Task.Yield();

                if (req.result != UnityWebRequest.Result.Success)
                {
                    if (queueIfOffline)
                    {
                        OfflineQueue.Enqueue(actionType ?? "POST_ACTION", endpoint, "POST", jsonPayload);
                        return default;
                    }

                    throw new DakshException(
                        $"POST {endpoint} failed: {req.error}",
                        req.responseCode,
                        req.error,
                        req.downloadHandler?.text
                    );
                }

                string responseText = req.downloadHandler.text;
                if (string.IsNullOrEmpty(responseText)) return default;
                return JsonUtility.FromJson<T>(responseText);
            }
        }

        public async Task<T> DeleteAsync<T>(string endpoint, bool requiresAuth = true)
        {
            string url = Config.serverUrl.TrimEnd('/') + endpoint;
            using (var req = UnityWebRequest.Delete(url))
            {
                req.timeout = (int)Config.requestTimeoutSeconds;
                req.downloadHandler = new DownloadHandlerBuffer();

                if (requiresAuth && !string.IsNullOrEmpty(Auth?.ActiveToken))
                {
                    req.SetRequestHeader("Authorization", $"Bearer {Auth.ActiveToken}");
                }

                var op = req.SendWebRequest();
                while (!op.isDone) await Task.Yield();

                if (req.result != UnityWebRequest.Result.Success)
                {
                    throw new DakshException(
                        $"DELETE {endpoint} failed: {req.error}",
                        req.responseCode,
                        req.error,
                        req.downloadHandler?.text
                    );
                }

                string responseText = req.downloadHandler.text;
                if (string.IsNullOrEmpty(responseText)) return default;
                return JsonUtility.FromJson<T>(responseText);
            }
        }
    }
}
