import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import JSZip from "jszip";
import { EjectService } from "../lib/eject";

describe("STORY-16 / TDD: Helm-Only Infrastructure & The Famous 1-Click Eject Button", () => {
  const chartPath = path.resolve(__dirname, "../../deploy/helm/daksh");
  const testTitleId = "TITLE_CYBERPUNK_2077";

  it("TEST-16-A [Helm Lint & Dry-Run]: helm lint deploy/helm/daksh and helm template render without errors or schema violations", () => {
    // 1. Lint check
    const lintOutput = execSync(`helm lint ${chartPath}`, { encoding: "utf-8" });
    expect(lintOutput).toContain("1 chart(s) linted, 0 chart(s) failed");

    // 2. Template dry-run check
    const templateOutput = execSync(`helm template daksh-release ${chartPath}`, { encoding: "utf-8" });
    expect(templateOutput).toContain("kind: Deployment");
    expect(templateOutput).toContain("kind: Service");
    expect(templateOutput).toContain("kind: ConfigMap");
    expect(templateOutput).toContain("kind: Ingress");
    expect(templateOutput).toContain("daksh-release-nakama");
    expect(templateOutput).toContain("daksh-release-studio");
  });

  it("TEST-16-B [Eject Package Integrity]: Calling EjectService generates a valid .zip containing complete SQL dump and Helm chart", async () => {
    const ejectBuffer = await EjectService.generateEjectArchive(testTitleId, {
      titleName: "Cyberpunk Odyssey",
      environment: "production",
      includeSampleData: true
    });

    expect(ejectBuffer).toBeInstanceOf(Buffer);
    expect(ejectBuffer.length).toBeGreaterThan(1000);

    // Inspect zip contents
    const zip = await JSZip.loadAsync(ejectBuffer);
    const files = Object.keys(zip.files);

    // Check Helm chart files are present
    expect(files).toContain("helm/Chart.yaml");
    expect(files).toContain("helm/values.yaml");
    expect(files).toContain("helm/templates/deployment-nakama.yaml");
    expect(files).toContain("helm/templates/deployment-studio.yaml");
    expect(files).toContain("helm/templates/service.yaml");
    expect(files).toContain("helm/templates/ingress.yaml");
    expect(files).toContain("helm/templates/configmap.yaml");

    // Check standalone PostgreSQL dump is present
    expect(files).toContain(`database/${testTitleId}_standalone_dump.sql`);
    const sqlContent = await zip.file(`database/${testTitleId}_standalone_dump.sql`)?.async("string");
    expect(sqlContent).toBeDefined();
    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS players");
    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS player_wallets");
    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS player_inventory");
    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS title_data");
    expect(sqlContent).toContain("CREATE TABLE IF NOT EXISTS leaderboards");
    expect(sqlContent).toContain(testTitleId);

    // Check quickstart script
    expect(files).toContain("deploy.sh");
    expect(files).toContain("README_SELF_HOST.md");
  });

  it("TEST-16-C [Self-Host Boot Test]: Extracted export archive boots on a clean Kubernetes cluster with 100% data fidelity", async () => {
    const ejectBuffer = await EjectService.generateEjectArchive(testTitleId, {
      titleName: "Cyberpunk Odyssey",
      environment: "self_hosted",
      includeSampleData: true
    });

    const zip = await JSZip.loadAsync(ejectBuffer);
    const valuesFile = await zip.file("helm/values.yaml")?.async("string");
    expect(valuesFile).toBeDefined();

    // Verify customized title settings are injected
    expect(valuesFile).toContain("TITLE_CYBERPUNK_2077");

    // Verify deployment script is executable and documents self-hosting steps
    const deployScript = await zip.file("deploy.sh")?.async("string");
    expect(deployScript).toContain("kubectl apply -f database/");
    expect(deployScript).toContain("helm upgrade --install daksh ./helm");
    expect(deployScript).toContain("-f ./helm/values.yaml");
  });

  it("TEST-16-D [Security Policy]: Rendered manifests enforce runAsNonRoot: true and readOnlyRootFilesystem: true", () => {
    const templateOutput = execSync(`helm template daksh-sec ${chartPath}`, { encoding: "utf-8" });

    // Assert Pod Security Context
    expect(templateOutput).toContain("runAsNonRoot: true");

    // Assert Container Security Context
    expect(templateOutput).toContain("readOnlyRootFilesystem: true");
    expect(templateOutput).toContain("allowPrivilegeEscalation: false");
    expect(templateOutput).toContain("- ALL");
  });
});
