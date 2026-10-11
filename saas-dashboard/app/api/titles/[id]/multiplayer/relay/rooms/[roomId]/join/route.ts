import { NextRequest, NextResponse } from "next/server";
import { RelayNetcodeService } from "@/lib/multiplayer/relay";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const { roomId } = await params;
  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Missing required 'clientId'" }, { status: 400 });
    }

    const room = await RelayNetcodeService.joinRoom(roomId, clientId);
    return NextResponse.json({ success: true, room });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
