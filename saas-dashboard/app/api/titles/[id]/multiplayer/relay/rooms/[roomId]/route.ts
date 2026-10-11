import { NextRequest, NextResponse } from "next/server";
import { RelayNetcodeService } from "@/lib/multiplayer/relay";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const { roomId } = await params;
  const room = await RelayNetcodeService.getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: "Relay room not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}
