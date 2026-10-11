import { NextRequest, NextResponse } from "next/server";
import { ActionReportingService } from "@/lib/actions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { playerId, actionType } = body;

    if (!playerId || !actionType) {
      return NextResponse.json(
        { error: "playerId and actionType are required fields" },
        { status: 400 }
      );
    }

    const result = await ActionReportingService.processActionReport(titleId, body);

    if (result.antiCheatFlagged) {
      return NextResponse.json(result, { status: 403 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process action" }, { status: 500 });
  }
}
