# Data Versioning, Caching & Sync Architecture

This guide explains how **Daksh Game BaaS** and the **Daksh Unity SDK** handle data versioning, offline persistence, network diffing, and synchronization.

---

## 1. Two-Tiered Data Taxonomy

Game state falls into two fundamental categories with different synchronization semantics:

| Dimension | Static / Title Data | Dynamic / Player Data |
| :--- | :--- | :--- |
| **Examples** | Item Catalogs, Drop Tables, LiveOps Remote Config, Game Balance Rules | Inventory, Currencies, Quests, Cloud Save, Match Results |
| **Authority** | Server-Authoritative (Studio publishes changes) | Client-Initiated, Server-Reconciled |
| **Read/Write Ratio** | Read-Heavy (Millions of reads, infrequent writes) | Write-Heavy (High-frequency state mutations) |
| **Sync Protocol** | HTTP 304 Conditional Validation via SHA-256 ETags | Optimistic Concurrency Control (OCC) + Idempotency Keys |
| **Offline Behavior** | Read from local AES-256 encrypted cache | Write to persistent FIFO disk queue for later replay |

---

## 2. Static Title Data & Catalogs: HTTP 304 ETag Diffing

Downloading large item catalogs on every game boot wastes cellular bandwidth and introduces login latency. Daksh solves this using **HTTP 304 Conditional Diffing**:

```mermaid
sequenceDiagram
    autonumber
    actor Player as Unity Game Client
    participant Cache as Local Encrypted Cache (AES-256)
    participant Server as Daksh Server
    participant DB as Title Data Store / Redis

    Note over Player,Server: Session 1: First Game Launch (Cold Cache)
    Player->>Cache: Query cached catalog
    Cache-->>Player: Cache miss (null)
    Player->>Server: GET /api/titles/{id}/economy/catalog
    Server->>DB: Fetch active catalog items
    DB-->>Server: Raw catalog items (JSON)
    Server->>Server: Compute SHA-256 ETag: "4f7a9c1b..."
    Server-->>Player: HTTP 200 OK + ETag: "4f7a9c1b..." + Full JSON Payload
    Player->>Cache: Save encrypted JSON + ETag to disk

    Note over Player,Server: Session 2: Subsequent Game Launch (Warm Cache)
    Player->>Cache: Read stored ETag ("4f7a9c1b...")
    Player->>Server: GET /catalog [If-None-Match: "4f7a9c1b..."]
    Server->>Server: Hash current catalog and compare with incoming ETag
    alt Data has NOT changed
        Server-->>Player: HTTP 304 Not Modified (0 bytes payload body)
        Player->>Cache: Deserialize verified cached JSON from disk
        Note over Player: Instant boot! Zero duplicate bytes transferred.
    else LiveOps team updated an item price / catalog
        Server-->>Player: HTTP 200 OK + New ETag + Updated JSON
        Player->>Cache: Overwrite local encrypted cache
    end
```

### Technical Details:
- **Server Implementation**: The server computes a SHA-256 hash across the serialized JSON body.
- **Client Implementation (`ETagStore.cs`)**: Caches both the payload and the server's `ETag`. When querying, `DakshClient` automatically attaches the `If-None-Match: "<etag>"` request header.
- **Offline Fallback**: If the network is entirely unreachable, `DakshClient.GetAsync<T>` catches the failure and automatically falls back to the local cached payload.

---

## 3. Dynamic Player Data & Mutations: Offline Queue & Idempotency

When players buy items, consume potions, or unlock levels on an unstable connection or in airplane mode, the SDK queues mutations to disk and guarantees idempotent server reconciliation.

