import { NextRequest, NextResponse } from "next/server";
import { linkFederatedAccount } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { playerId, provider, providerId, conflictResolution } = body;

    if (!playerId || !provider || !providerId) {
      return NextResponse.json(
        { error: "playerId, provider, and providerId are required" },
        { status: 400 }
      );
    }

    const result = await linkFederatedAccount({
      titleId,
      playerId,
      provider,
      providerId,
      conflictResolution: conflictResolution || "ABORT"
    });

    if (result.conflict && !result.success) {
      // 409 Conflict: Account is already linked to another player profile
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
