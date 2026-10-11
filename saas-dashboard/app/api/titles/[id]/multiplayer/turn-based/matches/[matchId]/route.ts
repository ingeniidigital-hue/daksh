import { NextRequest, NextResponse } from "next/server";
import { TurnBasedMatchService } from "@/lib/multiplayer/turn-based";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { matchId } = await params;
  const match = await TurnBasedMatchService.getMatch(matchId);

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, match });
}
