import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import { resetWalletsStorage } from "@/lib/economy/wallet";
import { resetCatalogStorage } from "@/lib/economy/catalog";
import { resetTitleDataStorage } from "@/lib/title-data/store";
import { resetServiceStorage } from "@/lib/economy/service";

const execAsync = util.promisify(exec);

export async function POST() {
  try {
    // 1. Reset in-memory economy, title data, wallets, and inventories
    resetWalletsStorage();
    resetCatalogStorage();
    resetTitleDataStorage();
    resetServiceStorage();

    // 2. Clean up any dynamically provisioned Kubernetes deployments in default namespace
    let k8sCleanupOutput = "";
    try {
      const { stdout } = await execAsync(
        "kubectl delete deployment,service -l title -n default --ignore-not-found"
      );
      k8sCleanupOutput = stdout || "No dynamic title resources found";
    } catch (e: any) {
      k8sCleanupOutput = e.message;
    }

    return NextResponse.json({
      success: true,
      message: "All data and temporary Kubernetes deployments wiped cleanly.",
      k8sCleanup: k8sCleanupOutput
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
