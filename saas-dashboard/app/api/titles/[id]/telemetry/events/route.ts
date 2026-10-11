import { NextRequest, NextResponse } from "next/server";
import { TelemetryIngestionService, PayloadTooLargeError } from "@/lib/telemetry";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const body = await req.json();

    if (Array.isArray(body)) {
      const ack = await TelemetryIngestionService.ingestBatch(titleId, body);
      return NextResponse.json(ack, { status: 202 });
    } else if (body.events && Array.isArray(body.events)) {
      const ack = await TelemetryIngestionService.ingestBatch(titleId, body.events);
      return NextResponse.json(ack, { status: 202 });
    } else if (body.eventName) {
      const ack = await TelemetryIngestionService.ingestEvent(titleId, body);
      return NextResponse.json(ack, { status: 202 });
    }

    return NextResponse.json(
      { error: "Expected telemetry event or array of events" },
      { status: 400 }
    );
  } catch (err: any) {
    if (err instanceof PayloadTooLargeError || err.name === "PayloadTooLargeError") {
      return NextResponse.json(
        { error: "PayloadTooLarge", message: err.message, bytes: err.bytes, maxBytes: err.maxBytes },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to ingest telemetry" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 50);

    const events = await TelemetryIngestionService.queryRecentEvents(titleId, limit);
    const count = await TelemetryIngestionService.getEventCount(titleId);

    return NextResponse.json({ success: true, count, events });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to query telemetry" },
      { status: 500 }
    );
  }
}
