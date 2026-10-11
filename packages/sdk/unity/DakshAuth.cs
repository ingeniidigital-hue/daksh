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
    public class PlayerSessionResponse
    {
        public bool success;
        public string token;
        public bool isNewPlayer;
        public PlayerProfile player;
    }

    [Serializable]
    public class PlayerProfile
    {
        public string id;
        public string deviceId;
        public string username;
        public string status;
    }

    public static class DakshAuth
    {
        public static string ActiveToken { get; private set; }
        public static string PlayerId { get; private set; }

        /// <summary>
        /// Authenticates the client asynchronously using the hardware device identifier.
        /// </summary>
        public static async Task<PlayerSessionResponse> AuthenticateDeviceAsync(string titleId, string endpoint = "http://localhost:3000")
        {
            string deviceId = SystemInfo.deviceUniqueIdentifier;
            string url = $"{endpoint}/api/titles/{titleId}/players";

            var payload = new DeviceAuthPayload
            {
                deviceId = deviceId,
                clientPlatform = Application.platform.ToString(),
                displayName = $"Player_{deviceId.Substring(0, Math.Min(6, deviceId.Length))}"
            };

            string json = JsonUtility.ToJson(payload);
            using (var request = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                var operation = request.SendWebRequest();
                while (!operation.isDone)
                {
                    await Task.Yield();
                }

                if (request.result != UnityWebRequest.Result.Success)
                {
                    Debug.LogError($"[Daksh.Auth] Device authentication failed: {request.error} | {request.downloadHandler.text}");
                    throw new Exception(request.downloadHandler.text);
                }

                var response = JsonUtility.FromJson<PlayerSessionResponse>(request.downloadHandler.text);
                ActiveToken = response.token;
                PlayerId = response.player.id;
                Debug.Log($"[Daksh.Auth] Successfully authenticated player: {PlayerId} (Token: {ActiveToken.Substring(0, 16)}...)");
                return response;
            }
        }
    }
}
