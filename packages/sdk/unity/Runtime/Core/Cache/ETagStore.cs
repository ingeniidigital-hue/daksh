using System;
using UnityEngine;

namespace Daksh.SDK
{
    [Serializable]
    public class ETagRecord
    {
        public string key;
        public string etag;
        public string cachedPayload;
        public long timestamp;
    }

    /// <summary>
    /// Manages HTTP conditional validation (ETag / If-None-Match) with persistent encrypted local storage.
    /// Eliminates redundant bandwidth usage by diffing local state against server state.
    /// </summary>
    public class ETagStore
    {
        private readonly DakshCache _cache;
        private const string ETagPrefix = "etag_rec_";

        public ETagStore(DakshCache cache)
        {
            _cache = cache;
        }

        public string GetETag(string key)
        {
            var record = _cache.GetObject<ETagRecord>(ETagPrefix + key);
            return record?.etag;
        }

        public string GetCachedPayload(string key)
        {
            var record = _cache.GetObject<ETagRecord>(ETagPrefix + key);
            return record?.cachedPayload;
        }

        public void Store(string key, string etag, string payload)
        {
            if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(etag)) return;

            var record = new ETagRecord
            {
                key = key,
                etag = etag,
                cachedPayload = payload,
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            _cache.SetObject(ETagPrefix + key, record);
        }

        public void Invalidate(string key)
        {
            _cache.DeleteKey(ETagPrefix + key);
        }
    }
}
