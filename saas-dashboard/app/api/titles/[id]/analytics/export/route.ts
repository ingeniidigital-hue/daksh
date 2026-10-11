import { NextRequest, NextResponse } from "next/server";
import { AnalyticsService, generateRfc4180Csv } from "@/lib/analytics";
import { TelemetryIngestionService } from "@/lib/telemetry";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";

    const events = await TelemetryIngestionService.queryRecentEvents(titleId, 500);

    if (format === "csv") {
      const flattened = events.map(e => ({
        eventId: e.eventId,
        titleId: e.titleId,
        eventName: e.eventName,
        playerId: e.playerId,
        timestamp: new Date(e.timestamp).toISOString(),
        properties: JSON.stringify(e.properties)
      }));

      const csvContent = generateRfc4180Csv(flattened);
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="daksh-telemetry-${titleId}.csv"`
        }
      });
    }

    return NextResponse.json({ success: true, count: events.length, events });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to export metrics" },
      { status: 500 }
    );
  }
}
