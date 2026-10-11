import { NextRequest, NextResponse } from "next/server";
import { LeaderboardService } from "@/lib/leaderboards";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const alerts = await LeaderboardService.getSecurityAlerts(titleId);
    return NextResponse.json({ success: true, alerts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch security alerts" },
      { status: 500 }
    );
  }
}
