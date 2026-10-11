import { NextRequest, NextResponse } from "next/server";
import { RelayNetcodeService } from "@/lib/multiplayer/relay";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  const rooms = await RelayNetcodeService.listRooms(titleId);
  return NextResponse.json({ titleId, total: rooms.length, rooms });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const { maxClients = 32, tickRateHz = 30 } = body;

    const room = await RelayNetcodeService.createRoom({
      titleId,
      maxClients: Number(maxClients),
      tickRateHz: Number(tickRateHz)
    });

    return NextResponse.json({ success: true, room }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
