import { NextRequest, NextResponse } from "next/server";
import { TurnBasedMatchService } from "@/lib/multiplayer/turn-based";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  const { matchId } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const currentTime = body.currentTime ? Number(body.currentTime) : Date.now();

    const result = await TurnBasedMatchService.checkTurnTimeoutWatchdog(matchId, currentTime);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
