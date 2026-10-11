import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import util from "util";
import crypto from "crypto";

const execAsync = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const { titleId, secretKey } = await req.json();

    if (!titleId || !secretKey) {
      return NextResponse.json({ error: "Missing titleId or secretKey" }, { status: 400 });
    }

    // Paths to templates
    const templatesDir = path.resolve(process.cwd(), "../daksh-orchestrator/templates");
    const tmpDir = path.resolve(process.cwd(), "../daksh-orchestrator/tmp");
    
    await fs.mkdir(tmpDir, { recursive: true });

    // Read templates
    let postgresYaml = await fs.readFile(path.join(templatesDir, "postgres.yaml"), "utf-8");
    let nakamaYaml = await fs.readFile(path.join(templatesDir, "nakama.yaml"), "utf-8");

    // Replace placeholders - k8s names must be lowercase
    const safeTitleId = titleId.toLowerCase();
    postgresYaml = postgresYaml.replace(/{{TITLE_ID}}/g, safeTitleId);
    nakamaYaml = nakamaYaml.replace(/{{TITLE_ID}}/g, safeTitleId);

    const runId = crypto.randomBytes(4).toString("hex");
    const pgTmpFile = path.join(tmpDir, `pg-${safeTitleId}-${runId}.yaml`);
    const nkTmpFile = path.join(tmpDir, `nk-${safeTitleId}-${runId}.yaml`);

    await fs.writeFile(pgTmpFile, postgresYaml);
    await fs.writeFile(nkTmpFile, nakamaYaml);

    // Apply Postgres first
    const { stdout: pgOut } = await execAsync(`kubectl apply -f ${pgTmpFile}`);
    // Apply Nakama
    const { stdout: nkOut } = await execAsync(`kubectl apply -f ${nkTmpFile}`);

    // Cleanup temp files
    await fs.unlink(pgTmpFile).catch(() => {});
    await fs.unlink(nkTmpFile).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Provisioned successfully",
      logs: {
        postgres: pgOut,
        nakama: nkOut
      }
    });
  } catch (error: any) {
    console.error("Provisioning Error:", error);
    return NextResponse.json({ error: "Provisioning failed", details: error.message }, { status: 500 });
  }
}
