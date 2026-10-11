import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import util from "util";

const execAsync = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const { titleId, templateId, config } = await req.json();

    if (!titleId || !templateId) {
      return NextResponse.json({ error: "Missing titleId or templateId" }, { status: 400 });
    }

    const safeTitleId = titleId.toLowerCase();
    
    // Only economy-v1 is supported for the MVP demo
    if (templateId !== "economy-v1") {
      return NextResponse.json({ error: "Template not found or not supported yet" }, { status: 404 });
    }

    // Read the compiled JS bundle
    const templatePath = path.resolve(process.cwd(), "../daksh-templates/economy-v1/build/main.js");
    let jsCode = "";
    try {
      jsCode = await fs.readFile(templatePath, "utf-8");
      
      // Dynamically apply User's System Design Configuration
      if (config) {
        if (config.softCurrencyCode) {
           // Basic string replacement for demo purposes
           // In production, we'd use Babel or AST parsing, or inject a configuration file.
           jsCode = jsCode.replace(/"gold"/g, `"${config.softCurrencyCode}"`);
        }
        if (config.hardCurrencyCode) {
           jsCode = jsCode.replace(/"gems"/g, `"${config.hardCurrencyCode}"`);
        }
      }

    } catch (e) {
      return NextResponse.json({ error: "Failed to read template code" }, { status: 500 });
    }

    // 1. Create a ConfigMap with the JS code
    const cmName = `nakama-modules-${safeTitleId}`;
    
    // Delete existing configmap if it exists (ignore error)
    await execAsync(`kubectl delete configmap ${cmName}`).catch(() => {});
    
    // Create new configmap from literal
    // We write to a tmp file first to avoid command line length limits
    const tmpDir = path.resolve(process.cwd(), "../daksh-orchestrator/tmp");
    await fs.mkdir(tmpDir, { recursive: true });
    
    const tmpJsFile = path.join(tmpDir, `main-${safeTitleId}.js`);
    await fs.writeFile(tmpJsFile, jsCode);
    
    await execAsync(`kubectl create configmap ${cmName} --from-file=main.js=${tmpJsFile}`);
    
    // Cleanup tmp file
    await fs.unlink(tmpJsFile).catch(() => {});

    // 2. Patch the Nakama Deployment to mount this ConfigMap
    const patchYaml = `
spec:
  template:
    spec:
      containers:
      - name: nakama
        volumeMounts:
        - name: modules
          mountPath: /nakama/data/modules
      volumes:
      - name: modules
        configMap:
          name: ${cmName}
`;
    
    // Write patch to file
    const patchFile = path.join(tmpDir, `patch-${safeTitleId}.yaml`);
    await fs.writeFile(patchFile, patchYaml);
    
    // Apply patch
    await execAsync(`kubectl patch deployment nakama-${safeTitleId} --patch-file ${patchFile}`);
    
    // Cleanup patch file
    await fs.unlink(patchFile).catch(() => {});

    // 3. Rollout restart to load new modules
    await execAsync(`kubectl rollout restart deployment/nakama-${safeTitleId}`);

    return NextResponse.json({
      success: true,
      message: "Template installed successfully. Nakama is restarting to load modules."
    });
  } catch (error: any) {
    console.error("Install Error:", error);
    return NextResponse.json({ error: "Installation failed", details: error.message }, { status: 500 });
  }
}
