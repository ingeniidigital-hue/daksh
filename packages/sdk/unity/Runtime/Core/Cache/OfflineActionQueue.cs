using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;

namespace Daksh.SDK
{
    [Serializable]
    public class QueuedAction
    {
        public string actionId;
        public string actionType;
        public string endpoint;
        public string httpMethod;
        public string payloadJson;
        public long timestamp;
        public int retryCount;
    }

    [Serializable]
    public class QueuedActionList
    {
        public List<QueuedAction> items = new List<QueuedAction>();
    }

    /// <summary>
    /// Thread-safe and persistent FIFO action queue for executing mutations while offline.
    /// Actions are cryptographically persisted to disk and replayed in strict sequence upon network recovery.
    /// </summary>
    public class OfflineActionQueue
    {
        private readonly DakshCache _cache;
        private const string QueueKey = "offline_action_fifo_queue";
        private readonly object _lock = new object();
        private List<QueuedAction> _items;

        public OfflineActionQueue(DakshCache cache)
        {
            _cache = cache;
            LoadQueue();
        }

        private void LoadQueue()
        {
            lock (_lock)
            {
                var list = _cache.GetObject<QueuedActionList>(QueueKey);
                _items = list?.items ?? new List<QueuedAction>();
            }
        }

        private void SaveQueue()
        {
            lock (_lock)
            {
                var list = new QueuedActionList { items = _items };
                _cache.SetObject(QueueKey, list);
            }
        }

        public int Count
        {
            get
            {
                lock (_lock)
                {
                    return _items.Count;
                }
            }
        }

        public void Enqueue(string actionType, string endpoint, string httpMethod, string payloadJson)
        {
            var action = new QueuedAction
            {
                actionId = "act_" + Guid.NewGuid().ToString("N"),
                actionType = actionType,
                endpoint = endpoint,
                httpMethod = httpMethod,
                payloadJson = payloadJson,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                retryCount = 0
            };

            lock (_lock)
            {
                _items.Add(action);
                SaveQueue();
            }

            Debug.Log($"[Daksh.OfflineQueue] Enqueued offline action {action.actionId} ({action.actionType}). Total pending: {Count}");
        }

        public QueuedAction Peek()
        {
            lock (_lock)
            {
                return _items.Count > 0 ? _items[0] : null;
            }
        }

        public QueuedAction Dequeue()
        {
            lock (_lock)
            {
                if (_items.Count == 0) return null;
                var item = _items[0];
                _items.RemoveAt(0);
                SaveQueue();
                return item;
            }
        }

        public void Clear()
        {
            lock (_lock)
            {
                _items.Clear();
                SaveQueue();
            }
        }

        /// <summary>
        /// Flushes all queued actions in FIFO order using the provided asynchronous execution delegate.
        /// Replay halts if an action fails due to persistent network unavailability.
        /// </summary>
        public async Task<int> ReplayAllAsync(Func<QueuedAction, Task<bool>> executor)
        {
            int replayedCount = 0;

            while (Count > 0)
            {
                QueuedAction current = Peek();
                if (current == null) break;

                bool success = false;
                try
                {
                    success = await executor(current);
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[Daksh.OfflineQueue] Action {current.actionId} execution exception: {ex.Message}");
                    success = false;
                }

                if (success)
                {
                    Dequeue();
                    replayedCount++;
                    Debug.Log($"[Daksh.OfflineQueue] Replayed and committed offline action {current.actionId} ({current.actionType}). Remaining: {Count}");
                }
                else
                {
                    current.retryCount++;
                    SaveQueue();
                    Debug.LogWarning($"[Daksh.OfflineQueue] Halting replay: Action {current.actionId} failed (retry count: {current.retryCount})");
                    break;
                }
            }

            return replayedCount;
        }
    }
}
