import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import {
  OtaAssetService,
  resetOtaStorage,
  parseHttpByteRange
} from "../lib/ota";

describe("STORY-14 / TDD: Cloud OTA Asset Hosting (Addressables & Unreal Chunks)", () => {
  const titleId = "TITLE_OTA_01";

  beforeEach(() => {
    resetOtaStorage();
  });

  it("TEST-14-A [Happy Path]: Uploading asset bundle generates SHA-256 checksum and CDN distribution URL", async () => {
    // Simulated 50KB asset bundle (e.g. dragon_skin.bundle)
    const simulatedBinary = Buffer.alloc(50000, 0xab); // 50,000 bytes
    const expectedSha256 = crypto.createHash("sha256").update(simulatedBinary).digest("hex");

    const bundle = await OtaAssetService.uploadBundle({
      titleId,
      platform: "android",
      channel: "dev",
      version: "v1.0.0",
      fileName: "dragon_skin.bundle",
      fileBuffer: simulatedBinary
    });

    expect(bundle.bundleId).toBeDefined();
    expect(bundle.fileSizeBytes).toBe(50000);
    expect(bundle.sha256Checksum).toBe(expectedSha256);
    expect(bundle.downloadUrl).toContain(`/api/titles/${titleId}/ota/bundles/${bundle.bundleId}`);
  });

  it("TEST-14-B [Byte-Range Resume]: Client requesting Range: bytes=1024-2047 receives HTTP 206 Partial Content with correct byte slice", async () => {
    const totalSize = 10000;
    const simulatedBinary = Buffer.from(Array.from({ length: totalSize }, (_, i) => i % 256));

    const bundle = await OtaAssetService.uploadBundle({
      titleId,
      platform: "windows",
      channel: "staging",
      version: "v1.0.0",
      fileName: "level_01.pak",
      fileBuffer: simulatedBinary
    });

    // Client requests bytes 1024 to 2047 (1024 bytes)
    const rangeHeader = "bytes=1024-2047";
    const rangeResult = OtaAssetService.getBundleRange(bundle.bundleId, rangeHeader);

    expect(rangeResult).not.toBeNull();
    expect(rangeResult!.status).toBe(206);
    expect(rangeResult!.contentRange).toBe(`bytes 1024-2047/${totalSize}`);
    expect(rangeResult!.chunk.length).toBe(1024);
    // Verify first byte of range matches byte at index 1024
    expect(rangeResult!.chunk[0]).toBe(1024 % 256);
  });

  it("TEST-14-C [Instant Rollback]: Rolling back release channel from v2 to v1 immediately routes CDN traffic to v1 bundle hash", async () => {
    // 1. Upload v1 bundle
    const v1Data = Buffer.from("Unity Addressables v1.0 payload");
    const v1Bundle = await OtaAssetService.uploadBundle({
      titleId,
      platform: "ios",
      channel: "prod",
      version: "v1.0",
      fileName: "soundtrack.bundle",
      fileBuffer: v1Data
    });

    let active = await OtaAssetService.getActiveChannelBundle(titleId, "ios", "prod");
    expect(active?.bundleId).toBe(v1Bundle.bundleId);
    expect(active?.version).toBe("v1.0");

    // 2. Upload and promote v2 bundle
    const v2Data = Buffer.from("Unity Addressables v2.0 payload");
    const v2Bundle = await OtaAssetService.uploadBundle({
      titleId,
      platform: "ios",
      channel: "prod",
      version: "v2.0",
      fileName: "soundtrack.bundle",
      fileBuffer: v2Data
    });

    active = await OtaAssetService.getActiveChannelBundle(titleId, "ios", "prod");
    expect(active?.bundleId).toBe(v2Bundle.bundleId);
    expect(active?.version).toBe("v2.0");

    // 3. Instant Rollback to v1
    const rolledBack = await OtaAssetService.rollbackChannel(titleId, "ios", "prod", v1Bundle.bundleId);
    expect(rolledBack).toBe(true);

    active = await OtaAssetService.getActiveChannelBundle(titleId, "ios", "prod");
    expect(active?.bundleId).toBe(v1Bundle.bundleId);
    expect(active?.version).toBe("v1.0");
  });

  it("TEST-14-D [Integrity Check]: Client verifies downloaded asset hash against x-amz-meta-sha256 before mounting into game memory", async () => {
    const rawContent = Buffer.from("Unreal Engine 5 Map Chunks Content");
    const expectedHash = crypto.createHash("sha256").update(rawContent).digest("hex");

    const bundle = await OtaAssetService.uploadBundle({
      titleId,
      platform: "windows",
      channel: "prod",
      version: "v1.5",
      fileName: "arena.pak",
      fileBuffer: rawContent
    });

    // Client downloads bundle and verifies hash
    const downloaded = OtaAssetService.getBundleContent(bundle.bundleId);
    expect(downloaded).not.toBeNull();

    const clientComputedHash = crypto.createHash("sha256").update(downloaded!.buffer).digest("hex");
    expect(clientComputedHash).toBe(bundle.sha256Checksum);
    expect(clientComputedHash).toBe(expectedHash);
  });
});
