#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const storiesData = [
  {
    "id": "STORY-01",
    "title": "Local-First Core Engine & 1-Command CLI Bootstrapper",
    "category": "core",
    "status": "todo",
    "priority": "critical",
    "user_story": "As a game developer, I want to execute npx daksh dev and have a local Nakama + PostgreSQL + Redis stack running in under 60 seconds without creating any cloud accounts, so that I can build and test my game completely free and offline.",
    "deliverables": [
      "docker-compose.yml with Nakama 3.22, PostgreSQL 16 & Redis 7 alpine containers",
      "packages/cli with standalone CLI binary (npx daksh dev) and port check",
      "Studio Dashboard landing view displaying local container health"
    ],
    "technical_tasks": [
      "Author docker-compose.yml with Nakama 3.22, PostgreSQL 16, and Redis 7 Alpine containers with container healthchecks",
      "Implement local.yml Nakama configuration with low-memory footprint (<250MB) and local socket tuning",
      "Develop packages/cli/bin/daksh.ts (npx daksh dev) prerequisite checker (Docker daemon alive check) and container bootstrapper",
      "Implement automated studio browser launch opening http://localhost:3000 with local container health status indicators"
    ],
    "test_cases": [
      "TEST-01-A [Happy Path]: Cold boot - Docker containers bind to ports 7350, 5432, and 6379 cleanly",
      "TEST-01-B [Healthcheck]: HTTP GET http://localhost:7350/v2/healthcheck returns HTTP 200 OK within 15 seconds",
      "TEST-01-C [Failure Mode]: Port conflict - if port 7350 is already occupied, CLI reports human-readable error and exits with code 1",
      "TEST-01-D [Air-Gap Check]: Core engine boots with no active internet connection and zero external network calls"
    ],
    "security_compliance": [
      "Deterministic local credentials; zero telemetry to external servers",
      "Air-gapped offline data isolation"
    ],
    "acceptance_criteria": [
      "Given Docker is running on macOS, Linux, or Windows WSL",
      "When the developer runs npx daksh dev",
      "Then ports 7350 and 3000 bind successfully in <60s, and GET /v2/healthcheck returns HTTP 200"
    ],
    "verification_gate": "Healthcheck :7350 HTTP 200 in <15s",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-02",
    "title": "Player Identity Federation & Device Authentication",
    "category": "sdk",
    "status": "todo",
    "priority": "critical",
    "user_story": "As a mobile game studio, I want players to authenticate instantly via Device ID and link Steam, Google Play, or Apple accounts later, so that onboarding has zero friction while retaining cross-platform account recovery.",
    "deliverables": [
      "Nakama RPC daksh.auth.authenticate_device with Ed25519 JWT generation",
      "Studio UI /dashboard/[id]/players listing active players and credentials",
      "Client SDK hook Daksh.Auth.AuthenticateDeviceAsync() in C# and TypeScript"
    ],
    "technical_tasks": [
      "Implement Nakama RPC daksh.auth.authenticate_device accepting deviceId and titleId",
      "Implement Ed25519 asymmetric JWT token generation with 2-hour expiration and cryptographic refresh tokens",
      "Build Studio UI /dashboard/[id]/players for inspecting registered player accounts, session histories, and device identifiers",
      "Write Client SDK authentication hooks in TypeScript and Unity C# (Daksh.Auth.AuthenticateDeviceAsync)"
    ],
    "test_cases": [
      "TEST-02-A [Happy Path]: Valid device ID creates a new player row and returns an Ed25519-signed JWT token",
      "TEST-02-B [Idempotency]: Calling authenticate_device with an existing device ID returns the existing profile without duplicating records",
      "TEST-02-C [Failure Mode]: Blank or null deviceId returns HTTP 400 Bad Request with validation error message",
      "TEST-02-D [Security Check]: Modifying a single character of the JWT payload or signature causes token verification to reject with HTTP 401 Unauthorized"
    ],
    "security_compliance": [
      "Ed25519 JWT signed with 256-bit asymmetric keys and 2-hour expiration",
      "GDPR / India DPDP Right to be Forgotten deletion pipeline"
    ],
    "acceptance_criteria": [
      "Given a game client with a hardware device identifier",
      "When the client submits AuthenticateDevice(deviceId)",
      "Then a valid JWT token is returned, player row is created, and re-authenticating returns existing profile"
    ],
    "verification_gate": "Asymmetric JWT validated & refreshed cleanly",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-03",
    "title": "PlayFab Economy V2 & Atomic Wallet Concurrency",
    "category": "economy",
    "status": "todo",
    "priority": "critical",
    "user_story": "As a game designer, I want to create dual currencies (Gold and Gems), item catalogs, and stores where purchases deduct balances atomically, so that players can buy in-game items without wallet balance glitches or race condition exploits.",
    "deliverables": [
      "TypeScript V8 Nakama extension economy_v2.ts registering daksh.economy.purchase_item",
      "PostgreSQL row-level locks (SELECT balance FROM player_wallets WHERE player_id = $1 FOR UPDATE)",
      "Studio UI /dashboard/[id]/catalog for visual item and currency creation"
    ],
    "technical_tasks": [
      "Create TypeScript V8 Nakama runtime module economy_v2.ts registering daksh.economy.purchase_item",
      "Implement PostgreSQL atomic row-level locking query (SELECT balance FROM player_wallets WHERE player_id = $1 FOR UPDATE)",
      "Add PostgreSQL database constraint CHECK (balance >= 0) on player_wallets",
      "Build Studio UI /dashboard/[id]/catalog for managing item catalogs, virtual currencies (Gold/Gems), and store prices"
    ],
    "test_cases": [
      "TEST-03-A [Happy Path]: Player with 500 Gold purchases 100 Gold item; wallet becomes 400 Gold and item appears in inventory atomically",
      "TEST-03-B [Concurrency/Race Condition]: 2 concurrent purchase requests arrive simultaneously for a 100 Gold item when player only has 100 Gold; exactly 1 succeeds and the other fails with INSUFFICIENT_FUNDS",
      "TEST-03-C [Failure Mode]: Purchase request with insufficient funds returns HTTP 402 with zero wallet mutation",
      "TEST-03-D [Database Integrity]: Transaction aborts and rolls back completely if inventory insertion fails"
    ],
    "security_compliance": [
      "ACID Transaction Isolation wrapping wallet deduction and inventory grant",
      "PostgreSQL CHECK (balance >= 0) database constraint"
    ],
    "acceptance_criteria": [
      "Given a player has 100 GOLD and an item costs 100 GOLD",
      "When 2 concurrent purchase requests arrive simultaneously",
      "Then exactly 1 purchase succeeds (balance becomes 0) and the second fails with INSUFFICIENT_FUNDS"
    ],
    "verification_gate": "Zero race-condition double-spends on wallets",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-04",
    "title": "Title Data (Remote Config KV Store), Internal Title Data & Loot Drop Tables",
    "category": "economy",
    "status": "todo",
    "priority": "critical",
    "user_story": "As a live game director, I want a centralized Title Data (Key-Value Remote Config) and Internal Title Data store, so that our studio can update game constants, seasonal events, maintenance flags, and loot drop tables on the fly without releasing a new client binary.",
    "deliverables": [
      "Title Data Key-Value Store endpoints (GetTitleData, SetTitleData) for JSON configs",
      "Internal Title Data (Secret / Server-Only) KV store accessible only by backend CloudScript",
      "Weighted mystery loot drop tables with cryptographically random RNG",
      "Studio UI /dashboard/[id]/title-data for managing public and internal configs"
    ],
    "technical_tasks": [
      "Implement Title Data KV store endpoints GetTitleData and SetTitleData for public remote configs",
      "Implement Internal Title Data store accessible only by backend CloudScript / server RPCs",
      "Implement weighted random loot drop engine using crypto/rand for unguessable RNG distribution",
      "Build Studio UI /dashboard/[id]/title-data supporting JSON schema validation, public/internal toggles, and live previews"
    ],
    "test_cases": [
      "TEST-04-A [Happy Path]: Client fetches GetTitleData and receives public game constants in <20ms",
      "TEST-04-B [Security Isolation]: Game client request to GetTitleData never leaks internal title keys or secret server configs",
      "TEST-04-C [RNG Distribution]: 10,000 loot box rolls with 70% Common / 25% Rare / 5% Legendary match expected statistical variance within 1.5%",
      "TEST-04-D [Failure Mode]: Malformed JSON submission in SetTitleData is rejected by schema validator before database commit"
    ],
    "security_compliance": [
      "Access Isolation: Internal title data completely hidden from game client responses",
      "Cryptographic Randomness: RNG utilizes crypto/rand to prevent seed exploitation"
    ],
    "acceptance_criteria": [
      "Given a game client queries GetTitleData()",
      "When Title Data contains public configs and internal secret server flags",
      "Then public configs return in <20ms while internal secrets are completely omitted"
    ],
    "verification_gate": "GetTitleData <20ms; Internal secrets omitted from client",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-05",
    "title": "AI Command Menu (Cmd+K) & Open MCP Server",
    "category": "economy",
    "status": "todo",
    "priority": "high",
    "user_story": "As a studio operator, I want to press Cmd+K in Daksh Studio and enter natural language prompts to generate catalogs, adjust currency rates, or inspect economy metrics, so that LiveOps management requires zero repetitive manual forms.",
    "deliverables": [
      "AICommandMenu.tsx React modal with Cmd+K listener and structured prompt parser",
      "Open Model Context Protocol (MCP) server endpoints in /api/mcp",
      "Automated catalog and title data generation from natural language prompts"
    ],
    "technical_tasks": [
      "Develop AICommandMenu.tsx React modal with Cmd+K keyboard shortcut listener and fuzzy search",
      "Build Open Model Context Protocol (MCP) server endpoints under /api/mcp for LLM agent integration",
      "Implement prompt intent parser with Zod schema validation for creating items, adjusting currencies, and querying live metrics",
      "Add client-side custom event bus daksh_data_updated for zero-reload table updates upon AI actions"
    ],
    "test_cases": [
      "TEST-05-A [Happy Path]: Prompt 'Create an Epic Dragon Armor for 500 Gems' parses into valid catalog item JSON in <1.5s",
      "TEST-05-B [MCP Endpoint]: GET /api/mcp/tools returns MCP tool definitions conforming to the Model Context Protocol schema",
      "TEST-05-C [Failure Mode]: Gibberish or malicious prompt injection is sanitized and safely rejected with suggestions",
      "TEST-05-D [Event Dispatch]: Successful AI creation emits daksh_data_updated and UI reflects the new item without browser reload"
    ],
    "security_compliance": [
      "Prompt sanitization and Zod JSON schema validation before database execution",
      "Audit logging for every AI-generated state change"
    ],
    "acceptance_criteria": [
      "Given an operator presses Cmd+K and types 'Create a Halloween bundle for 250 Gems'",
      "When the prompt is submitted",
      "Then the AI parses the intent and creates the bundle in the catalog in <1.5s"
    ],
    "verification_gate": "Natural language prompt generates valid catalog in <1.5s",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-06",
    "title": "Turn-Based Multiplayer Engine (Sync/Async)",
    "category": "multiplayer",
    "status": "todo",
    "priority": "high",
    "user_story": "As an indie developer building a board, card, or pool game, I want turn-based match rooms with state machines, turn timers, and timeout forfeits, so that my game has multiplayer without dedicated server hosting costs.",
    "deliverables": [
      "Nakama Match Handler turn_match.ts managing player turns, moves, and board state",
      "Turn timer watchdog with automated forfeit on timeout (e.g. 30 seconds)",
      "Atomic match completion handler transferring entry fees and rating updates"
    ],
    "technical_tasks": [
      "Author Nakama match handler turn_match.ts with in-memory match state machine (WAITING, ACTIVE, RESOLVED)",
      "Implement turn timer watchdog loop with automated timeout forfeit (e.g. 30s turn countdown)",
      "Build server-authoritative move validation checking rules before state modification",
      "Implement atomic match completion handler executing rating/MMR updates and transferring match rewards"
    ],
    "test_cases": [
      "TEST-06-A [Happy Path]: Player 1 submits valid move; move broadcasts to Player 2 and active turn token switches",
      "TEST-06-B [Timeout Forfeit]: Player 1 fails to submit move within 30 seconds; server triggers forfeit and declares Player 2 winner",
      "TEST-06-C [Failure Mode]: Player 2 submits move out of turn; server rejects with NOT_YOUR_TURN and zero state change",
      "TEST-06-D [Zero DB Writes]: Match simulation runs purely in-memory; database is touched only on match start and completion"
    ],
    "security_compliance": [
      "Server-authoritative move validation checking legal actions before applying state",
      "In-memory match simulation with zero database writes per turn"
    ],
    "acceptance_criteria": [
      "Given a 2-player turn-based match",
      "When Player 1 submits a move within their turn timer",
      "Then move is broadcast to Player 2 and active turn switches; if timer expires, inactive player is forfeited"
    ],
    "verification_gate": "Turn handoff, timeout forfeit & win commit verified",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-07",
    "title": "Real-Time Relay Netcode (WebSocket / UDP)",
    "category": "multiplayer",
    "status": "todo",
    "priority": "high",
    "user_story": "As a developer of action or sports games, I want a client-authoritative UDP/WebSocket relay netcode supporting up to 64 players per room, so that players experience low-latency multiplayer without complex dedicated server logic.",
    "deliverables": [
      "Nakama real-time relay handler relay_match.ts with sub-10ms packet dispatch",
      "Opcode-based message packing (position, velocity, rotation, animation states)",
      "Client smoothing and dead-reckoning extrapolation utilities in Unity C# SDK"
    ],
    "technical_tasks": [
      "Author Nakama real-time relay match handler relay_match.ts with sub-10ms packet dispatch",
      "Implement binary opcode-based message serialization for transforms (position, velocity, rotation) and animation states",
      "Implement packet rate limiting (max 60 packets/sec per client) and maximum datagram size enforcement (1024 bytes)",
      "Write client smoothing and dead-reckoning extrapolation utilities in C# for the Unity SDK"
    ],
    "test_cases": [
      "TEST-07-A [Happy Path]: 32 connected clients broadcast position updates at 30 Hz with <10ms server processing overhead",
      "TEST-07-B [Rate Limiting]: Client sending >60 packets/sec has excess packets throttled without crashing the room",
      "TEST-07-C [Failure Mode]: Packet exceeding 1024 bytes is dropped with security warning logged",
      "TEST-07-D [Disconnection]: Client socket drop triggers room peer notification and cleanly deallocates player slot"
    ],
    "security_compliance": [
      "Packet rate-limiting (max 60 packets/sec per client) to prevent DDoS floods",
      "Payload sanitization checking max packet size (1024 bytes per datagram)"
    ],
    "acceptance_criteria": [
      "Given 32 connected clients in a relay room",
      "When one client sends position packets at 30 Hz",
      "Then all peers receive broadcasts with <10ms server processing overhead and zero packet drops"
    ],
    "verification_gate": "32 WebSocket clients broadcast with <10ms jitter",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-08",
    "title": "AccelByte Matchmaking Rulesets with Dynamic Rule Flexing",
    "category": "multiplayer",
    "status": "todo",
    "priority": "high",
    "user_story": "As a competitive multiplayer game producer, I want matchmaking rules defined in JSON with skill rating (MMR) tolerances, ping boundaries, and automated rule flexing step-downs, so that players find fair matches quickly without queue starvation.",
    "deliverables": [
      "Matchmaker rules engine parsing JSON rulesets (min/max players, skill delta, max ping)",
      "Dynamic rule flexing loop relaxing MMR tolerance every 5 seconds in queue",
      "Multi-ticket batching pairing compatible parties into optimal rooms"
    ],
    "technical_tasks": [
      "Develop matchmaker engine parsing JSON rulesets (team size, MMR skill delta, latency limits)",
      "Implement dynamic rule flexing loop relaxing MMR tolerances every 5 seconds in queue",
      "Build multi-ticket party batching pairing solo players and pre-formed parties into balanced teams",
      "Enforce anti-smurfing constraints preventing parties with high skill discrepancy from distorting matchmaking"
    ],
    "test_cases": [
      "TEST-08-A [Happy Path]: 2 evenly matched players queue and form a match within 2 seconds",
      "TEST-08-B [Rule Flexing]: High-MMR player queueing alone triggers rule flexing step-downs at 5s, 10s, and 15s until match forms",
      "TEST-08-C [Latency Boundary]: Players with >150ms ping delta are separated into regional buckets and never matched together",
      "TEST-08-D [Party Batching]: A 2-player party and two solo players combine into a balanced 4-player lobby"
    ],
    "security_compliance": [
      "Anti-smurfing constraints preventing high-discrepancy party smurfs",
      "Geographic latency boundary enforcement protecting regional ping quality"
    ],
    "acceptance_criteria": [
      "Given 100 players queueing with diverse MMRs",
      "When high-MMR players wait longer than 15 seconds",
      "Then rule flexing activates, expanding tolerance until match forms without indefinite stalls"
    ],
    "verification_gate": "100 simulated queue players matched with rule flexing",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-09",
    "title": "Matchmaking X-Ray Admin Portal & Global Leaderboards",
    "category": "multiplayer",
    "status": "todo",
    "priority": "medium",
    "user_story": "As a game producer, I want a live Matchmaking X-Ray visualizer in Daksh Studio to inspect active queues, ticket pools, and forming matches in real time, plus tiered Redis leaderboards, so that I can monitor competitive health live.",
    "deliverables": [
      "Studio UI /dashboard/[id]/matchmaking with live SSE visualizer showing queues and wait times",
      "Redis sorted set leaderboard engine with daily, weekly, and all-time resets",
      "RPC submit_score with automated anti-cheat rate limiting"
    ],
    "technical_tasks": [
      "Build Studio UI /dashboard/[id]/matchmaking with live Server-Sent Events (SSE) stream showing queue pools and wait times",
      "Implement Redis sorted-set (ZSET) leaderboard engine supporting daily, weekly, and all-time boards",
      "Author RPC submit_score with rate-limiting and impossible delta spike detection",
      "Implement deterministic rank tie-breaking using microsecond timestamps"
    ],
    "test_cases": [
      "TEST-09-A [Happy Path]: Score submission updates Redis ZSET and returns updated global rank in <5ms",
      "TEST-09-B [Tie-Breaking]: Two players with identical score of 5,000 are ranked deterministically by submission timestamp",
      "TEST-09-C [Live SSE Stream]: Matchmaking X-Ray client receives real-time queue ticket counts via SSE stream",
      "TEST-09-D [Anti-Cheat Failure Mode]: Score delta exceeding max theoretical rate is rejected with audit alert"
    ],
    "security_compliance": [
      "Score injection protection rejecting impossible delta spikes",
      "Deterministic leaderboard rank tie-breakers using submission timestamps"
    ],
    "acceptance_criteria": [
      "Given players queueing for matches and submitting scores",
      "When the producer opens Matchmaking X-Ray",
      "Then live queue pools render with active wait times, and leaderboard ranks update instantaneously"
    ],
    "verification_gate": "Live SSE queue stream & 500 leaderboard updates verified",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-10",
    "title": "High-Volume Telemetry Ingestion (10,000 events/sec)",
    "category": "analytics",
    "status": "todo",
    "priority": "high",
    "user_story": "As a data engineer, I want the backend to ingest up to 10,000 gameplay events per second (kills, loot, deaths, level ups) buffered into ClickHouse or PostgreSQL, so that all gameplay analytics are captured without slowing down the game server.",
    "deliverables": [
      "High-throughput HTTP/gRPC ingestion endpoint /api/telemetry/events",
      "In-memory ring buffer batch flusher flushing in 1,000-event chunks every 1 second",
      "ClickHouse OLAP schema with partitioning by title_id and event_date"
    ],
    "technical_tasks": [
      "Build high-throughput ingestion endpoint /api/telemetry/events accepting JSON/gRPC event batches",
      "Implement in-memory ring buffer batch flusher flushing 1,000-event chunks every 1 second",
      "Design ClickHouse OLAP schema with partitioning by title_id and event_date",
      "Implement automated PII scrubber stripping IP addresses, passwords, and sensitive headers before storage"
    ],
    "test_cases": [
      "TEST-10-A [Happy Path]: 10,000 simulated events/sec ingest and flush to storage with 0 dropped events",
      "TEST-10-B [Latency SLA]: Ingestion API returns HTTP 202 Accepted in sub-5ms per batch",
      "TEST-10-C [PII Redaction]: Incoming telemetry payload containing raw IP and email address has fields scrubbed before persisting",
      "TEST-10-D [Failure Mode]: Event payload exceeding 4KB limit returns HTTP 413 Payload Too Large"
    ],
    "security_compliance": [
      "Payload size limits (max 4KB per event) and rate-limiting per client token",
      "PII redaction scrubbing IP addresses and sensitive metadata before storage"
    ],
    "acceptance_criteria": [
      "Given an incoming stream of 10,000 events/sec",
      "When the telemetry ingestion pipeline processes the stream",
      "Then all events buffer and flush into ClickHouse/PostgreSQL with 0 dropped events and sub-5ms ack"
    ],
    "verification_gate": "10,000 events/sec batch flush with 0 dropped packets",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-11",
    "title": "Live Executive KPIs Dashboard (DAU, Retention, ARPU)",
    "category": "analytics",
    "status": "todo",
    "priority": "medium",
    "user_story": "As a studio executive or investor, I want an executive analytics dashboard showing DAU, WAU, MAU, D1/D7/D30 retention cohorts, and ARPU graphs, so that our team can make data-driven decisions on monetization and retention.",
    "deliverables": [
      "Studio UI /dashboard/[id]/analytics with interactive KPI cards and cohort tables",
      "OLAP aggregation queries calculating rolling active users and cohort retention",
      "CSV/JSON raw metric export button for external BI tools"
    ],
    "technical_tasks": [
      "Build Studio UI /dashboard/[id]/analytics with interactive KPI cards (DAU, WAU, MAU, ARPU)",
      "Implement OLAP SQL aggregation queries for D1, D7, and D30 rolling retention cohort tables",
      "Add CSV and JSON raw telemetry export API for external business intelligence tools",
      "Implement Role-Based Access Control (RBAC) restricting revenue and ARPU metrics to studio admins"
    ],
    "test_cases": [
      "TEST-11-A [Happy Path]: Analytics dashboard renders KPI cards over 100,000 historical events in <250ms",
      "TEST-11-B [Cohort Calculation]: D1/D7/D30 retention calculations match ground truth cohort formulas",
      "TEST-11-C [RBAC Security]: Non-admin member querying ARPU endpoints receives HTTP 403 Forbidden",
      "TEST-11-D [Export Verification]: CSV export streams valid RFC 4180 formatted data"
    ],
    "security_compliance": [
      "Read-only database query isolation preventing analytics from impacting game server latency",
      "Role-based access control (RBAC) restricting financial ARPU metrics to studio admins"
    ],
    "acceptance_criteria": [
      "Given 100,000 historical telemetry events in the database",
      "When the studio executive loads the Analytics dashboard",
      "Then DAU, MAU, D1-D30 retention curves, and ARPU render in <250ms"
    ],
    "verification_gate": "OLAP aggregations over 100K historical events rendered <250ms",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-12",
    "title": "B2B SaaS Platform Monetization (Razorpay + Paddle)",
    "category": "payments",
    "status": "todo",
    "priority": "critical",
    "user_story": "As a Daksh finance operator, I want our B2B SaaS platform to charge game studios for cloud tiers via Razorpay (India UPI/RuPay) and Paddle (Global USD Merchant of Record), so that studios worldwide can subscribe effortlessly.",
    "deliverables": [
      "Geo-routed checkout router /api/billing/create-checkout (India -> Razorpay, Global -> Paddle)",
      "Razorpay webhook handler /api/billing/webhooks/razorpay with HMAC-SHA256 signature verification",
      "Paddle webhook handler /api/billing/webhooks/paddle with cryptographic signature check",
      "Studio UI /dashboard/[id]/billing showing active tier (Local Free, Pro, Studio Cloud) and invoices"
    ],
    "technical_tasks": [
      "Build geo-routed checkout endpoint /api/billing/create-checkout routing India IP to Razorpay (INR) and Global to Paddle (USD)",
      "Implement Razorpay webhook handler /api/billing/webhooks/razorpay with HMAC-SHA256 signature verification",
      "Implement Paddle webhook handler /api/billing/webhooks/paddle with timestamped ts + h1 signature verification",
      "Build Studio UI /dashboard/[id]/billing displaying current cloud tier (Local Free, Pro, Studio Cloud) and payment history"
    ],
    "test_cases": [
      "TEST-12-A [Geo-Routing]: Header cf-ipcountry: IN routes to Razorpay (INR Rs 9,999/mo); cf-ipcountry: US routes to Paddle ($149/mo)",
      "TEST-12-B [Razorpay HMAC]: Valid HMAC-SHA256 updates title cloud tier; tampered payload returns HTTP 400",
      "TEST-12-C [Paddle Signature]: Valid ts + h1 header is verified; expired or mismatched signature is rejected",
      "TEST-12-D [Idempotent Webhook]: Duplicate delivery of same payment webhook is safely deduplicated without double entitlement"
    ],
    "security_compliance": [
      "Cryptographic HMAC-SHA256 verification rejecting tampered webhook payloads",
      "Global tax compliance: Paddle acts as Merchant of Record handling VAT, GST, and sales taxes"
    ],
    "acceptance_criteria": [
      "Given a studio subscribing to a Daksh Cloud tier",
      "When an Indian studio checks out, Razorpay opens in INR; when a US studio checks out, Paddle opens in USD",
      "Then upon webhook delivery with valid HMAC, the title cloud_tier updates instantly in PostgreSQL"
    ],
    "verification_gate": "HMAC-SHA256 verifier blocks tampered webhooks; geo-routing passes",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-13",
    "title": "Multi-Client SDK Suite, Data Caching & Version Diffing",
    "category": "sdk",
    "status": "todo",
    "priority": "critical",
    "user_story": "As a cross-platform game developer using Unity, Unreal, HTML5, or direct HTTPS REST, I want client SDKs with local AES-256 caching, ETag 304 diffing, and offline action queues, so that my game runs smoothly over intermittent mobile networks.",
    "deliverables": [
      "Unity C# UPM Package com.daksh.sdk with async/await, persistent cache, and offline queue",
      "Unreal Engine 5 C++ Plugin with native UObject wrappers and async tasks",
      "HTML5 / WebGL TypeScript SDK with browser WebSocket and LocalStorage cache",
      "Direct HTTPS REST Endpoints for zero-SDK integrations",
      "ETag & Last-Modified caching headers returning HTTP 304 Not Modified when catalog is unchanged"
    ],
    "technical_tasks": [
      "Develop Unity C# UPM package com.daksh.sdk with async/await, persistent cache, and offline queue",
      "Author Unreal Engine 5 C++ Plugin with native UObject wrappers and async tasks",
      "Build HTML5 / WebGL TypeScript SDK with browser WebSocket and LocalStorage cache",
      "Implement HTTP ETag and Last-Modified conditional caching headers returning HTTP 304 Not Modified",
      "Build persistent offline action replay queue guaranteeing zero lost progress upon network reconnect"
    ],
    "test_cases": [
      "TEST-13-A [Conditional Caching]: Client sending matching If-None-Match: <etag> receives HTTP 304 Not Modified with 0 byte payload",
      "TEST-13-B [Offline Queue Replay]: 5 offline inventory transactions queue on disk and replay in FIFO order upon network reconnect",
      "TEST-13-C [Cross-Platform Parity]: Unity C#, Godot, and WebGL SDKs authenticate and fetch catalogs with identical JSON contracts",
      "TEST-13-D [Disk Encryption]: Local cached player credentials on client are encrypted with AES-256"
    ],
    "security_compliance": [
      "Local AES-256 encrypted disk cache protecting cached player inventories",
      "Persistent offline action replay queue guaranteeing zero lost purchases or progress"
    ],
    "acceptance_criteria": [
      "Given a game client in Unity, Unreal, HTML5, or REST mode",
      "When the client fetches catalog data repeatedly",
      "Then server responds with HTTP 304 Not Modified; when network disconnects, offline actions queue and flush upon reconnect"
    ],
    "verification_gate": "304 Not Modified & zero lost actions on reconnect across all 4 client SDKs",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-14",
    "title": "Cloud OTA Asset Hosting (Addressables & Unreal Chunks)",
    "category": "sdk",
    "status": "todo",
    "priority": "high",
    "user_story": "As a live mobile/PC game developer, I want Daksh to host and serve Unity Addressables (.bundle) and Unreal Chunks (.pak) via global Edge CDN, so that our studio can push new skins, maps, and audio without releasing new app store updates.",
    "deliverables": [
      "Cloud OTA Asset Storage pipeline with global Edge CDN caching",
      "Studio UI /dashboard/[id]/ota for uploading, versioning, and promoting asset bundles",
      "Multi-platform asset channels (iOS, Android, Windows) with 1-click instant rollback",
      "HTTP Byte-Range Resume support for large interrupted asset bundle downloads"
    ],
    "technical_tasks": [
      "Develop Cloud OTA Asset storage pipeline with global Edge CDN caching",
      "Build Studio UI /dashboard/[id]/ota for uploading, versioning, and promoting asset bundles (.bundle / .pak)",
      "Implement multi-channel release pipeline (Development, Staging, Production) with 1-click instant rollback",
      "Implement HTTP Byte-Range Resume support for large interrupted asset downloads"
    ],
    "test_cases": [
      "TEST-14-A [Happy Path]: Uploading asset bundle generates SHA-256 checksum and CDN distribution URL",
      "TEST-14-B [Byte-Range Resume]: Client requesting Range: bytes=1024-2047 receives HTTP 206 Partial Content with correct byte slice",
      "TEST-14-C [Instant Rollback]: Rolling back release channel from v2 to v1 immediately routes CDN traffic to v1 bundle hash",
      "TEST-14-D [Integrity Check]: Client verifies downloaded asset hash against x-amz-meta-sha256 before mounting into game memory"
    ],
    "security_compliance": [
      "Cryptographic Asset Integrity: SHA-256 checksum headers verified by client before memory mounting",
      "Signed CDN download URLs with configurable expiration preventing unauthorized hotlinking"
    ],
    "acceptance_criteria": [
      "Given a newly built character skin bundle via Unity Addressables or Unreal Chunk Packaging",
      "When the studio uploads the build to Daksh OTA and promotes it to Global Live",
      "Then game clients detect new asset hash on next launch, download delta bundle via CDN, and mount seamlessly"
    ],
    "verification_gate": "Delta bundle downloads via CDN with byte-range resume and mounts without app update",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-15",
    "title": "Daksh Fully Managed Cloud Game-as-a-Service (GaaS) Platform",
    "category": "cloud",
    "status": "todo",
    "priority": "critical",
    "user_story": "As a game studio founder or producer, I want Daksh to provide a 100% fully managed Cloud Game-as-a-Service (GaaS) platform operated entirely from Daksh's side with multi-region global deployment, automated server orchestration, and 99.99% uptime, so that my team can launch multiplayer games instantly across the globe without setting up servers, managing Kubernetes clusters, or hiring DevOps engineers.",
    "deliverables": [
      "1-Click Global Cloud Deployment pipeline (daksh cloud deploy) provisioning instances across 5 Super-Regions: Virginia (iad), Frankfurt (fra), Mumbai (bom), Tokyo (nrt), and São Paulo (gru)",
      "Global Anycast Dynamic Routing directing incoming players to the nearest active game server cluster with sub-45ms ping",
      "Managed Agones Dedicated Game Server (DGS) fleet auto-scaling headless Unreal and Unity server containers with warm buffer pools and fast allocation (<200ms)",
      "Enterprise Multi-AZ Managed Storage: PostgreSQL 16 with automated failover and PITR WAL archiving + distributed Redis 7 cluster",
      "Unified Cloud Operations Portal & SLA Dashboard monitoring CPU, RAM, active CCU, tick rates, and 99.99% multi-region uptime"
    ],
    "technical_tasks": [
      "Develop 1-click cloud deployment pipeline (daksh cloud deploy) provisioning across 5 Super-Regions (iad, fra, bom, nrt, gru)",
      "Implement Global Anycast dynamic routing directing incoming players to nearest active cluster (<45ms ping)",
      "Build managed Agones Dedicated Game Server (DGS) fleet auto-scaler for Unreal/Unity headless server containers with <200ms allocation",
      "Configure enterprise Multi-AZ PostgreSQL 16 with automated failover and PITR WAL archiving + distributed Redis 7",
      "Build Unified Cloud Operations Portal & SLA Dashboard monitoring CPU, RAM, active CCU, tick rates, and 99.99% uptime"
    ],
    "test_cases": [
      "TEST-15-A [Provisioning Gate]: 1-click cloud deployment provisions backend cluster across 5 regions in <60 seconds",
      "TEST-15-B [Latency Routing]: Synthetic requests from Mumbai resolve to bom PoP; requests from Frankfurt resolve to fra PoP with <45ms latency",
      "TEST-15-C [Agones Allocation]: Matchmaker requests DGS allocation and receives warm game server container IP/port in <200ms",
      "TEST-15-D [Failover Resilience]: Simulated primary database crash initiates automated replica failover with zero data loss"
    ],
    "security_compliance": [
      "Multi-Tenant Cloud Isolation: ISO 27001 & SOC 2 Type II compliant network policies and dedicated database schemas",
      "Automated Edge DDoS Mitigation: Layer 4 SYN/UDP flood scrubbing and Layer 7 rate-limiting at Edge PoPs",
      "Zero-Trust TLS: Automated Let's Encrypt / Cloudflare Edge certificates with HTTP/2 and HTTP/3 support"
    ],
    "acceptance_criteria": [
      "Given a studio creates a new game title in Daksh Dashboard",
      "When the developer selects 'Deploy to Daksh Cloud' across global regions",
      "Then Daksh automatically provisions the backend cluster, database, Redis cache, and Agones game server fleet within 60 seconds with sub-45ms latency and 99.99% uptime"
    ],
    "verification_gate": "1-click cloud deploy provisions 5 regions in <60s; Anycast routes <45ms; Agones allocates <200ms",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-16",
    "title": "Helm-Only Infrastructure & The Famous 1-Click Eject Button",
    "category": "cloud",
    "status": "todo",
    "priority": "critical",
    "user_story": "As a studio CTO, I want the entire backend defined as a clean Helm v3 chart where every setting is in values.yaml, and a 1-click Eject button, so that our studio can self-host on our own Kubernetes cluster at any time with zero vendor lock-in.",
    "deliverables": [
      "Production Helm v3 Chart in deploy/helm/daksh containing Chart.yaml, values.yaml, and modular templates",
      "Eject Export Pipeline /api/titles/[id]/eject bundling the Helm chart and isolated PostgreSQL database dump into a standalone .zip",
      "Studio UI 1-click Eject Title modal with instant download"
    ],
    "technical_tasks": [
      "Author production Helm v3 Chart in deploy/helm/daksh containing Chart.yaml, values.yaml, and modular templates",
      "Implement Eject Export Pipeline /api/titles/[id]/eject generating standalone .zip containing Helm chart and PostgreSQL data dump",
      "Build Studio UI 1-click Eject Title modal with real-time packaging progress and instant download",
      "Ensure Kubernetes security compliance: non-root containers, read-only root filesystems, and dropped capabilities"
    ],
    "test_cases": [
      "TEST-16-A [Helm Lint & Dry-Run]: helm lint deploy/helm/daksh and helm template render without errors or schema violations",
      "TEST-16-B [Eject Package Integrity]: Calling /api/titles/[id]/eject generates a valid .zip containing complete SQL dump and Helm chart",
      "TEST-16-C [Self-Host Boot Test]: Extracted export archive boots on a clean Kubernetes cluster with 100% data fidelity",
      "TEST-16-D [Security Policy]: Rendered manifests enforce runAsNonRoot: true and readOnlyRootFilesystem: true"
    ],
    "security_compliance": [
      "Data Sovereignty: Studio receives 100% of their raw SQL data and server configuration; zero locked formats",
      "Kubernetes Security: Helm manifests run as non-root containers with read-only root filesystems and dropped capabilities"
    ],
    "acceptance_criteria": [
      "Given a studio CTO clicks 'Eject Title'",
      "When the export completes",
      "Then a .zip archive downloads containing the Helm chart and database dump; executing helm install on a clean cluster boots the backend with 100% fidelity"
    ],
    "verification_gate": "Helm dry-run lint passes; unzipped export archive boots cleanly",
    "assigned_agent": "Any AI / Squad"
  },
  {
    "id": "STORY-17",
    "title": "Air-Gapped Verification & 5,000 CCU Load Stress Test",
    "category": "core",
    "status": "todo",
    "priority": "critical",
    "user_story": "As the executive directorate, I want the platform to pass an air-gapped test with Wi-Fi killed, followed by a simulated 5,000 CCU load stress test, so that we have mathematical proof of performance and reliability before public release.",
    "deliverables": [
      "Air-Gapped Test Runner script shutting down network interfaces and executing CLI boot, auth, and purchases locally",
      "Load Stress Test Script (k6 / autocannon) simulating 5,000 concurrent virtual players executing auth, catalog, and netcode packets",
      "Production Release Tag with 22/22 Next.js routes green and Git release tag v1.0.0"
    ],
    "technical_tasks": [
      "Author Air-Gapped Test Runner script disabling external network interfaces and executing CLI boot, auth, and purchases",
      "Build load stress testing script (k6 / autocannon) simulating 5,000 concurrent virtual players executing auth, catalog, and netcode packets",
      "Verify production compilation across all 22/22 Next.js Studio routes and Nakama runtime TypeScript bundles",
      "Execute OWASP Top 10 security audit validating against SQL injection, XSS, and broken access control"
    ],
    "test_cases": [
      "TEST-17-A [Air-Gap Loop]: CLI boots, authenticates device, and performs wallet purchases with 0 internet connection",
      "TEST-17-B [5,000 CCU Load Gate]: Server sustains 5,000 simulated concurrent users maintaining p99 latency <50ms and 0% HTTP 5xx errors",
      "TEST-17-C [Route Compilation]: npm run build succeeds with 22/22 routes statically optimized and 0 TypeScript errors",
      "TEST-17-D [OWASP Security Gate]: Automated penetration scan reports 0 High or Critical vulnerabilities"
    ],
    "security_compliance": [
      "OWASP Top 10 Hardening: Validated against SQL injection, XSS, broken auth, and security misconfigurations",
      "Performance SLA: 99th-percentile API response times under 50ms during peak 5,000 CCU simulation"
    ],
    "acceptance_criteria": [
      "Given machine internet connection is completely disabled",
      "When the air-gapped test executes, 100% of the game developer loop functions locally with zero network calls",
      "When the 5,000 CCU load test runs, server maintains sub-50ms p99 latency with zero 5xx errors"
    ],
    "verification_gate": "22/22 routes build green; 5,000 CCU maintains p99 <50ms with 0 errors",
    "assigned_agent": "Any AI / Squad"
  }
];

const filePath1 = path.join(__dirname, '..', 'tasks', 'daksh_master_stories.json');
const filePath2 = path.join(__dirname, '..', 'saas-dashboard', 'data', 'daksh_master_stories.json');

fs.writeFileSync(filePath1, JSON.stringify(storiesData, null, 2) + '\n');
fs.writeFileSync(filePath2, JSON.stringify(storiesData, null, 2) + '\n');

console.log(`✅ Successfully enriched 17 stories in ${filePath1} and ${filePath2}`);
