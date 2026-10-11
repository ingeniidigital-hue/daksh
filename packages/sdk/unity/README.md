# Daksh Game BaaS - Unity SDK (`com.daksh.sdk`)

Official client SDK for integrating Unity games with **Daksh Game BaaS** — an open-source, sovereign, self-hostable game backend architecture providing PlayFab Economy V2 parity, Nakama real-time netcode, Redis ZSET leaderboards, matchmaking, and cloud OTA Addressables asset hosting.

[![UPM Version](https://img.shields.io/badge/UPM-1.0.0-blue.svg)](package.json)
[![Unity Version](https://img.shields.io/badge/Unity-2021.3+-black.svg)](https://unity.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE.md)

---

## Modular Architecture & Assembly Definitions

The Daksh Unity SDK is built with a **100% modular architecture**. Core functionality (transport, cryptographic cache, ETag store, offline queue, device auth) has **zero compile-time dependencies** on optional gameplay features. Each subsystem is encapsulated in its own Unity Assembly Definition (`.asmdef`):

```
packages/sdk/unity/
├── Runtime/
│   ├── com.daksh.sdk.asmdef                  # Umbrella assembly (references all modules)
│   ├── DakshClient.cs                        # Umbrella coordinator extending DakshCoreClient
│   ├── DakshSDK.cs                           # Global static facade
│   │
│   ├── Core/                                 # [com.daksh.sdk.core.asmdef]
│   │   ├── Auth/ (DakshAuth.cs)              # Hardware Device Auth & Session Manager
│   │   ├── Cache/ (DakshCache, ETagStore, OfflineActionQueue) # AES-256 + 304 diffing
│   │   ├── Transport/ (IDakshTransport, UnityWebRequestTransport) # Pluggable HTTP
│   │   ├── DakshCoreClient.cs                # Core base client & Subsystem Registry
│   │   ├── DakshConfig.cs                    # Config with modular feature toggles
│   │   └── IDakshSubsystem.cs                # Modular plugin lifecycle contract
│   │
│   ├── Economy/                              # [com.daksh.sdk.economy.asmdef]
│   │   ├── DakshEconomy.cs                   # PlayFab Economy V2 Catalogs & Purchases
│   │   └── EconomyModels.cs                  # Catalog, Currency, Purchase models
│   │
│   ├── Leaderboards/                         # [com.daksh.sdk.leaderboards.asmdef]
│   │   ├── DakshLeaderboards.cs              # Redis ZSET Leaderboards & Tiebreakers
│   │   └── LeaderboardModels.cs              # Score & Rank models
│   │
│   ├── Matchmaking/                          # [com.daksh.sdk.matchmaking.asmdef]
│   │   ├── DakshMatchmaking.cs               # Dynamic Ticket Queue & Polling
│   │   └── MatchmakingModels.cs              # Ticket & Lobby models
│   │
│   ├── OTA/                                  # [com.daksh.sdk.ota.asmdef]
│   │   ├── DakshAddressablesDownloader.cs    # Resumable HTTP 206 Byte-Range Downloader
│   │   └── OTAModels.cs                      # Bundle & Progress models
│   │
│   └── Relay/                                # [com.daksh.sdk.relay.asmdef]
│       ├── DakshRelay.cs                     # 21-byte binary packing & dead reckoning
│       ├── DakshRelayClient.cs               # 30 Hz spatial dispatch loop
│       └── RelayModels.cs                    # Relay opcodes & datagram models
│
└── Editor/                                   # [com.daksh.sdk.editor.asmdef]
    └── DakshSettingsWindow.cs                # Unity GUI Inspector (Window > Daksh > Settings)
```

### Module Inclusion Options:
- **Full Suite**: Reference `com.daksh.sdk` in your game's `.asmdef` to access all features.
- **Selective / Lightweight**: Reference only `com.daksh.sdk.core` and the specific module assemblies you need (e.g. `com.daksh.sdk.economy`). Unused modules like Relay or Addressables won't be compiled into your game binary!

---

## Key Features

- **Subsystem Registry (`IDakshSubsystem`)**: Every subsystem dynamically registers with `DakshCoreClient`. Subsystems can be enabled, disabled, or swapped at runtime via `DakshConfig` feature flags:
  ```csharp
  var config = new DakshConfig {
      enableEconomy = true,
      enableLeaderboards = true,
      enableMatchmaking = false, // Exclude from memory
      enableOTA = false,          // Exclude from memory
      enableRelay = false         // Exclude from memory
  };
  ```
- **Pluggable Transport Layer (`IDakshTransport`)**: Network transport is decoupled from `UnityWebRequest`. Game teams can plug in custom WebSockets, gRPC, or mock transports for unit testing.
- **Cryptographic Local Caching (`DakshCache`)**: Client-side AES-256 encryption protecting player credentials, wallet balances, and offline actions with SHA-256 integrity verification.
- **ETag 304 Conditional Diffing (`ETagStore`)**: Automatically sends `If-None-Match`. On `HTTP 304 Not Modified`, serves the cached payload directly with **0 duplicate network bytes**, preventing mobile bandwidth waste.
- **Persistent FIFO Offline Action Queue (`OfflineActionQueue`)**: Queues player mutations (purchases, score checkpoints, analytics events) to encrypted disk when disconnected, automatically replaying them in strict FIFO order upon reconnection.
- **PlayFab Economy V2 Client (`DakshEconomy`)**: Catalogs with ETag diffing, multi-currency support, and atomic purchases with client-generated idempotency keys (`X-Idempotency-Key`).
- **Redis Global Leaderboards (`DakshLeaderboards`)**: Score submissions with microsecond tiebreaking metadata and localized rank lookups.
- **Dynamic Matchmaking (`DakshMatchmaking`)**: Solo and party ticket creation, cancellation, and automated polling coroutine.
- **Resumable OTA Asset Downloader (`DakshAddressablesDownloader`)**: HTTP 206 Partial Content byte-range resume for Addressables, with SHA-256 file checksum validation.
- **Nakama-Compatible Real-Time Netcode (`DakshRelay`)**: 21-byte compact binary position serialization, dead reckoning extrapolation, and 30 Hz automated synchronization loop.

---

## Data Versioning, Caching & Sync Architecture

Daksh employs a two-tiered synchronization architecture ensuring zero redundant bandwidth usage for static data and guaranteed idempotent replay for dynamic player data.

| Data Type | Versioning Protocol | Cache / Sync Mechanism | Conflict Resolution |
| :--- | :--- | :--- | :--- |
| **Static / Title Data** (Catalogs, Remote Config) | Cryptographic SHA-256 ETags & Monotonic Revisions | HTTP 304 Conditional GET (`If-None-Match`). Serves local AES-256 cached data with **0 duplicate bytes**. | Server-Authoritative |
| **Dynamic Player Data** (Inventory, Cloud Save, Mutations) | Optimistic Concurrency Control (OCC) + Revision Counters | Persistent disk FIFO action queue replaying sequentially on reconnect with unique idempotency keys (`tx_uuid`). | Server-Authoritative / LWW / Delta Accumulation |

For a complete deep-dive with sequence diagrams and mathematical guarantees, see the [Data Versioning & Sync Guide](Documentation~/DataVersioningAndSync.md).

---

## Installation

### Method A: Via Unity Package Manager (Git URL)
1. In Unity, open **Window > Package Manager**.
2. Click the **+** button in the top-left and select **Add package from git URL...**.
3. Enter:
   ```text
   https://github.com/your-org/daksh.git?path=/packages/sdk/unity
   ```
4. Click **Add**.

### Method B: Via `Packages/manifest.json`
Add the package entry directly to your Unity project's `Packages/manifest.json`:
```json
{
  "dependencies": {
    "com.daksh.sdk": "https://github.com/your-org/daksh.git?path=/packages/sdk/unity#v1.0.0"
  }
}
```

---

## Usage Examples

### 1. Initialization & Subsystem Access
```csharp
using Daksh.SDK;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    private async void Start()
    {
        var config = new DakshConfig
        {
            titleId = "my_game_title",
            serverUrl = "https://api.daksh.io",
            autoFlushOfflineQueue = true
        };

        // Initialize master client
        var client = DakshClient.Initialize(config);

        // Hardware Device Authentication
        var session = await client.Auth.AuthenticateDeviceAsync("HeroPlayer_01");
        Debug.Log($"Logged in player: {session.player.id}");
    }
}
```

### 2. Economy: ETag Caching & Idempotent Purchases
```csharp
// 1. Fetch catalog (automatically cached with ETag)
var catalog = await DakshClient.Instance.Economy.GetCatalogAsync();

// Subsequent calls send 'If-None-Match' and receive HTTP 304 (0 duplicate bytes)
var cachedCatalog = await DakshClient.Instance.Economy.GetCatalogAsync();

// 2. Perform atomic purchase with idempotency key
var purchase = await DakshClient.Instance.Economy.PurchaseItemAsync(
    itemId: "legendary_sword",
    currencyCode: "GOLD",
    customIdempotencyKey: "tx_unique_guid_123"
);

if (purchase.success)
{
    Debug.Log($"Acquired {purchase.grantedItem.name}! New Balance: {purchase.newBalance}");
}
```

### 3. Leaderboards: Score Submission with Tiebreakers
```csharp
// Submit player score to weekly leaderboard (queues offline if disconnected)
var result = await DakshClient.Instance.Leaderboards.SubmitScoreAsync("weekly_dungeon", 125400);
Debug.Log($"New Rank: #{result.rank} of {result.totalPlayers}");

// Fetch top 100 leaderboard rankings
var top100 = await DakshClient.Instance.Leaderboards.GetTopScoresAsync("weekly_dungeon", limit: 100);
```

### 4. Resumable OTA Asset Downloads (HTTP 206)
```csharp
// Download or resume a 50MB Addressables bundle
string localPath = await DakshClient.Instance.OTA.DownloadBundleWithResumeAsync("bundle_world_level_02");
Debug.Log($"Bundle ready at: {localPath}");
```

### 5. Real-Time Spatial Relay Netcode (30 Hz)
```csharp
// Start 30 Hz spatial synchronization for the local player transform
DakshClient.Instance.Relay.StartPositionSync(roomId: "room_alpha_01", transform, tickRateHz: 30f);
```

### 6. Static Facade Access (`DakshSDK`)
```csharp
// Alternative clean static facade syntax
var catalog = await DakshSDK.Economy.GetCatalogAsync();
var rank = await DakshSDK.Leaderboards.GetPlayerRankAsync("arena_season_1");
```

---

## Editor Tools

Open **Window > Daksh > Settings** in the Unity Editor to:
- Configure Title ID, Backend Server URL, and AES-256 local key.
- Test server ping and inspect HTTP response headers.
- Wipe local encrypted cache and persistent offline action queues.

---

## License

This client SDK is licensed under the [Apache License 2.0](LICENSE.md).
The Daksh Game BaaS backend platform is licensed under the Business Source License 1.1 (BSL 1.1).
