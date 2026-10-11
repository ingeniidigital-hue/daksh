import { NextRequest, NextResponse } from "next/server";
import { authenticateDevice, listTitlePlayers } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  let players = await listTitlePlayers(titleId);

  // If newly created title has no players yet, seed initial active players
  if (players.length === 0) {
    await authenticateDevice({
      titleId,
      deviceId: "hw_galaxy_s24_demo_01",
      clientPlatform: "Android",
      displayName: "DragonSlayer99"
    });
    await authenticateDevice({
      titleId,
      deviceId: "hw_iphone_16_demo_02",
      clientPlatform: "iOS",
      displayName: "ShadowHunter"
    });
    players = await listTitlePlayers(titleId);
  }

  return NextResponse.json({
    titleId,
    total: players.length,
    players
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { deviceId, clientPlatform, displayName } = body;

    if (!deviceId || !deviceId.trim()) {
      return NextResponse.json({ error: "deviceId cannot be blank" }, { status: 400 });
    }

    const authResult = await authenticateDevice({
      titleId,
      deviceId: deviceId.trim(),
      clientPlatform: clientPlatform || "Web",
      displayName
    });

    return NextResponse.json({
      success: true,
      token: authResult.token,
      isNewPlayer: authResult.isNewPlayer,
      player: authResult.player
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Authentication failed" }, { status: 500 });
  }
}
