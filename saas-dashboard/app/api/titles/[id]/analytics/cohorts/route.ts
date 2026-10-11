import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/analytics";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const cohorts = await AnalyticsService.getRetentionCohorts(titleId);
    return NextResponse.json({ success: true, cohorts });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to calculate retention cohorts" },
      { status: 500 }
    );
  }
}
