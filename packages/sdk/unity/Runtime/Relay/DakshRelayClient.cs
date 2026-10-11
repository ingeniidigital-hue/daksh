using System;
using System.Collections;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Daksh.SDK
{
    /// <summary>
    /// Nakama-compatible real-time relay client.
    /// Dispatches high-frequency (30 Hz) binary position packets to relay rooms.
    /// </summary>
    public class DakshRelayClient
    {
        private readonly DakshClient _client;
        private Coroutine _relayLoopCoroutine;
        private uint _sequenceCounter = 0;

        public bool IsRunning => _relayLoopCoroutine != null;

        public DakshRelayClient(DakshClient client)
        {
            _client = client;
        }

        /// <summary>
        /// Joins the specified real-time relay room.
        /// </summary>
        public async Task<bool> JoinRoomAsync(string roomId)
        {
            if (!_client.Auth.IsAuthenticated)
            {
                throw new DakshException("Cannot join relay room: Player is not authenticated.");
            }

            string endpoint = $"/api/titles/{_client.Config.titleId}/multiplayer/relay/rooms/{roomId}/join";
            string payload = $"{{\"playerId\":\"{_client.Auth.CurrentPlayer.id}\"}}";

            var res = await _client.PostAsync<RelayDispatchResponse>(endpoint, payload, requiresAuth: true);
            return res != null && res.success;
        }

        /// <summary>
        /// Dispatches a raw binary packet to peers in the specified room.
        /// </summary>
        public async Task<RelayDispatchResponse> SendPacketAsync(string roomId, byte[] packet)
        {
            string endpoint = $"/api/titles/{_client.Config.titleId}/multiplayer/relay/rooms/{roomId}/packet";
            string url = _client.Config.serverUrl.TrimEnd('/') + endpoint;

            using (var req = new UnityWebRequest(url, "POST"))
            {
                req.uploadHandler = new UploadHandlerRaw(packet);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/octet-stream");

                string senderId = _client.Auth?.CurrentPlayer?.id ?? "unity_client";
                req.SetRequestHeader("x-sender-id", senderId);

                if (!string.IsNullOrEmpty(_client.Auth?.ActiveToken))
                {
                    req.SetRequestHeader("Authorization", $"Bearer {_client.Auth.ActiveToken}");
                }

                var op = req.SendWebRequest();
                while (!op.isDone) await Task.Yield();

                if (req.result != UnityWebRequest.Result.Success)
                {
                    return new RelayDispatchResponse { success = false, dropped = true, reason = req.error };
                }

                string text = req.downloadHandler.text;
                if (string.IsNullOrEmpty(text)) return new RelayDispatchResponse { success = true };
                return JsonUtility.FromJson<RelayDispatchResponse>(text);
            }
        }

        /// <summary>
        /// Packs and sends a 21-byte binary position datagram.
        /// </summary>
        public async Task<RelayDispatchResponse> SendPositionAsync(string roomId, Vector3 position, float yaw)
        {
            _sequenceCounter++;
            byte[] packet = DakshRelay.PackPosition(_sequenceCounter, position, yaw);
            return await SendPacketAsync(roomId, packet);
        }

        /// <summary>
        /// Starts automated 30 Hz position synchronization loop for a target transform.
        /// </summary>
        public void StartPositionSync(string roomId, Transform targetTransform, float tickRateHz = 30f)
        {
            StopPositionSync();
            _relayLoopCoroutine = _client.StartCoroutine(SyncLoop(roomId, targetTransform, tickRateHz));
        }

        public void StopPositionSync()
        {
            if (_relayLoopCoroutine != null)
            {
                _client.StopCoroutine(_relayLoopCoroutine);
                _relayLoopCoroutine = null;
            }
        }

        private IEnumerator SyncLoop(string roomId, Transform target, float rateHz)
        {
            float interval = 1f / rateHz;
            var wait = new WaitForSeconds(interval);

            while (target != null)
            {
                _ = SendPositionAsync(roomId, target.position, target.eulerAngles.y);
                yield return wait;
            }
            _relayLoopCoroutine = null;
        }
    }
}