```mermaid
flowchart TD
    A["Player Initiates Action (e.g. Purchase Item, Claim Quest)"] --> B{"Is Device Connected to Internet?"}
    
    B -- "Online" --> C["Generate Unique Idempotency Key (tx_uuid)"]
    C --> D["Dispatch HTTP POST to Daksh Server"]
    D --> E{"Server Response"}
    E -- "HTTP 200/201" --> F["Update In-Memory & Local State"]
    E -- "Network Timeout / Socket Drop" --> G["Append Action to OfflineActionQueue"]
    
    B -- "Offline" --> G
    G --> H["Encrypt Action to Disk (Application.persistentDataPath)"]
    H --> I["Optimistic Local UI Update"]
    
    I --> J["Device Regains Connectivity (NetworkReachability Changed)"]
    G --> J
    J --> K["DakshClient Automatically Triggers FlushOfflineQueueAsync()"]
    K --> L["Replay Enqueued Actions Sequentially in Strict FIFO Order"]
    L --> M["Server Checks Transaction Ledger for Idempotency Key"]
    M -- "Already Processed" --> N["Return Cached Result (isDeduped: true)"]
    M -- "First Time Execution" --> O["Execute Mutation & Commit State"]
    N --> P["Pop Action from FIFO Queue"]
    O --> P
```

### 3.1. Idempotency Keys (`X-Idempotency-Key`)
To prevent duplicate execution on network retry (e.g., deducting currency twice):
1. The client generates an idempotency key prior to dispatching the request:
   ```csharp
   string idempotencyKey = $"tx_{Guid.NewGuid():N}";
   ```
2. The server records this key in its transactional ledger.
3. If the client retries an interrupted request, the server detects the duplicate key and returns the original transaction outcome with `isDeduped: true`, preventing double-charging.

### 3.2. Optimistic Concurrency Control (OCC)
Player profile and save documents carry a monotonic `revision` counter:
```json
{
  "playerId": "usr_99812",
  "revision": 12,
  "saveData": { "checkpoint": "Dungeon_03", "xp": 4500 }
}
```
- Client sends `expectedRevision: 12` along with mutations.
- If the server has already progressed to revision 13 (e.g. another device updated the account), the write is rejected with `HTTP 409 Conflict`, invoking the game's conflict resolver.

---

## 4. Conflict Resolution Strategies

When offline client state diverges from cloud state, Daksh supports three resolution patterns:

```
                      ┌────────────────────────────────────────┐
                      │      Conflict Resolution Patterns      │
                      └──────────────────┬─────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│ Server-Authoritative │         │  Last-Write-Wins  │         │ Delta Accumulator│
│ (Currencies, IAPs)│         │ (Settings, Audio)│         │ (XP, Playtime)   │
└──────────────────┘           └──────────────────┘           └──────────────────┘
```

1. **Server-Authoritative (Default for Economy & Progression)**:
   - The cloud database is the single source of truth.
   - When offline actions replay, the server validates current wallet balances and rejects invalid transactions (`INSUFFICIENT_FUNDS`).
2. **Last-Write-Wins (LWW) (Preferences & Audio)**:
   - Compares timestamps (`updatedAt`). The client with the most recent Unix millisecond timestamp overwrites earlier values.
3. **Delta Accumulation (Additive Counters)**:
   - Instead of sending absolute totals (`xp = 5000`), the client sends relative deltas (`deltaXp = +250`).
   - The server applies atomic increments (`HINCRBY`), completely avoiding race-condition overwrites across multiple sessions.

---

## 5. Unity SDK Code Examples

### 5.1. Utilizing ETag Caching
```csharp
// First call downloads and caches catalog ETag
var catalog = await DakshClient.Instance.Economy.GetCatalogAsync();

// Subsequent calls automatically attach 'If-None-Match'
// Receives HTTP 304 and returns cached data with 0 duplicate network payload
var cachedCatalog = await DakshClient.Instance.Economy.GetCatalogAsync();
```

### 5.2. Enqueuing Mutations Offline
```csharp
// Purchases automatically queue if offline when queueIfOffline is true
var purchaseResult = await DakshClient.Instance.Economy.PurchaseItemAsync(
    itemId: "steel_shield",
    currencyCode: "GOLD",
    customIdempotencyKey: $"tx_buy_{Guid.NewGuid():N}",
    queueIfOffline: true
);
```

### 5.3. Manual Queue Management
```csharp
// Inspect pending offline actions
int pendingCount = DakshClient.Instance.OfflineQueue.Count;
Debug.Log($"Pending offline actions: {pendingCount}");

// Manually trigger flush (automatically occurs on network reconnect)
int replayedCount = await DakshClient.Instance.FlushOfflineQueueAsync();
Debug.Log($"Flushed {replayedCount} offline mutations.");
```
