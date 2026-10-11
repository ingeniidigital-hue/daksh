# Daksh Game BaaS - Unity SDK (`com.daksh.sdk`)

Official client SDK for integrating Unity games with **Daksh Game BaaS** — an open-source, sovereign, self-hostable game backend architecture providing PlayFab Economy V2 parity, Nakama real-time netcode, Redis ZSET leaderboards, matchmaking, and cloud OTA Addressables asset hosting.

[![UPM Version](https://img.shields.io/badge/UPM-1.0.0-blue.svg)](package.json)
[![Unity Version](https://img.shields.io/badge/Unity-2021.3+-black.svg)](https://unity.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE.md)

---

## Key Features

- **Standard UPM Packaging**: Clean Unity Package Manager layout with assembly definitions (`com.daksh.sdk.asmdef`) for zero-bloat compilation.
- **Cryptographic Local Caching (`DakshCache`)**: Client-side AES-256 encryption protecting player credentials, wallet balances, and offline actions with SHA-256 integrity verification.
- **ETag 304 Conditional Diffing (`ETagStore`)**: Sends `If-None-Match` on network requests; receives HTTP 304 Not Modified to serve local cached catalogs with **0 duplicate payload bytes**, saving massive bandwidth on mobile networks.
- **Persistent FIFO Offline Action Queue (`OfflineActionQueue`)**: Queues player mutations (item consumption, achievement unlocks, score checkpoints) to encrypted disk when disconnected, automatically replaying them in strict FIFO order upon reconnection.
- **PlayFab Economy V2 Client (`DakshEconomy`)**:
  - Catalog synchronization with ETag diffing.
  - Multi-currency balances (Gold, Gems, Energy).
  - Atomic purchases with client-generated idempotency keys (`X-Idempotency-Key`) preventing double-charging.
- **Redis Global Leaderboards (`DakshLeaderboards`)**:
  - Score submissions with microsecond tiebreaking metadata.
  - Top player rankings and localized player tier lookups.
- **Dynamic Matchmaking (`DakshMatchmaking`)**:
  - Flexible party and solo ticket creation, status polling (`QUEUED`, `MATCHED`, `CANCELLED`), and automated coroutines.
- **Resumable OTA Asset Downloader (`DakshAddressablesDownloader`)**:
  - HTTP 206 Partial Content byte-range resume for interrupted 50MB+ Addressable bundles.
  - Post-download SHA-256 cryptographic verification.
- **Nakama-Compatible Real-Time Netcode (`DakshRelay`)**:
  - 21-byte compact binary position serialization (`PackPosition` / `TryUnpackPosition`).
  - Dead reckoning extrapolation and exponential smoothing filters.
  - 30 Hz automated synchronization loop.

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
    "com.daksh.sdk": "https://github.com/your-org/daksh.git?path=/packages/sdk/unity#v1.0.0",
    ...
  }
}
```

### Method C: Local Disk (Embedded Package)
Clone or copy the `packages/sdk/unity` folder into your project's `Packages/com.daksh.sdk` directory.

---

## Architecture & Subsystems

```
DakshClient (MonoBehaviour Singleton)
├── DakshConfig                     # TitleId, ServerUrl, LocalEncryptionKey, Timeouts
├── DakshCache                      # AES-256 Persistent Encrypted Disk & PlayerPrefs Cache
├── ETagStore                       # HTTP 304 Conditional Validation & Diff Engine
├── OfflineActionQueue              # Disk-backed FIFO Replay Queue
├── DakshAuth                       # Hardware Device Fingerprinting & JWT Session Manager
├── DakshEconomy                    # PlayFab Economy V2 Catalogs, Currencies & Idempotent Purchases
├── DakshLeaderboards               # Redis ZSET Leaderboard Submissions & Top Rankings
├── DakshMatchmaking                # Ticket Lifecycle & Automated Polling Coroutine
├── DakshAddressablesDownloader      # Resumable HTTP 206 Byte-Range AssetBundle Downloader
└── DakshRelayClient                # Nakama-compatible 30 Hz Real-Time Spatial Relay Netcode
```

---

## Quickstart Guide

### 1. Initialization
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

        // Initialize the Daksh singleton
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
foreach (var item in catalog.items)
{
    Debug.Log($"Item: {item.name} ({item.category})");
}

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
