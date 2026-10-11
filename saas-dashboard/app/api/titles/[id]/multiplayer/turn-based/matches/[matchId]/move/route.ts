import { NextRequest, NextResponse } from "next/server";
import { TurnBasedMatchService } from "@/lib/multiplayer/turn-based";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { matchId } = await params;
  try {
    const body = await request.json();
    const { playerId, move } = body;

    if (!playerId || !move) {
      return NextResponse.json(
        { error: "playerId and move object are required" },
        { status: 400 }
      );
    }

    const result = await TurnBasedMatchService.submitMove({
      matchId,
      playerId,
      move
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message.includes("NOT_YOUR_TURN")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
