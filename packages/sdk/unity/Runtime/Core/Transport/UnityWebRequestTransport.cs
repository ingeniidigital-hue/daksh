using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Daksh.SDK
{
    /// <summary>
    /// Default UnityWebRequest transport implementation for IDakshTransport.
    /// </summary>
    public class UnityWebRequestTransport : IDakshTransport
    {
        public async Task<TransportResponse> SendAsync(TransportRequest request)
        {
            using (var uwr = new UnityWebRequest(request.Url, request.Method))
            {
                uwr.timeout = (int)request.TimeoutSeconds;
                uwr.downloadHandler = new DownloadHandlerBuffer();

                if (request.BodyRaw != null && request.BodyRaw.Length > 0)
                {
                    uwr.uploadHandler = new UploadHandlerRaw(request.BodyRaw);
                }
                else if (!string.IsNullOrEmpty(request.BodyJson))
                {
                    byte[] bytes = Encoding.UTF8.GetBytes(request.BodyJson);
                    uwr.uploadHandler = new UploadHandlerRaw(bytes);
                }

                if (request.Headers != null)
                {
                    foreach (var header in request.Headers)
                    {
                        uwr.SetRequestHeader(header.Key, header.Value);
                    }
                }

                var op = uwr.SendWebRequest();
                while (!op.isDone)
                {
                    await Task.Yield();
                }

                var response = new TransportResponse
                {
                    StatusCode = uwr.responseCode,
                    IsSuccess = uwr.result == UnityWebRequest.Result.Success,
                    Text = uwr.downloadHandler?.text,
                    Data = uwr.downloadHandler?.data,
                    Error = uwr.error
                };

                var responseHeaders = uwr.GetResponseHeaders();
                if (responseHeaders != null)
                {
                    response.Headers = responseHeaders;
                }

                return response;
            }
        }
    }
}
