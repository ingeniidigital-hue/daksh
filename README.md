# Daksh - Generic Game Backend-as-a-Service (BaaS)

Daksh is a platform designed to provide all the backend primitives (like PlayFab) on top of an open-source Nakama foundation. It separates game-specific logic from generic backend services, enabling game developers to build scalable, feature-rich games entirely from a web dashboard.

## Core Architecture

Daksh operates on a strict **BaaS Philosophy**: The backend should never contain game-specific logic (e.g., "8-Ball Cues", "Match-3 Lives"). Instead, it provides generic APIs, and all game-specific structures are defined in JSON configurations using the dashboard.

### 1. Title Data (Remote Config)
- **Role:** The single source of truth for global game configuration.
- **Usage:** Game designers upload JSON to define game-specific structures.
- **Example (Leagues):** Instead of writing Go/TypeScript backend logic for "Bronze", "Silver", and "Gold" leagues, designers simply upload a JSON file `League_Configuration` containing the brackets and rewards. The client (or a generic CloudScript) reads this data and applies it to the generic leaderboards.

### 2. LiveOps Rules Engine
- **Role:** An event-driven automation engine.
- **Usage:** When an event occurs (e.g., `player_login`, `purchase_complete`), the game client dispatches a generic event to Nakama.
- **Execution:** A generic Nakama RPC (`evaluate_event`) fetches active LiveOps rules from Nakama Storage, evaluates the conditions, and executes server-authoritative actions (like `nk.walletUpdate()` to grant items/currency or execute custom CloudScripts).

### 3. Economy & Catalog
- **Role:** Centralized virtual economy and storefronts.
- **Usage:** All virtual currencies, items, bundles, and lootboxes are defined in the Dashboard and stored in generic Nakama storage collections. The Dashboard strictly enforces relationships, ensuring you can only grant items/currencies that actually exist in the Catalog.

### 4. CloudScript (In-Browser IDE)
- **Role:** Custom server-authoritative logic.
- **Usage:** For the rare cases where generic configurations are not enough, developers can write raw TypeScript/JavaScript directly in the Daksh Dashboard. This code is deployed instantly and runs securely on the Nakama server.

### 5. Leaderboards & Analytics
- **Role:** Competitive progression and KPIs.
- **Usage:** Daksh provides out-of-the-box UI to spin up new generic Nakama Leaderboards. Analytics are tracked in real-time, pulling DAU, revenue, and retention metrics.

## Project Structure
- \`/saas-dashboard\`: The Next.js frontend Dashboard.
- \`/backend\`: The clean, generic Nakama TypeScript runtime project.
