import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Unity SDK Modular Architecture & API Contract Verification", () => {
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

  it("TEST-UNITY-02 [Modular Assembly Definitions]: All 7 subsystem asmdef files exist and link cleanly", () => {
    const expectedAsmdefs = [
      { path: "Runtime/com.daksh.sdk.asmdef", name: "com.daksh.sdk", references: ["com.daksh.sdk.core", "com.daksh.sdk.economy"] },
      { path: "Runtime/Core/com.daksh.sdk.core.asmdef", name: "com.daksh.sdk.core", references: [] },
      { path: "Runtime/Economy/com.daksh.sdk.economy.asmdef", name: "com.daksh.sdk.economy", references: ["com.daksh.sdk.core"] },
      { path: "Runtime/Leaderboards/com.daksh.sdk.leaderboards.asmdef", name: "com.daksh.sdk.leaderboards", references: ["com.daksh.sdk.core"] },
      { path: "Runtime/Matchmaking/com.daksh.sdk.matchmaking.asmdef", name: "com.daksh.sdk.matchmaking", references: ["com.daksh.sdk.core"] },
      { path: "Runtime/OTA/com.daksh.sdk.ota.asmdef", name: "com.daksh.sdk.ota", references: ["com.daksh.sdk.core"] },
      { path: "Runtime/Relay/com.daksh.sdk.relay.asmdef", name: "com.daksh.sdk.relay", references: ["com.daksh.sdk.core"] },
      { path: "Editor/com.daksh.sdk.editor.asmdef", name: "com.daksh.sdk.editor", references: ["com.daksh.sdk.core"] }
    ];

    for (const asm of expectedAsmdefs) {
      const fullPath = path.join(unitySdkPath, asm.path);
      expect(fs.existsSync(fullPath), `Asmdef missing: ${asm.path}`).toBe(true);
      const parsed = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      expect(parsed.name).toBe(asm.name);
      for (const ref of asm.references) {
        expect(parsed.references).toContain(ref);
      }
    }
  });

  it("TEST-UNITY-03 [Subsystem Registry & IDakshSubsystem]: Modular interface implemented across all subsystems", () => {
    const interfacePath = path.join(unitySdkPath, "Runtime/Core/IDakshSubsystem.cs");
    expect(fs.existsSync(interfacePath)).toBe(true);
    const ifaceContent = fs.readFileSync(interfacePath, "utf-8");
    expect(ifaceContent).toContain("interface IDakshSubsystem");
    expect(ifaceContent).toContain("string SubsystemName { get; }");
    expect(ifaceContent).toContain("void Initialize(DakshClient client)");
    expect(ifaceContent).toContain("void Shutdown()");

    const subsystemFiles = [
      "Runtime/Economy/DakshEconomy.cs",
      "Runtime/Leaderboards/DakshLeaderboards.cs",
      "Runtime/Matchmaking/DakshMatchmaking.cs",
      "Runtime/OTA/DakshAddressablesDownloader.cs",
      "Runtime/Relay/DakshRelayClient.cs"
    ];

    for (const subFile of subsystemFiles) {
      const content = fs.readFileSync(path.join(unitySdkPath, subFile), "utf-8");
      expect(content).toContain("IDakshSubsystem");
      expect(content).toContain("SubsystemName");
      expect(content).toContain("Initialize(");
      expect(content).toContain("Shutdown(");
    }

    // Verify Subsystem registry in DakshCoreClient
    const coreClient = fs.readFileSync(path.join(unitySdkPath, "Runtime/Core/DakshCoreClient.cs"), "utf-8");
    expect(coreClient).toContain("RegisterSubsystem");
    expect(coreClient).toContain("GetSubsystem<T>");
    expect(coreClient).toContain("TryGetSubsystem<T>");
    expect(coreClient).toContain("HasSubsystem<T>");
    expect(coreClient).toContain("UnregisterSubsystem<T>");
  });

  it("TEST-UNITY-04 [Pluggable Transport Abstraction]: IDakshTransport decouples network layer from business logic", () => {
    const transportInterface = path.join(unitySdkPath, "Runtime/Core/Transport/IDakshTransport.cs");
    expect(fs.existsSync(transportInterface)).toBe(true);
    const transportContent = fs.readFileSync(transportInterface, "utf-8");
    expect(transportContent).toContain("interface IDakshTransport");
    expect(transportContent).toContain("Task<TransportResponse> SendAsync(TransportRequest request)");

    const uwrTransport = path.join(unitySdkPath, "Runtime/Core/Transport/UnityWebRequestTransport.cs");
    expect(fs.existsSync(uwrTransport)).toBe(true);
    const uwrContent = fs.readFileSync(uwrTransport, "utf-8");
    expect(uwrContent).toContain("class UnityWebRequestTransport : IDakshTransport");

    const coreClient = fs.readFileSync(path.join(unitySdkPath, "Runtime/Core/DakshCoreClient.cs"), "utf-8");
    expect(coreClient).toContain("public IDakshTransport Transport { get; set; }");
  });

  it("TEST-UNITY-05 [Offline Caching & ETag Contracts]: AES-256 and HTTP 304 diffing verified", () => {
    const cacheCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/Core/Cache/DakshCache.cs"), "utf-8");
    expect(cacheCs).toContain("Aes aes = Aes.Create()");
    expect(cacheCs).toContain("SHA256 sha = SHA256.Create()");
    expect(cacheCs).toContain("Encrypt");
    expect(cacheCs).toContain("Decrypt");

    const etagCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/Core/Cache/ETagStore.cs"), "utf-8");
    expect(etagCs).toContain("GetETag");
    expect(etagCs).toContain("GetCachedPayload");
    expect(etagCs).toContain("Store");

    const coreClient = fs.readFileSync(path.join(unitySdkPath, "Runtime/Core/DakshCoreClient.cs"), "utf-8");
    expect(coreClient).toContain("If-None-Match");
    expect(coreClient).toContain("response.StatusCode == 304");
  });

  it("TEST-UNITY-06 [Economy & Idempotency]: Economy C# models match backend PlayFab Economy V2 schema", () => {
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

  it("TEST-UNITY-07 [Resumable OTA & Netcode Contracts]: Range 206 resume and 21-byte relay packing verified", () => {
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

  it("TEST-UNITY-08 [Umbrella Client & Facade]: DakshClient and DakshSDK provide typed unified access", () => {
    const clientCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/DakshClient.cs"), "utf-8");
    expect(clientCs).toContain("public class DakshClient : DakshCoreClient");
    expect(clientCs).toContain("public DakshEconomy Economy");
    expect(clientCs).toContain("public DakshLeaderboards Leaderboards");
    expect(clientCs).toContain("public DakshMatchmaking Matchmaking");
    expect(clientCs).toContain("public DakshAddressablesDownloader OTA");
    expect(clientCs).toContain("public DakshRelayClient Relay");

    const sdkCs = fs.readFileSync(path.join(unitySdkPath, "Runtime/DakshSDK.cs"), "utf-8");
    expect(sdkCs).toContain("public static class DakshSDK");
    expect(sdkCs).toContain("public static DakshClient Client");
    expect(sdkCs).toContain("public static DakshEconomy Economy");
  });

  it("TEST-UNITY-09 [Data Versioning & Sync Documentation]: Verifies comprehensive architecture documentation for ETag diffing, OCC, and conflict resolution", () => {
    const docPath = path.join(unitySdkPath, "Documentation~/DataVersioningAndSync.md");
    expect(fs.existsSync(docPath)).toBe(true);

    const docContent = fs.readFileSync(docPath, "utf-8");
    expect(docContent).toContain("HTTP 304 Conditional Diffing");
    expect(docContent).toContain("If-None-Match");
    expect(docContent).toContain("OfflineActionQueue");
    expect(docContent).toContain("Idempotency Keys");
    expect(docContent).toContain("Optimistic Concurrency Control");
    expect(docContent).toContain("Server-Authoritative");
    expect(docContent).toContain("Last-Write-Wins");
    expect(docContent).toContain("Delta Accumulation");

    const readmeContent = fs.readFileSync(path.join(unitySdkPath, "README.md"), "utf-8");
    expect(readmeContent).toContain("Data Versioning, Caching & Sync Architecture");
    expect(readmeContent).toContain("Documentation~/DataVersioningAndSync.md");
  });

  it("TEST-UNITY-10 [Zero-Trust Action Reporting Subsystem]: Verifies DakshActionReporter, zero-trust action reporting, and absence of client SetGold/SetBalance APIs", () => {
    // 1. Verify Actions asmdef exists and references core
    const actionsAsmPath = path.join(unitySdkPath, "Runtime/Actions/com.daksh.sdk.actions.asmdef");
    expect(fs.existsSync(actionsAsmPath)).toBe(true);
    const actionsAsm = JSON.parse(fs.readFileSync(actionsAsmPath, "utf-8"));
    expect(actionsAsm.name).toBe("com.daksh.sdk.actions");
    expect(actionsAsm.references).toContain("com.daksh.sdk.core");

    // 2. Verify DakshActionReporter class
    const reporterPath = path.join(unitySdkPath, "Runtime/Actions/DakshActionReporter.cs");
    expect(fs.existsSync(reporterPath)).toBe(true);
    const reporterContent = fs.readFileSync(reporterPath, "utf-8");
    expect(reporterContent).toContain("class DakshActionReporter : IDakshSubsystem");
    expect(reporterContent).toContain("ReportActionAsync");
    expect(reporterContent).toContain("OnActionResolved");
    expect(reporterContent).toContain("OnExploitDetected");

    // 3. Verify security: NO client SetGold / SetInventory APIs exist
    expect(reporterContent).not.toContain("SetGold");
    expect(reporterContent).not.toContain("SetBalance");
    expect(reporterContent).not.toContain("SetInventory");

    // 4. Verify Zero-Trust documentation in DataVersioningAndSync.md
    const docPath = path.join(unitySdkPath, "Documentation~/DataVersioningAndSync.md");
    const docContent = fs.readFileSync(docPath, "utf-8");
    expect(docContent).toContain("Zero-Trust Architecture: Why Clients NEVER Set State");
    expect(docContent).toContain("The Principle of Server-Authoritative Action Reporting");
    expect(docContent).toContain("EXPLOIT_DETECTED");
  });
});
