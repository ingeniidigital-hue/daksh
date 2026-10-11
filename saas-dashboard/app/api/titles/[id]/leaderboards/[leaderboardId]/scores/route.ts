import { NextRequest, NextResponse } from "next/server";
import { LeaderboardService, AntiCheatViolationError } from "@/lib/leaderboards";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; leaderboardId: string }> }
) {
  try {
    const { id: titleId, leaderboardId } = await context.params;
    const body = await req.json();
    const { playerId, score, timestamp, metadata } = body;

    if (!playerId || score === undefined) {
      return NextResponse.json(
        { error: "playerId and numeric score are required" },
        { status: 400 }
      );
    }

    const result = await LeaderboardService.submitScore({
      titleId,
      leaderboardId,
      playerId,
      score: Number(score),
      timestamp: timestamp ? Number(timestamp) : undefined,
      metadata
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    if (err instanceof AntiCheatViolationError || err.name === "AntiCheatViolationError") {
      return NextResponse.json(
        {
          error: "AntiCheatViolation",
          message: err.message,
          attemptedDelta: err.attemptedDelta,
          maxAllowedDelta: err.maxAllowedDelta
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Failed to submit score" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; leaderboardId: string }> }
) {
  try {
    const { id: titleId, leaderboardId } = await context.params;
    const url = new URL(req.url);
    const playerId = url.searchParams.get("playerId");
    const limit = Number(url.searchParams.get("limit") || 50);

    if (playerId) {
      const entry = await LeaderboardService.getPlayerRank(titleId, leaderboardId, playerId);
      if (!entry) {
        return NextResponse.json(
          { error: "Player not ranked in this leaderboard" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, entry });
    }

    const topScores = await LeaderboardService.getTopScores(titleId, leaderboardId, limit);
    return NextResponse.json({ success: true, topScores });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch leaderboard scores" },
      { status: 500 }
    );
  }
}
