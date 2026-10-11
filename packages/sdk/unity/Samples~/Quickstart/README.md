# Daksh Unity SDK Quickstart Sample

This sample demonstrates how to integrate and use the Daksh Game BaaS SDK inside a Unity scene.

## Running the Sample
1. Attach `DakshQuickstartDemo.cs` to an empty GameObject in any Unity scene.
2. In the Inspector, specify:
   - **Title ID**: Your game's title ID (default: `demo_title`)
   - **Server URL**: The URL of your Daksh BaaS server (default: `http://localhost:3000`)
3. Hit **Play** in the Unity Editor.
4. Watch the Unity Console log each step executing:
   - Hardware Device Authentication
   - Catalog fetch with ETag caching
   - ETag conditional 304 diffing verification (0 duplicate payload bytes)
   - Idempotent item purchasing with idempotency key deduplication
   - Redis leaderboard score submission with tiebreakers
   - Offline action queue persistence and replay
   - Matchmaking queue ticket creation and polling
