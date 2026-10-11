import { NextRequest, NextResponse } from "next/server";
import { MatchmakingService } from "@/lib/multiplayer/matchmaking";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const rulesetId = body.rulesetId || "ruleset_1v1_ranked";

    const result = await MatchmakingService.runMatchmakingCycle(
      titleId,
      rulesetId,
      body.currentTime || Date.now()
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute matchmaking cycle" },
      { status: 500 }
    );
  }
}
