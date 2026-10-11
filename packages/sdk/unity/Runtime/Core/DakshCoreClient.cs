using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;

namespace Daksh.SDK
{
    /// <summary>
    /// Base client coordinator for the Daksh Core subsystem.
    /// Provides pluggable transport, encrypted AES-256 caching, ETag 304 diffing,
    /// persistent offline action replay, and modular subsystem lifecycle management.
    /// </summary>
    public class DakshCoreClient : MonoBehaviour
    {
        protected static DakshCoreClient _coreInstance;
        public static DakshCoreClient Instance => _coreInstance;

        public DakshConfig Config { get; protected set; }
        public IDakshTransport Transport { get; set; }
        public DakshCache Cache { get; protected set; }
        public ETagStore ETag { get; protected set; }
        public OfflineActionQueue OfflineQueue { get; protected set; }
        public DakshAuth Auth { get; protected set; }

        public bool IsOnline => Application.internetReachability != NetworkReachability.NotReachable;

        protected readonly Dictionary<Type, IDakshSubsystem> _subsystems = new Dictionary<Type, IDakshSubsystem>();
        protected NetworkReachability _lastReachability;
        protected bool _isInitialized;

        protected virtual void Awake()
        {
            if (_coreInstance == null)
            {
                _coreInstance = this;
                DontDestroyOnLoad(gameObject);
            }
            else if (_coreInstance != this)
            {
                Destroy(gameObject);
            }
        }

        public virtual void SetupCore(DakshConfig config)
        {
            Config = config ?? DakshConfig.Default;
            Transport = new UnityWebRequestTransport();
            Cache = new DakshCache(Config.localEncryptionKey);
            ETag = new ETagStore(Cache);
            OfflineQueue = new OfflineActionQueue(Cache);
            Auth = new DakshAuth(this);

            _lastReachability = Application.internetReachability;
            _isInitialized = true;

            Debug.Log($"[Daksh.Core] Initialized Core Client (Title: {Config.titleId}, Server: {Config.serverUrl})");

            if (Config.autoFlushOfflineQueue && IsOnline && OfflineQueue.Count > 0)
            {
                _ = FlushOfflineQueueAsync();
            }
        }

        protected virtual void Update()
        {
            if (!_isInitialized) return;

            var currentReachability = Application.internetReachability;
            if (currentReachability != _lastReachability)
            {
                Debug.Log($"[Daksh.Core] Network reachability changed from {_lastReachability} to {currentReachability}");
                if (currentReachability != NetworkReachability.NotReachable && Config.autoFlushOfflineQueue)
                {
                    _ = FlushOfflineQueueAsync();
                }
                _lastReachability = currentReachability;
            }
        }

        #region Subsystem Registry

        public void RegisterSubsystem<T>(T subsystem) where T : class, IDakshSubsystem
        {
            if (subsystem == null) return;
            var type = typeof(T);

            if (_subsystems.ContainsKey(type))
            {
                _subsystems[type].Shutdown();
            }

            _subsystems[type] = subsystem;
            subsystem.Initialize(this as DakshClient ?? null);
            Debug.Log($"[Daksh.Core] Registered modular subsystem: {subsystem.SubsystemName} ({type.Name})");
        }

        public T GetSubsystem<T>() where T : class, IDakshSubsystem
        {
            var type = typeof(T);
            if (_subsystems.TryGetValue(type, out var subsystem))
            {
                return subsystem as T;
            }
            return null;
        }

        public bool TryGetSubsystem<T>(out T subsystem) where T : class, IDakshSubsystem
        {
            subsystem = GetSubsystem<T>();
            return subsystem != null;
        }

        public bool HasSubsystem<T>() where T : class, IDakshSubsystem
        {
            return _subsystems.ContainsKey(typeof(T));
        }

        public void UnregisterSubsystem<T>() where T : class, IDakshSubsystem
        {
            var type = typeof(T);
            if (_subsystems.TryGetValue(type, out var subsystem))
            {
                subsystem.Shutdown();
                _subsystems.Remove(type);
                Debug.Log($"[Daksh.Core] Unregistered modular subsystem: {type.Name}");
            }
        }

        public IReadOnlyCollection<IDakshSubsystem> GetAllSubsystems()
        {
            return _subsystems.Values;
        }

        #endregion

        #region Offline Queue & Replay

        public async Task<int> FlushOfflineQueueAsync()
        {
            if (!IsOnline || OfflineQueue.Count == 0) return 0;
            Debug.Log($"[Daksh.Core] Flushing {OfflineQueue.Count} queued offline actions...");

            return await OfflineQueue.ReplayAllAsync(async (action) =>
            {
                try
                {
                    string url = Config.serverUrl.TrimEnd('/') + action.endpoint;
                    var req = new TransportRequest
                    {
                        Url = url,
                        Method = action.httpMethod,
                        BodyJson = action.payloadJson,
                        TimeoutSeconds = Config.requestTimeoutSeconds
                    };

                    req.Headers["Content-Type"] = "application/json";
                    if (!string.IsNullOrEmpty(Auth?.ActiveToken))
                    {
                        req.Headers["Authorization"] = $"Bearer {Auth.ActiveToken}";
                    }
                    req.Headers["X-Daksh-Replayed"] = "true";
                    req.Headers["X-Daksh-Action-Id"] = action.actionId;

                    var response = await Transport.SendAsync(req);
                    return response.IsSuccess;
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[Daksh.Core] Failed to replay action {action.actionId}: {ex.Message}");
                    return false;
                }
            });
        }

