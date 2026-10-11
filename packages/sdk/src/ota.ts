export interface AssetBundleInfo {
  bundleId: string;
  titleId: string;
  platform: string;
  channel: string;
  version: string;
  fileName: string;
  fileSizeBytes: number;
  sha256Checksum: string;
  downloadUrl: string;
  uploadedAt: number;
}

export class DakshOtaClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async getActiveBundle(
    titleId: string,
    platform: string = "android",
    channel: string = "prod"
  ): Promise<AssetBundleInfo | null> {
    const res = await fetch(
      `${this.baseUrl}/api/titles/${titleId}/ota/channels?platform=${platform}&channel=${channel}`
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch active bundle: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.activeBundle;
  }

  async listBundles(titleId: string): Promise<AssetBundleInfo[]> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/ota/bundles`);
    if (!res.ok) {
      throw new Error(`Failed to list bundles: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.bundles;
  }

  async rollbackChannel(
    titleId: string,
    platform: string,
    channel: string,
    bundleId: string
  ): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/api/titles/${titleId}/ota/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, channel, bundleId })
    });

    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  }
}
