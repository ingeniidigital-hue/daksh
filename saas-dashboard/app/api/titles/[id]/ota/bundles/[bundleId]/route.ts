import { NextRequest, NextResponse } from "next/server";
import { OtaAssetService } from "@/lib/ota";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; bundleId: string }> }
) {
  try {
    const { bundleId } = await context.params;
    const metadata = OtaAssetService.getBundleMetadata(bundleId);

    if (!metadata) {
      return NextResponse.json({ error: "Asset bundle not found" }, { status: 404 });
    }

    const rangeHeader = req.headers.get("range");
    const rangeResult = OtaAssetService.getBundleRange(bundleId, rangeHeader);

    if (!rangeResult) {
      return NextResponse.json({ error: "Could not read bundle range" }, { status: 500 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      "Accept-Ranges": "bytes",
      "X-Asset-SHA256": metadata.sha256Checksum,
      "x-amz-meta-sha256": metadata.sha256Checksum,
      "ETag": `"${metadata.sha256Checksum}"`,
      "Content-Disposition": `attachment; filename="${metadata.fileName}"`
    };

    if (rangeResult.status === 206 && rangeResult.contentRange) {
      headers["Content-Range"] = rangeResult.contentRange;
      headers["Content-Length"] = String(rangeResult.chunk.length);
      return new Response(rangeResult.chunk as any, {
        status: 206,
        headers
      });
    }

    headers["Content-Length"] = String(rangeResult.chunk.length);
    return new Response(rangeResult.chunk as any, {
      status: 200,
      headers
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to download asset bundle" },
      { status: 500 }
    );
  }
}
