import { NextRequest, NextResponse } from "next/server";
import { LeaderboardService } from "@/lib/leaderboards";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const leaderboards = await LeaderboardService.listLeaderboards(titleId);
    return NextResponse.json({ success: true, leaderboards });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to list leaderboards" },
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

    if (!body.leaderboardId || !body.name) {
      return NextResponse.json(
        { error: "leaderboardId and name are required" },
        { status: 400 }
      );
    }

    const created = await LeaderboardService.createLeaderboard({
      titleId,
      leaderboardId: body.leaderboardId,
      name: body.name,
      resetFrequency: body.resetFrequency || "ALL_TIME",
      sortOrder: body.sortOrder || "DESCENDING",
      maxScoreDelta: body.maxScoreDelta ? Number(body.maxScoreDelta) : undefined
    });

    return NextResponse.json({ success: true, leaderboard: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create leaderboard" },
      { status: 500 }
    );
  }
}
