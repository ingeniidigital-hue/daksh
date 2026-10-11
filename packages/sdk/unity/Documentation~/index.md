# Daksh Game BaaS Unity SDK Documentation

Welcome to the official developer documentation for the **Daksh Game BaaS Unity SDK (`com.daksh.sdk`)**.

## Table of Contents

1. [Architecture & Subsystems Overview](../README.md#modular-architecture--assembly-definitions)
2. [Data Versioning, Caching & Sync Architecture](DataVersioningAndSync.md)
   - Two-Tiered Data Taxonomy (Static vs Dynamic)
   - HTTP 304 ETag Conditional Diffing & Zero-Byte Bandwidth Optimization
   - Persistent FIFO Offline Action Queue & Replay
   - Idempotency Keys (`X-Idempotency-Key`)
   - Optimistic Concurrency Control (OCC)
   - Conflict Resolution Strategies (Server-Authoritative, Last-Write-Wins, Delta Accumulators)
3. [Quickstart Guide](../README.md#usage-examples)
4. [Changelog](../CHANGELOG.md)
5. [License](../LICENSE.md)
