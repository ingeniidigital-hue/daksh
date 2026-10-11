export type AssetPlatform = "ios" | "android" | "windows" | "macos" | "webgl";
export type ReleaseChannel = "dev" | "staging" | "prod";

export interface AssetBundleMetadata {
  bundleId: string;
  titleId: string;
  platform: AssetPlatform;
  channel: ReleaseChannel;
  version: string;
  fileName: string;
  fileSizeBytes: number;
  sha256Checksum: string;
  downloadUrl: string;
  uploadedAt: number;
}

export interface UploadBundleParams {
  titleId: string;
  platform: AssetPlatform;
  channel: ReleaseChannel;
  version: string;
  fileName: string;
  fileBuffer: Buffer;
}
