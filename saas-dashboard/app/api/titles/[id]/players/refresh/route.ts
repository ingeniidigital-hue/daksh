import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: "refreshToken is required" }, { status: 400 });
    }

    const result = await rotateRefreshToken(titleId, refreshToken);
    return NextResponse.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      expiresIn: 7200,
      player: result.player
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
