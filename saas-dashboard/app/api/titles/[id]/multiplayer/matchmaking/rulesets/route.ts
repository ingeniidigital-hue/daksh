import { NextRequest, NextResponse } from "next/server";
import { MatchmakingService } from "@/lib/multiplayer/matchmaking";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const rulesets = await MatchmakingService.listRulesets(titleId);
    return NextResponse.json({ success: true, rulesets });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to list rulesets" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const body = await req.json();

    if (!body.rulesetId || !body.name || !body.mode) {
      return NextResponse.json(
        { error: "rulesetId, name, and mode are required" },
        { status: 400 }
      );
    }

    const saved = await MatchmakingService.createOrUpdateRuleset({
      ...body,
      titleId
    });

    return NextResponse.json({ success: true, ruleset: saved }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save ruleset" },
      { status: 500 }
    );
  }
}
