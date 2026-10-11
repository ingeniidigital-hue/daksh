using System;
using System.IO;
using System.Security.Cryptography;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Daksh.SDK
{
    /// <summary>
    /// High-reliability Addressables & AssetBundle downloader.
    /// Supports HTTP 206 Partial Content byte-range resume for interrupted downloads,
    /// and performs cryptographic SHA-256 integrity validation upon completion.
    /// </summary>
    public class DakshAddressablesDownloader : IDakshSubsystem
    {
        private DakshClient _client;

        public string SubsystemName => "OTA";
        public event Action<DownloadProgressInfo> OnDownloadProgress;

        public DakshAddressablesDownloader() { }

        public DakshAddressablesDownloader(DakshClient client)
        {
            Initialize(client);
        }

        public void Initialize(DakshClient client)
        {
            _client = client;
            Debug.Log("[Daksh.OTA] Initialized modular OTA Addressables downloader.");
        }

        public void Shutdown()
        {
            Debug.Log("[Daksh.OTA] Shutdown modular OTA Addressables downloader.");
        }

        /// <summary>
        /// Downloads an asset bundle by bundleId, resuming from existing partial bytes if interrupted.
        /// </summary>
        public async Task<string> DownloadBundleWithResumeAsync(string bundleId, string saveDirectory = null)
        {
            if (_client == null) throw new InvalidOperationException("DakshAddressablesDownloader subsystem is not initialized.");

            string dir = string.IsNullOrEmpty(saveDirectory)
                ? Path.Combine(Application.persistentDataPath, "DakshOTA")
                : saveDirectory;

            if (!Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            string targetFilePath = Path.Combine(dir, $"{bundleId}.bundle");
            string partFilePath = targetFilePath + ".part";

            long existingBytes = 0;
            if (File.Exists(partFilePath))
            {
                existingBytes = new FileInfo(partFilePath).Length;
                Debug.Log($"[Daksh.OTA] Detected partial download of {existingBytes} bytes for bundle {bundleId}. Resuming via HTTP 206...");
            }

            string endpoint = $"/api/titles/{_client.Config.titleId}/ota/bundles/{bundleId}";
            string url = _client.Config.serverUrl.TrimEnd('/') + endpoint;

            using (var req = new UnityWebRequest(url, "GET"))
            {
                req.downloadHandler = new DownloadHandlerBuffer();

                if (existingBytes > 0)
                {
                    req.SetRequestHeader("Range", $"bytes={existingBytes}-");
                }

                var op = req.SendWebRequest();
                while (!op.isDone)
                {
                    float currentRatio = op.progress;
                    OnDownloadProgress?.Invoke(new DownloadProgressInfo
                    {
                        bundleId = bundleId,
                        bytesDownloaded = existingBytes + (long)(req.downloadedBytes),
                        totalBytes = 0,
                        progressRatio = currentRatio,
                        isDone = false
                    });
                    await Task.Yield();
                }

                if (req.result != UnityWebRequest.Result.Success && req.responseCode != 206)
                {
                    throw new DakshException(
                        $"Failed to download bundle {bundleId}: {req.error}",
                        req.responseCode,
                        req.error,
                        req.downloadHandler?.text
                    );
                }

                byte[] downloadedBytes = req.downloadHandler.data;

                // Write/append bytes to partial file
                using (var fs = new FileStream(partFilePath, existingBytes > 0 && req.responseCode == 206 ? FileMode.Append : FileMode.Create, FileAccess.Write))
                {
                    if (downloadedBytes != null && downloadedBytes.Length > 0)
                    {
                        fs.Write(downloadedBytes, 0, downloadedBytes.Length);
                    }
                }

                // Verify SHA-256 checksum if provided by server
                string serverSha = req.GetResponseHeader("X-Asset-SHA256") ?? req.GetResponseHeader("x-amz-meta-sha256");
                if (!string.IsNullOrEmpty(serverSha))
                {
                    string localSha = ComputeFileSha256(partFilePath);
                    if (!string.Equals(serverSha.Trim('"'), localSha, StringComparison.OrdinalIgnoreCase))
                    {
                        File.Delete(partFilePath);
                        throw new DakshException($"SHA-256 integrity check failed for bundle {bundleId}. Expected: {serverSha}, Got: {localSha}");
                    }
                    Debug.Log($"[Daksh.OTA] SHA-256 integrity verified for bundle {bundleId} ({localSha})");
                }

                // Rename part file to final bundle file
                if (File.Exists(targetFilePath)) File.Delete(targetFilePath);
                File.Move(partFilePath, targetFilePath);

                long finalSize = new FileInfo(targetFilePath).Length;
                OnDownloadProgress?.Invoke(new DownloadProgressInfo
                {
                    bundleId = bundleId,
                    bytesDownloaded = finalSize,
                    totalBytes = finalSize,
                    progressRatio = 1.0f,
                    isDone = true
                });

                Debug.Log($"[Daksh.OTA] Bundle {bundleId} downloaded successfully ({finalSize} bytes) -> {targetFilePath}");
                return targetFilePath;
            }
        }

        private static string ComputeFileSha256(string filePath)
        {
            using (var sha = SHA256.Create())
            using (var stream = File.OpenRead(filePath))
            {
                byte[] hash = sha.ComputeHash(stream);
                return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            }
        }
    }
}
