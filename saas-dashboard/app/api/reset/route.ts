import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import { resetEconomyStorage } from "@/lib/economy";
import { resetTitleDataStorage } from "@/lib/title-data/store";
import { resetTelemetryStorage } from "@/lib/telemetry/service";
import { resetOtaStorage } from "@/lib/ota/service";
import { resetActionReportStore } from "@/lib/actions/service";
import { resetLeaderboardStorage } from "@/lib/leaderboards/service";
import { resetTurnBasedStorage } from "@/lib/multiplayer/turn-based/store";
import { resetXRayStorage } from "@/lib/multiplayer/xray/service";
import { resetRelayStorage } from "@/lib/multiplayer/relay/service";
import { resetMatchmakingStorage } from "@/lib/multiplayer/matchmaking/service";
import { resetCloudStorage } from "@/lib/cloud/service";
import { resetAnalyticsStorage } from "@/lib/analytics/service";

const execAsync = util.promisify(exec);

export async function POST() {
  try {
    // 1. Reset all in-memory subsystems
    resetEconomyStorage();
    resetTitleDataStorage();
    resetTelemetryStorage();
    resetOtaStorage();
    resetActionReportStore();
    resetLeaderboardStorage();
    resetTurnBasedStorage();
    resetXRayStorage();
    resetRelayStorage();
    resetMatchmakingStorage();
    resetCloudStorage();
    resetAnalyticsStorage();

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
