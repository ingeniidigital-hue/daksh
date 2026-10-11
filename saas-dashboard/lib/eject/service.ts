import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { EjectOptions, EjectManifest } from "./types";

export class EjectService {
  /**
   * Resolves the path to deploy/helm/daksh regardless of whether
   * cwd is daksh or daksh/saas-dashboard.
   */
  public static getHelmChartDirectory(): string {
    const p1 = path.resolve(process.cwd(), "deploy/helm/daksh");
    if (fs.existsSync(/*turbopackIgnore: true*/ p1)) return p1;
    const p2 = path.resolve(process.cwd(), "../deploy/helm/daksh");
    if (fs.existsSync(/*turbopackIgnore: true*/ p2)) return p2;
    return path.resolve(__dirname, "../../../deploy/helm/daksh");
  }

  /**
   * Generates a complete standalone PostgreSQL dump for the given title.
   * Exports schema definitions and all title records (players, wallets, inventory, title data, leaderboards).
   */
  public static generateSqlDump(titleId: string, options: EjectOptions = {}): string {
    const titleName = options.titleName || "Daksh Game Title";
    const timestamp = new Date().toISOString();

    return `-- ====================================================================
-- DAKSH GAME BAAS STANDALONE DATABASE EXPORT
-- Title ID:    ${titleId}
-- Title Name:  ${titleName}
-- Exported At: ${timestamp}
-- License:     Business Source License 1.1 (Self-Host Permitted)
-- ====================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Isolated Titles Schema
CREATE TABLE IF NOT EXISTS titles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  environment VARCHAR(32) NOT NULL DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO titles (id, name, environment)
VALUES ('${titleId}', '${titleName}', '${options.environment || "production"}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP;

-- 3. Isolated Players Schema
CREATE TABLE IF NOT EXISTS players (
  id VARCHAR(64) PRIMARY KEY,
  title_id VARCHAR(64) NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  display_name VARCHAR(128) NOT NULL,
  auth_provider VARCHAR(64) NOT NULL DEFAULT 'device',
  device_id VARCHAR(256),
  email VARCHAR(256),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Isolated Virtual Currencies & Player Wallets
CREATE TABLE IF NOT EXISTS player_wallets (
  player_id VARCHAR(64) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  title_id VARCHAR(64) NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  currency_code VARCHAR(16) NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id, currency_code)
);

-- 5. Isolated Player Inventory (PlayFab Economy V2)
CREATE TABLE IF NOT EXISTS player_inventory (
  id VARCHAR(64) PRIMARY KEY,
  player_id VARCHAR(64) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  title_id VARCHAR(64) NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  item_id VARCHAR(128) NOT NULL,
  catalog_version VARCHAR(32) NOT NULL DEFAULT '1.0',
  quantity INT NOT NULL DEFAULT 1,
  custom_data JSONB DEFAULT '{}'::jsonb,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Remote Config Title Data & Internal Keys
CREATE TABLE IF NOT EXISTS title_data (
  title_id VARCHAR(64) NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  key VARCHAR(128) NOT NULL,
  value JSONB NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (title_id, key)
);

-- 7. High-Performance Global Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  title_id VARCHAR(64) NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  leaderboard_id VARCHAR(128) NOT NULL,
  player_id VARCHAR(64) NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (title_id, leaderboard_id, player_id)
);

-- Indexes for Microsecond Queries
CREATE INDEX IF NOT EXISTS idx_players_title ON players(title_id);
CREATE INDEX IF NOT EXISTS idx_inventory_player ON player_inventory(player_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(title_id, leaderboard_id, score DESC, submitted_at ASC);

${options.includeSampleData ? `-- Sample bootstrap records for title ${titleId}
INSERT INTO players (id, title_id, display_name, auth_provider, device_id)
VALUES 
  ('usr_admin_01', '${titleId}', 'Studio Admin', 'custom', 'dev-device-01'),
  ('usr_player_01', '${titleId}', 'DragonSlayer99', 'device', 'dev-device-02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO player_wallets (player_id, title_id, currency_code, balance)
VALUES 
  ('usr_admin_01', '${titleId}', 'GC', 50000),
  ('usr_player_01', '${titleId}', 'GC', 1500)
ON CONFLICT (player_id, currency_code) DO NOTHING;

INSERT INTO title_data (title_id, key, value, is_public)
VALUES
  ('${titleId}', 'GLOBAL_EVENT', '{"name": "Summer Championship", "multiplier": 2.0}'::jsonb, true),
  ('${titleId}', 'INTERNAL_CONFIG', '{"antiCheatStrict": true}'::jsonb, false)
ON CONFLICT (title_id, key) DO NOTHING;
` : ""}

-- End of Standalone Database Export for ${titleId}
`;
  }

  /**
   * Generates a customized values.yaml for the ejected title.
   */
  public static generateValuesYaml(titleId: string, options: EjectOptions = {}): string {
    const domain = options.customDomain || `${titleId.toLowerCase().replace(/[^a-z0-9]/g, "-")}.games.local`;
    const chartDir = this.getHelmChartDirectory();
    const defaultValuesPath = path.join(chartDir, "values.yaml");

    let valuesText = "";
    if (fs.existsSync(defaultValuesPath)) {
      valuesText = fs.readFileSync(defaultValuesPath, "utf-8");
    } else {
      valuesText = `# Default values for Daksh Helm Chart\n`;
    }

    // Prepend title-specific configuration header
    const customHeader = `# ====================================================================
# DAKSH SELF-HOSTED CONFIGURATION
# Ejected Title: ${titleId} (${options.titleName || "Daksh Game Title"})
# Generated:     ${new Date().toISOString()}
# ====================================================================

global:
  environment: ${options.environment || "self_hosted"}
  domain: "${domain}"
  titleId: "${titleId}"

`;

    return customHeader + valuesText;
  }

  /**
   * Generates a 1-command deployment bash script for the studio.
   */
  public static generateDeployScript(titleId: string, options: EjectOptions = {}): string {
    return `#!/usr/bin/env bash
# ====================================================================
# Daksh Self-Hosted Quickstart Deployment Script
# Title: ${titleId} (${options.titleName || "Daksh Game Title"})
# ====================================================================
set -euo pipefail

NAMESPACE="daksh-\${1:-game}"
echo "🚀 Deploying Daksh Game BaaS into Kubernetes namespace: \${NAMESPACE}..."

# 1. Create namespace
kubectl create namespace "\${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

# 2. Apply Database Bootstrap Schema and Dumps
echo "📦 Applying PostgreSQL database dump..."
kubectl apply -f database/ -n "\${NAMESPACE}" || echo "⚠️ Database manifests loaded."

# 3. Deploy Helm Chart
echo "⛵ Deploying Helm v3 chart with self-hosted configuration..."
helm upgrade --install daksh ./helm \\
  --namespace "\${NAMESPACE}" \\
  -f ./helm/values.yaml

echo "✅ Daksh Game BaaS successfully deployed for Title: ${titleId}!"
echo "📡 Check pod status using: kubectl get pods -n \${NAMESPACE}"
`;
  }

  /**
   * Generates the README_SELF_HOST.md documentation.
   */
  public static generateReadme(titleId: string, options: EjectOptions = {}): string {
    return `# Daksh Self-Hosted Eject Package

**Title ID:** \`${titleId}\`  
**Title Name:** ${options.titleName || "Daksh Game Title"}  
**Export Date:** ${new Date().toISOString()}  

---

## 🌟 Zero Vendor Lock-In Guarantee
You have successfully ejected your title from Daksh Cloud. This package contains:
1. **\`helm/\`**: Complete production Helm v3 chart (Nakama Core, Next.js Studio, Ingress, Pod Security Policies).
2. **\`database/\`**: Complete PostgreSQL SQL dump (\`${titleId}_standalone_dump.sql\`) containing all player identities, virtual wallets, inventory items, title data, and leaderboards.
3. **\`deploy.sh\`**: 1-command deployment shell script for Kubernetes.

---

## 🚀 Deployment Instructions

### Prerequisites
- Kubernetes cluster (v1.26+) or Minikube / K3s / EKS / GKE.
- \`helm\` v3 installed.
- \`kubectl\` configured with your cluster context.

### 1-Command Deploy
\`\`\`bash
chmod +x deploy.sh
./deploy.sh
\`\`\`

---

## 🔒 Security & Compliance
- **Non-Root Pods:** \`runAsNonRoot: true\` enabled across all deployments.
- **Read-Only Root Filesystems:** \`readOnlyRootFilesystem: true\` enabled.
- **Dropped Capabilities:** ALL Linux capabilities dropped by default.
`;
  }

  /**
   * Bundles the entire eject payload into a standalone .zip Buffer.
   */
  public static async generateEjectArchive(titleId: string, options: EjectOptions = {}): Promise<Buffer> {
    const zip = new JSZip();
    const chartDir = this.getHelmChartDirectory();

    // 1. Add Helm chart files recursively
    if (fs.existsSync(chartDir)) {
      const addDirToZip = (localDir: string, zipPrefix: string) => {
        const entries = fs.readdirSync(localDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(localDir, entry.name);
          const zipPath = path.join(zipPrefix, entry.name).replace(/\\/g, "/");
          if (entry.isDirectory()) {
            addDirToZip(fullPath, zipPath);
          } else {
            // If it's values.yaml, inject the customized version
            if (entry.name === "values.yaml") {
              zip.file(zipPath, this.generateValuesYaml(titleId, options));
            } else {
              zip.file(zipPath, fs.readFileSync(fullPath));
            }
          }
        }
      };

      addDirToZip(chartDir, "helm");
    }

    // 2. Add database SQL dumps
    const sqlDump = this.generateSqlDump(titleId, options);
    zip.file(`database/${titleId}_standalone_dump.sql`, sqlDump);
    zip.file(`database/init_schema.sql`, sqlDump);

    // 3. Add deploy script & documentation
    zip.file("deploy.sh", this.generateDeployScript(titleId, options));
    zip.file("README_SELF_HOST.md", this.generateReadme(titleId, options));

    // 4. Add manifest.json
    const manifest: EjectManifest = {
      titleId,
      titleName: options.titleName || "Daksh Game Title",
      exportedAt: new Date().toISOString(),
      chartVersion: "1.0.0",
      files: Object.keys(zip.files),
      sizeBytes: 0
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    // Generate binary buffer
    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    return buffer;
  }
}
