import { NextRequest, NextResponse } from "next/server";
import { TelemetryIngestionService, PayloadTooLargeError } from "@/lib/telemetry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const titleId = body.titleId || (body[0] && body[0].titleId) || "DEFAULT_TITLE";

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