        #endregion

        #region HTTP Transport Operations

        public async Task<T> GetAsync<T>(string endpoint, bool useETag = false, bool requiresAuth = true)
        {
            string url = Config.serverUrl.TrimEnd('/') + endpoint;
            string cachedEtag = useETag ? ETag.GetETag(endpoint) : null;

            var req = new TransportRequest
            {
                Url = url,
                Method = "GET",
                TimeoutSeconds = Config.requestTimeoutSeconds
            };

            if (requiresAuth && !string.IsNullOrEmpty(Auth?.ActiveToken))
            {
                req.Headers["Authorization"] = $"Bearer {Auth.ActiveToken}";
            }

            if (useETag && !string.IsNullOrEmpty(cachedEtag))
            {
                req.Headers["If-None-Match"] = cachedEtag;
            }

            var response = await Transport.SendAsync(req);

            // HTTP 304 Not Modified: Read directly from local encrypted ETag cache!
            if (useETag && response.StatusCode == 304)
            {
                Debug.Log($"[Daksh.Core] HTTP 304 Not Modified for {endpoint}. Serving from encrypted local cache.");
                string cachedJson = ETag.GetCachedPayload(endpoint);
                if (!string.IsNullOrEmpty(cachedJson))
                {
                    return JsonUtility.FromJson<T>(cachedJson);
                }
            }

            if (!response.IsSuccess)
            {
                // Fallback to local cache if network is unavailable
                if (useETag)
                {
                    string fallback = ETag.GetCachedPayload(endpoint);
                    if (!string.IsNullOrEmpty(fallback))
                    {
                        Debug.LogWarning($"[Daksh.Core] Network failure for {endpoint}. Falling back to cached payload.");
                        return JsonUtility.FromJson<T>(fallback);
                    }
                }

                throw new DakshException(
                    $"GET {endpoint} failed: {response.Error}",
                    response.StatusCode,
                    response.Error,
                    response.Text
                );
            }

            string responseText = response.Text;

            // Cache response if ETag header returned
            if (useETag)
            {
                string etagHeader = response.GetHeader("ETag");
                if (!string.IsNullOrEmpty(etagHeader))
                {
                    ETag.Store(endpoint, etagHeader, responseText);
                }
            }

            return JsonUtility.FromJson<T>(responseText);
        }

        public async Task<T> PostAsync<T>(string endpoint, string jsonPayload, bool requiresAuth = true, bool queueIfOffline = false, string actionType = null)
        {
            if (!IsOnline && queueIfOffline)
            {
                OfflineQueue.Enqueue(actionType ?? "POST_ACTION", endpoint, "POST", jsonPayload);
                return default;
            }

            string url = Config.serverUrl.TrimEnd('/') + endpoint;
            var req = new TransportRequest
            {
                Url = url,
                Method = "POST",
                BodyJson = jsonPayload,
                TimeoutSeconds = Config.requestTimeoutSeconds
            };

            req.Headers["Content-Type"] = "application/json";
            if (requiresAuth && !string.IsNullOrEmpty(Auth?.ActiveToken))
            {
                req.Headers["Authorization"] = $"Bearer {Auth.ActiveToken}";
            }

            var response = await Transport.SendAsync(req);

            if (!response.IsSuccess)
            {
                if (queueIfOffline)
                {
                    OfflineQueue.Enqueue(actionType ?? "POST_ACTION", endpoint, "POST", jsonPayload);
                    return default;
                }

                throw new DakshException(
                    $"POST {endpoint} failed: {response.Error}",
                    response.StatusCode,
                    response.Error,
                    response.Text
                );
            }

            string responseText = response.Text;
            if (string.IsNullOrEmpty(responseText)) return default;
            return JsonUtility.FromJson<T>(responseText);
        }

        public async Task<T> DeleteAsync<T>(string endpoint, bool requiresAuth = true)
        {
            string url = Config.serverUrl.TrimEnd('/') + endpoint;
            var req = new TransportRequest
            {
                Url = url,
                Method = "DELETE",
                TimeoutSeconds = Config.requestTimeoutSeconds
            };

            if (requiresAuth && !string.IsNullOrEmpty(Auth?.ActiveToken))
            {
                req.Headers["Authorization"] = $"Bearer {Auth.ActiveToken}";
            }

            var response = await Transport.SendAsync(req);

            if (!response.IsSuccess)
            {
                throw new DakshException(
                    $"DELETE {endpoint} failed: {response.Error}",
                    response.StatusCode,
                    response.Error,
                    response.Text
                );
            }

            string responseText = response.Text;
            if (string.IsNullOrEmpty(responseText)) return default;
            return JsonUtility.FromJson<T>(responseText);
        }

        #endregion
    }
}
