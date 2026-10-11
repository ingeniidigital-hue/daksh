import { NextRequest, NextResponse } from "next/server";
import { TurnBasedMatchService } from "@/lib/multiplayer/turn-based";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  const matches = await TurnBasedMatchService.listMatches(titleId);
  return NextResponse.json({ titleId, total: matches.length, matches });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { players, turnTimeoutSeconds = 30, wagerAmount = 0, currencyCode = "GOLD" } = body;

    if (!players || !Array.isArray(players) || players.length < 2) {
      return NextResponse.json(
        { error: "At least 2 players are required in the 'players' array" },
        { status: 400 }
      );
    }

    const match = await TurnBasedMatchService.createMatch({
      titleId,
      players,
      turnTimeoutSeconds: Number(turnTimeoutSeconds),
      wagerAmount: Number(wagerAmount),
      currencyCode
    });

    return NextResponse.json({ success: true, match }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
