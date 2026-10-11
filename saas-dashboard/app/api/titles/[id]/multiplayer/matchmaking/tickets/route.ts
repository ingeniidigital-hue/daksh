import { NextRequest, NextResponse } from "next/server";
import { MatchmakingService } from "@/lib/multiplayer/matchmaking";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const body = await req.json();
    const { rulesetId, players, queueTimestamp } = body;

    if (!rulesetId || !players || !Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: "rulesetId and players array are required" },
        { status: 400 }
      );
    }

    const ticket = await MatchmakingService.createTicket({
      titleId,
      rulesetId,
      players,
      queueTimestamp
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create matchmaking ticket" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(req.url);
    const ticketId = url.searchParams.get("ticketId");

    if (ticketId) {
      const ticket = await MatchmakingService.getTicket(ticketId);
      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, ticket });
    }

    return NextResponse.json(
      { error: "ticketId query param is required" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to get matchmaking ticket" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  try {
    const url = new URL(req.url);
    const ticketId = url.searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId query param is required" },
        { status: 400 }
      );
    }

    const cancelled = await MatchmakingService.cancelTicket(ticketId);
    if (!cancelled) {
      return NextResponse.json(
        { error: "Could not cancel ticket (not found or already matched)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Ticket cancelled" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to cancel ticket" },
      { status: 500 }
    );
  }
}
