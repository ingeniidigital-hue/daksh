# Changelog

All notable changes to the Daksh Game BaaS Unity SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-11

### Added
- **Core SDK Architecture**: `DakshClient` master singleton coordinating subsystems across async/await and Unity coroutines.
- **Hardware Device Auth**: Seamless anonymous and persistent guest device authentication with token refresh.
- **Encrypted Local Cache (`DakshCache`)**: AES-256-CBC local cache with SHA-256 integrity verification.
- **Conditional ETag 304 Caching (`ETagStore`)**: Network bandwidth optimization sending `If-None-Match` and serving local cached payloads with 0 download overhead on HTTP 304.
- **Persistent Offline Action Queue (`OfflineActionQueue`)**: Disk-backed FIFO replay queue for actions dispatched when offline with auto-flush on network reconnection.
- **PlayFab Economy V2 Client (`DakshEconomy`)**:
  - Catalog listing with ETag caching and 304 diffing.
  - Virtual currency queries.
  - Idempotent purchase flow with server-side deduplication.
- **Redis ZSET Leaderboards (`DakshLeaderboards`)**:
  - Score submissions with sub-millisecond tiebreaker metadata.
  - Top player rankings and localized player tier lookups.
- **Matchmaking Client (`DakshMatchmaking`)**:
  - Ticket creation, status polling (`QUEUED`, `MATCHED`, `CANCELLED`), and automated polling coroutine.
- **OTA Asset Downloader (`DakshAddressablesDownloader`)**:
  - Resumable HTTP 206 Partial Content byte-range downloading for large game assets and Addressables.
  - SHA-256 file checksum validation.
- **Nakama-Compatible Real-Time Netcode (`DakshRelay`)**:
  - 21-byte compact binary position serialization.
  - Dead reckoning extrapolation and exponential smoothing filters.
  - 30 Hz dispatch loop support.
- **Unity Editor Extension**:
  - Custom Settings Inspector (`Window > Daksh > Settings`) for configuring Title ID, Server URL, and clearing cache.
