import { NextRequest, NextResponse } from "next/server";
import { MatchmakingXRayService } from "@/lib/multiplayer/xray";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const telemetry = MatchmakingXRayService.getLatestTelemetry(titleId);
    return NextResponse.json({ success: true, telemetry });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch telemetry" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const body = await req.json();

    const updated = MatchmakingXRayService.publishTelemetry(titleId, body);
    return NextResponse.json({ success: true, telemetry: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to publish telemetry" },
      { status: 500 }
    );
  }
}
