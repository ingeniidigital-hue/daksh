import { NextRequest } from "next/server";
import { MatchmakingXRayService } from "@/lib/multiplayer/xray";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await context.params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial snapshot
      const initial = MatchmakingXRayService.getLatestTelemetry(titleId);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));

      // Subscribe to live telemetry updates
      const unsubscribe = MatchmakingXRayService.subscribeToTelemetry(titleId, data => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream might be closed
        }
      });

      // Cleanup when stream aborted
      req.signal.addEventListener("abort", () => {
        unsubscribe();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
