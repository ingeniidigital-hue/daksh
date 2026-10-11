using System;

namespace Daksh.SDK
{
    public class DakshException : Exception
    {
        public long StatusCode { get; }
        public string ErrorCode { get; }
        public string RawResponse { get; }

        public DakshException(string message, long statusCode = 0, string errorCode = null, string rawResponse = null)
            : base(message)
        {
            StatusCode = statusCode;
            ErrorCode = errorCode;
            RawResponse = rawResponse;
        }

        public override string ToString()
        {
            return $"[DakshException Status={StatusCode} Code={ErrorCode}] {Message} (Response: {RawResponse})";
        }
    }
}
