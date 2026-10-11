using System;

namespace Daksh.SDK
{
    [Serializable]
    public class OtaBundleMetadata
    {
        public string bundleId;
        public string fileName;
        public long fileSizeBytes;
        public string sha256Checksum;
        public string channel;
        public string version;
    }

    [Serializable]
    public class DownloadProgressInfo
    {
        public string bundleId;
        public long bytesDownloaded;
        public long totalBytes;
        public float progressRatio;
        public bool isDone;
    }
}
