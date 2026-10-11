using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Daksh.SDK
{
    public class TransportRequest
    {
        public string Url { get; set; }
        public string Method { get; set; } // GET, POST, DELETE, etc.
        public string BodyJson { get; set; }
        public byte[] BodyRaw { get; set; }
        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();
        public float TimeoutSeconds { get; set; } = 15f;
    }

    public class TransportResponse
    {
        public long StatusCode { get; set; }
        public bool IsSuccess { get; set; }
        public string Text { get; set; }
        public byte[] Data { get; set; }
        public string Error { get; set; }
        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();

        public string GetHeader(string name)
        {
            if (Headers == null) return null;
            foreach (var kvp in Headers)
            {
                if (string.Equals(kvp.Key, name, StringComparison.OrdinalIgnoreCase))
                {
                    return kvp.Value;
                }
            }
            return null;
        }
    }

    /// <summary>
    /// Pluggable network transport interface. Allows swapping HTTP implementations or mock transports.
    /// </summary>
    public interface IDakshTransport
    {
        Task<TransportResponse> SendAsync(TransportRequest request);
    }
}
