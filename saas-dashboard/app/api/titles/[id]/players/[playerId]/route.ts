import { NextRequest, NextResponse } from "next/server";
import { deletePlayerRightToBeForgotten, setPlayerStatus } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: titleId, playerId } = await params;
  try {
    const body = await request.json();
    const { status } = body;

    if (!["Active", "Banned", "Suspended"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updated = await setPlayerStatus(titleId, playerId, status);
    return NextResponse.json({ success: true, player: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id: titleId, playerId } = await params;
  try {
    const deleted = await deletePlayerRightToBeForgotten(titleId, playerId);
    if (!deleted) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: "Player profile and all associated data permanently deleted under DPDP / GDPR Right to be Forgotten"
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
