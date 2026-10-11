import { NextRequest, NextResponse } from "next/server";
import { RelayNetcodeService } from "@/lib/multiplayer/relay";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const { roomId } = await params;
  try {
    const senderId = request.headers.get("x-sender-id") || "anonymous_client";
    const arrayBuffer = await request.arrayBuffer();
    const packetBuffer = Buffer.from(arrayBuffer);

    const result = await RelayNetcodeService.dispatchPacket({
      roomId,
      senderId,
      packet: packetBuffer
    });

    if (result.dropped) {
      return NextResponse.json(
        { dropped: true, reason: result.dropReason },
        { status: result.dropReason === "RATE_LIMIT_EXCEEDED" ? 429 : 400 }
      );
    }

    return NextResponse.json({ success: true, broadcastCount: result.broadcastCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
