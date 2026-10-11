import { randomUUID } from "crypto";
import crypto from "crypto";
import {
  AssetBundleMetadata,
  AssetPlatform,
  ReleaseChannel,
  UploadBundleParams
} from "./types";
import { parseHttpByteRange } from "./range";

interface StoredBundle {
  metadata: AssetBundleMetadata;
  buffer: Buffer;
}

const bundlesStore: Map<string, StoredBundle> = new Map();
const channelPointers: Map<string, string> = new Map(); // key -> bundleId

function getChannelKey(titleId: string, platform: AssetPlatform, channel: ReleaseChannel): string {
  return `${titleId}:${platform}:${channel}`;
}

export function resetOtaStorage(): void {
  bundlesStore.clear();
  channelPointers.clear();
}

export class OtaAssetService {
  static async uploadBundle(params: UploadBundleParams): Promise<AssetBundleMetadata> {
    const { titleId, platform, channel, version, fileName, fileBuffer } = params;
    const bundleId = `bnd_${randomUUID()}`;

    const sha256Checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const downloadUrl = `/api/titles/${titleId}/ota/bundles/${bundleId}`;

    const metadata: AssetBundleMetadata = {
      bundleId,
      titleId,
      platform,
      channel,
      version,
      fileName,
      fileSizeBytes: fileBuffer.length,
      sha256Checksum,
      downloadUrl,
      uploadedAt: Date.now()
    };

    bundlesStore.set(bundleId, { metadata, buffer: fileBuffer });

    // Automatically point channel to newly uploaded bundle
    const channelKey = getChannelKey(titleId, platform, channel);
    channelPointers.set(channelKey, bundleId);

    return metadata;
  }

  static async getActiveChannelBundle(
    titleId: string,
    platform: AssetPlatform,
    channel: ReleaseChannel
  ): Promise<AssetBundleMetadata | null> {
    const channelKey = getChannelKey(titleId, platform, channel);
    const activeBundleId = channelPointers.get(channelKey);
    if (!activeBundleId) return null;

    const stored = bundlesStore.get(activeBundleId);
    return stored ? stored.metadata : null;
  }

  static async rollbackChannel(
    titleId: string,
    platform: AssetPlatform,
    channel: ReleaseChannel,
    targetBundleId: string
  ): Promise<boolean> {
    const stored = bundlesStore.get(targetBundleId);
    if (!stored) return false;
    if (stored.metadata.titleId !== titleId || stored.metadata.platform !== platform) {
      return false;
    }

    const channelKey = getChannelKey(titleId, platform, channel);
    channelPointers.set(channelKey, targetBundleId);
    return true;
  }

  static getBundleMetadata(bundleId: string): AssetBundleMetadata | null {
    const stored = bundlesStore.get(bundleId);
    return stored ? stored.metadata : null;
  }

  static getBundleContent(bundleId: string): { metadata: AssetBundleMetadata; buffer: Buffer } | null {
    return bundlesStore.get(bundleId) || null;
  }

  static getBundleRange(
    bundleId: string,
    rangeHeader?: string | null
  ): { status: 200 | 206; chunk: Buffer; contentRange?: string } | null {
    const stored = bundlesStore.get(bundleId);
    if (!stored) return null;

    const totalSize = stored.buffer.length;

    if (!rangeHeader) {
      return {
        status: 200,
        chunk: stored.buffer
      };
    }

    const parsedRange = parseHttpByteRange(rangeHeader, totalSize);
    if (!parsedRange) {
      return {
        status: 200,
        chunk: stored.buffer
      };
    }

    const { start, end } = parsedRange;
    const chunk = stored.buffer.subarray(start, end + 1);

    return {
      status: 206,
      chunk,
      contentRange: `bytes ${start}-${end}/${totalSize}`
    };
  }

  static async listBundles(
    titleId: string,
    platform?: AssetPlatform,
    channel?: ReleaseChannel
  ): Promise<AssetBundleMetadata[]> {
    const list: AssetBundleMetadata[] = [];
    for (const item of bundlesStore.values()) {
      if (item.metadata.titleId !== titleId) continue;
      if (platform && item.metadata.platform !== platform) continue;
      if (channel && item.metadata.channel !== channel) continue;
      list.push(item.metadata);
    }
    return list.sort((a, b) => b.uploadedAt - a.uploadedAt);
  }
}
