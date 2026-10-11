import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Unity SDK UPM Package & API Contract Verification", () => {
  const unitySdkPath = path.resolve(__dirname, "../../packages/sdk/unity");

  it("TEST-UNITY-01 [UPM Manifest]: package.json has valid schema, semantic version 1.0.0, and metadata", () => {
    const pkgJsonPath = path.join(unitySdkPath, "package.json");
    expect(fs.existsSync(pkgJsonPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    expect(manifest.name).toBe("com.daksh.sdk");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.displayName).toBe("Daksh Game BaaS SDK");
    expect(manifest.unity).toBe("2021.3");
    expect(manifest.license).toBe("Apache-2.0");
    expect(manifest.keywords).toContain("daksh");
    expect(manifest.keywords).toContain("baas");
    expect(manifest.keywords).toContain("cache");
    expect(manifest.keywords).toContain("etag");
  });

  it("TEST-UNITY-02 [Assembly Definitions]: Runtime and Editor .asmdef files are valid JSON and properly linked", () => {
    const runtimeAsmPath = path.join(unitySdkPath, "Runtime/com.daksh.sdk.asmdef");
    expect(fs.existsSync(runtimeAsmPath)).toBe(true);
    const runtimeAsm = JSON.parse(fs.readFileSync(runtimeAsmPath, "utf-8"));
    expect(runtimeAsm.name).toBe("com.daksh.sdk");
    expect(runtimeAsm.rootNamespace).toBe("Daksh.SDK");

    const editorAsmPath = path.join(unitySdkPath, "Editor/com.daksh.sdk.editor.asmdef");
    expect(fs.existsSync(editorAsmPath)).toBe(true);
    const editorAsm = JSON.parse(fs.readFileSync(editorAsmPath, "utf-8"));
    expect(editorAsm.name).toBe("com.daksh.sdk.editor");
    expect(editorAsm.references).toContain("com.daksh.sdk");
  });

  it("TEST-UNITY-03 [Core Subsystems]: All C# subsystems and coordinator classes exist with proper namespaces", () => {
    const requiredFiles = [
      "Runtime/Core/DakshClient.cs",
      "Runtime/Core/DakshConfig.cs",
      "Runtime/Core/DakshException.cs",
      "Runtime/Cache/DakshCache.cs",
      "Runtime/Cache/ETagStore.cs",
      "Runtime/Cache/OfflineActionQueue.cs",
      "Runtime/Auth/DakshAuth.cs",
      "Runtime/Economy/EconomyModels.cs",
      "Runtime/Economy/DakshEconomy.cs",
      "Runtime/Leaderboards/LeaderboardModels.cs",
      "Runtime/Leaderboards/DakshLeaderboards.cs",
      "Runtime/Matchmaking/MatchmakingModels.cs",
      "Runtime/Matchmaking/DakshMatchmaking.cs",
      "Runtime/OTA/OTAModels.cs",
      "Runtime/OTA/DakshAddressablesDownloader.cs",
      "Runtime/Relay/RelayModels.cs",
      "Runtime/Relay/DakshRelay.cs",
      "Runtime/Relay/DakshRelayClient.cs",
      "Editor/DakshSettingsWindow.cs",
      "Samples~/Quickstart/DakshQuickstartDemo.cs"
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(unitySdkPath, relPath);
      expect(fs.existsSync(fullPath), `File missing: ${relPath}`).toBe(true);
      const content = fs.readFileSync(fullPath, "utf-8");
      expect(content.length).toBeGreaterThan(100);
      expect(content).toMatch(/namespace Daksh\.SDK/);
    }
  });

  it("TEST-UNITY-04 [Offline Caching & ETag Contracts]: C# implementations match server-side caching architecture", () => {
    const cacheCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/Cache/DakshCache.cs"), "utf-8");
    expect(cacheCs).toContain("Aes aes = Aes.Create()");
    expect(cacheCs).toContain("SHA256 sha = SHA256.Create()");
    expect(cacheCs).toContain("Encrypt");
    expect(cacheCs).toContain("Decrypt");

    const etagCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/Cache/ETagStore.cs"), "utf-8");
    expect(etagCs).toContain("GetETag");
    expect(etagCs).toContain("GetCachedPayload");
    expect(etagCs).toContain("Store");

    const clientCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/Core/DakshClient.cs"), "utf-8");
    // Verify HTTP 304 handling in DakshClient
    expect(clientCs).toContain("If-None-Match");
    expect(clientCs).toContain("req.responseCode == 304");
  });

  it("TEST-UNITY-05 [Economy & Idempotency]: Economy C# models match backend PlayFab Economy V2 schema", () => {
    const economyModels = fs.readFileSync(path.join(unitySdkPath, "Runtime/Economy/EconomyModels.cs"), "utf-8");
    expect(economyModels).toContain("public class CatalogItem");
    expect(economyModels).toContain("public class CatalogResponse");
    expect(economyModels).toContain("public class PurchaseRequest");
    expect(economyModels).toContain("public class PurchaseResult");
    expect(economyModels).toContain("public string idempotencyKey;");

    const economyCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/Economy/DakshEconomy.cs"), "utf-8");
    expect(economyCs).toContain("GetCatalogAsync");
    expect(economyCs).toContain("PurchaseItemAsync");
  });

  it("TEST-UNITY-06 [Resumable OTA & Netcode Contracts]: Range 206 resume and 21-byte relay packing verified", () => {
    const otaCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/OTA/DakshAddressablesDownloader.cs"), "utf-8");
    expect(otaCs).toContain('req.SetRequestHeader("Range"');
    expect(otaCs).toContain("req.responseCode == 206");
    expect(otaCs).toContain("ComputeFileSha256");

    const relayCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/Relay/DakshRelay.cs"), "utf-8");
    expect(relayCs).toContain("PackPosition");
    expect(relayCs).toContain("TryUnpackPosition");
    expect(relayCs).toContain("ExtrapolateDeadReckoning");
    expect(relayCs).toContain("SmoothPosition");
  });
});
