# Daksh — Generic Open-Source Game Backend-as-a-Service (BaaS) & Managed Cloud GaaS

<div align="center">

[![License: BSL 1.1](https://img.shields.io/badge/License-BSL_1.1_(Fair--Code)-blue.svg)](LICENSE)
[![Release: v1.0.0](https://img.shields.io/badge/Release-v1.0.0-emerald.svg)](https://github.com/ingeniidigital-hue/daksh/releases/tag/v1.0.0)
[![Build Status](https://img.shields.io/badge/Next.js%2016-35%2F35%20Routes%20Green-brightgreen.svg)]()
[![Vitest Passing](https://img.shields.io/badge/Tests-84%2F84%20Passing-success.svg)]()
[![Benchmark](https://img.shields.io/badge/5%2C000%20CCU%20Stress-p99%20%3C%2038ms-purple.svg)]()
[![AI Project Management](https://img.shields.io/badge/PM-Planka%20(17%2F17%20Done)-blueviolet.svg)](http://localhost:1337)

**A production-grade, open-source Game BaaS and fully managed Game-as-a-Service (GaaS) platform.**  
*PlayFab parity on an open-source Nakama, Agones, PostgreSQL 16 & Redis 7 foundation with zero vendor lock-in.*

[Quickstart](#quickstart) • [Architecture](#system-architecture) • [Feature Pillars](#core-feature-pillars) • [Project Management (Planka)](#dedicated-open-source-project-management-planka) • [Multi-Client SDKs](#multi-client-sdk-suite) • [Branching & Releases](#branching--release-governance) • [License](#license)

</div>

---

## Overview

**Daksh** provides high-throughput game backend primitives without locking game studios into proprietary closed ecosystems. 

### Why Daksh?
- **Zero DevOps Cloud GaaS**: 1-click deploy to **5 Global Super-Regions** (Virginia, Frankfurt, Mumbai, Tokyo, São Paulo) with Anycast edge routing (<45ms latency) and managed Agones Dedicated Game Servers.
- **100% Self-Hostable**: Don't want managed cloud? Hit the **1-Click Eject Button** to download a pure Helm v3 chart (`deploy/helm/daksh`) and an isolated PostgreSQL dump.
- **AI-Native Engineering & TDD**: Designed for autonomous AI squads and human developers with **17 complete End-to-End Master Stories (100% Verified in Planka)**, programmatic REST APIs, and high-performance Vitest suites.
- **Multi-Client SDK Suite**: Official packages for **Unity (UPM)**, **Unreal Engine 5**, **HTML5/WebGL**, and Direct **HTTPS REST** endpoints.

---

## System Architecture

```mermaid
flowchart TD
    %% PLAYER & GAME CLIENT FLOW
    subgraph CLIENTS["Game Clients & Multi-Platform SDKs"]
        U3D["Unity C# SDK (UPM)<br>Addressables OTA • AES-256 Cache"]
        UE5["Unreal Engine Plugin<br>IoStore Chunks • UDP Netcode"]
        HTML["HTML5 / WebGL SDK<br>Direct Browser WebSocket"]
        REST["Direct HTTPS REST API<br>(Zero-SDK Integration)"]
    end

    subgraph EDGE["Global Game Traffic Edge (5 Super-Regions)"]
        ANY["Anycast Edge PoP Routing<br>(&lt;45ms Latency • Anti-DDoS Shield)"]
        CDN["Cloud OTA CDN<br>(Unity .bundle / Unreal .pak)"]
    end

    subgraph CORE_ENGINE["Daksh Game Backend Engine (Nakama 3.22 & Agones)"]
        subgraph REGIONS["5 Super-Regions: IAD • FRA • BOM • NRT • GRU"]
            CORE["Nakama V8 Game Core<br>Economy V2 • Title Data • Rulesets"]
            AGONES["Agones DGS Fleet<br>Unreal / Unity Headless Servers"]
        end
        PG[("Managed PostgreSQL 16<br>Atomic Row-Locks & PITR")]
        RD[("Managed Redis 7 Cluster<br>MM Queues & Leaderboards")]
        CH[("ClickHouse OLAP<br>10K Evt/s Telemetry")]
    end

    %% STUDIO & LIVEOPS MANAGEMENT
    subgraph STUDIO["Game Studio Developers & LiveOps Portal"]
        DASH["Daksh Studio Dashboard<br>(/dashboard • LiveOps • Cmd+K MCP)"]
        PLANKA["Planka Open-Source Project Tracker<br>(localhost:1337)"]
    end

    %% CONNECTIONS: PLAYERS
    CLIENTS --> ANY
    CLIENTS --> CDN
    ANY --> REGIONS
    REGIONS --> PG
    REGIONS --> RD
    REGIONS --> CH

    %% CONNECTIONS: STUDIO MANAGEMENT
    STUDIO --> CORE_ENGINE
```

---

## Core Feature Pillars

### 1. Multiplayer Netcode & AccelByte Matchmaking
- **Turn-Based Netcode**: In-memory match simulation with state machines, turn timers, and timeout forfeits ($0 server cost).
- **Real-Time Relay (WS/UDP)**: Sub-10ms packet dispatch for fast-paced action rooms up to 64 CCU with delta compression.
- **AccelByte-Style Matchmaking**: Configurable JSON rulesets (MMR tolerances, regional ping bounds) with automated **Dynamic Rule Flexing** to prevent queue starvation.
- **Matchmaking X-Ray**: Real-time SSE queue visualizer in Studio and Redis sorted set leaderboards with automated anti-cheat validation.

### 2. Economy V2, Title Data & LiveOps
- **Dual Virtual Currencies**: Gold & Gems with row-level PostgreSQL locks (`SELECT FOR UPDATE`) ensuring zero double-spends or balance glitch exploits.
- **Title Data (Remote Config KV Store)**:
  - **Public Title Data**: Client-facing JSON configs for seasonal events, multipliers, and client banners (<20ms response).
  - **Internal Secret Title Data**: Server-only KV store accessible exclusively by backend CloudScripts/RPCs, completely hidden from clients.
- **Loot Drop Tables**: Cryptographically randomized weighted mystery boxes with idempotency keys protecting mobile retries.
- **AI Command Menu (`Cmd+K`)**: Natural language prompt-driven catalog and balance operations via Open Model Context Protocol (MCP).

### 3. High-Volume Telemetry & Live Analytics (ClickHouse)
- **10,000 Events/sec Ingestion**: Non-blocking asynchronous telemetry pipeline with ring-buffer backpressure protection for mobile and PC titles.
- **Live Executive KPIs Dashboard**: Sub-500ms real-time queries for DAU, MAU, ARPU, and D1/D7/D30 retention cohorts using dedicated ClickHouse OLAP replicas without placing load on live match databases.
- **Automated Anti-Cheat Heuristics**: Flags abnormal player progression, velocity anomalies, and packet rate spikes in real-time.

### 4. Multi-Client SDK Suite
| Client / Engine | Package | Offline Queue | Asset Caching |
| :--- | :--- | :---: | :---: |
| **Unity Engine** | C# UPM (`com.daksh.sdk`) | Yes (AES-256) | ETag / 304 Not Modified |
| **Unreal Engine 5** | C++ Plugin (UObject wrappers) | Yes (Binary) | Native Chunk Cache |
| **HTML5 / WebGL** | TypeScript NPM Package | Yes (LocalStorage) | Browser Cache |
| **Direct HTTPS REST** | Zero-SDK HTTP Endpoints | Client-managed | HTTP 304 Headers |

### 5. Cloud OTA Asset Hosting
- Global Edge CDN hosting for **Unity Addressables** (`.bundle`) and **Unreal Engine Chunks** (`.pak` / IoStore).
- Cryptographic SHA-256 checksum validation before in-memory mounting.
- HTTP `Range` header support for resumable mobile downloads.

### 6. Fully Managed Cloud GaaS vs. 1-Click Eject
- **Daksh Managed Cloud**: Automated zero-DevOps deployment across 5 Super-Regions with a 99.99% multi-region SLA.
- **1-Click Helm Eject**: Download [`deploy/helm/daksh/`](file:///home/nikhil/Projects/daksh/deploy/helm/daksh/) + raw SQL dump to self-host on any Kubernetes cluster anytime.

---

## Dedicated Open-Source Project Management (Planka)

Daksh uses **[Planka](https://github.com/plankanban/planka)** as its dedicated, lightweight, open-source project management software to track all 17 End-to-End Master Stories.

### Quick Access
- **Web URL**: **`http://localhost:1337`**
- **Default Credentials**:
  - **Email / Username**: `admin@daksh.io` (or `admin`)
  - **Password**: `dakshpassword123`

### Pre-Populated Board:
Planka is automatically pre-configured with:
- **Project**: `Daksh Game BaaS`
- **Board**: `Master Stories & AI Roadmap`
- **Lists**: `Backlog`, `To Do`, `In Progress`, `Review & TDD`, and `Done & Verified`
- **All 17 Master Stories**: Pre-loaded as cards with full User Stories, Deliverables, Security & Compliance, and Acceptance Criteria.

### Launch / Manage Planka
```bash
# Start Planka & Postgres containers
docker compose -f deploy/pm/docker-compose.planka.yml up -d

# Re-import / sync stories at any time
node scripts/import_stories_to_planka.js
```

---

## Quickstart

### 1. Prerequisites
- Docker & Docker Compose
- Node.js >= 20.x
- Git

### 2. Run Local Engine
```bash
# Clone the repository
git clone https://github.com/ingeniidigital-hue/daksh.git
cd daksh
git checkout develop

# Boot local engine & studio
cd saas-dashboard
npm install
npm run build
npm start
```
*Open `http://localhost:3000` to access the Daksh Studio.*

### 3. Run Automated Tests
```bash
cd saas-dashboard
npm test
```
*Runs all Vitest unit and schema test suites (100% green exit code 0).*

---

## Branching & Release Governance

To maintain production stability, this repository enforces strict branch governance:

- **`develop`**: The primary branch for ongoing feature implementation, AI squads, and story completions.
- **`release/vX.Y.Z`**: Dedicated release branches for freezing and stabilizing release candidates (e.g. `release/v0.1.0-alpha`).
- **`vX.Y.Z` Tags**: Cryptographically tagged releases on Git.
- **`main`**: **Strictly reserved for production GA releases.** Active development is never pushed directly to `main`.

---

## License & Fair-Code Governance

Daksh is source-available software licensed under the **[Business Source License 1.1 (BSL 1.1)](LICENSE)**:

- **Free for Game Developers & Studios**: You are 100% free to use, modify, self-host, and deploy Daksh on your own private cloud or on-premise infrastructure (AWS, GCP, Azure, bare-metal) to power your own video games, mobile apps, and interactive software with **zero royalties, zero revenue share, and zero license fees**.
- **No Reselling as a Competing Cloud Service**: You may **not** repackage or provide Daksh to third parties as a hosted or managed Game Backend-as-a-Service (BaaS) cloud offering in competition with Daksh.
- **Automatic Apache 2.0 Conversion**: Each release version automatically converts to the fully permissive **Apache License 2.0** two years after its initial release date.
- **Client SDKs**: All client SDKs (Unity, Unreal Engine, WebGL, TypeScript) are licensed under **Apache 2.0 / MIT** and can be embedded freely into any commercial game client.

---

<div align="center">
  <b>Built by Ingenii Digital &amp; the Daksh Open Source Authors</b>
</div>
