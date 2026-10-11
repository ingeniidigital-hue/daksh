import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService, RbacForbiddenError } from "@/lib/analytics";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const roleHeader = req.headers.get("x-user-role") || "admin";

    const kpis = await AnalyticsService.getExecutiveKpis(titleId, { role: roleHeader });
    return NextResponse.json({ success: true, kpis });
  } catch (err: any) {
    if (err instanceof RbacForbiddenError || err.name === "RbacForbiddenError") {
      return NextResponse.json(
        { error: "Forbidden", message: err.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to load executive KPIs" },
      { status: 500 }
    );
  }
}
