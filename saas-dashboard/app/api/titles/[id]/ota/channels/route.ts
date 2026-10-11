import { NextRequest, NextResponse } from "next/server";
import { OtaAssetService, AssetPlatform, ReleaseChannel } from "@/lib/ota";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const url = new URL(req.url);
    const platform = (url.searchParams.get("platform") as AssetPlatform) || "android";
    const channel = (url.searchParams.get("channel") as ReleaseChannel) || "prod";

    const activeBundle = await OtaAssetService.getActiveChannelBundle(titleId, platform, channel);
    return NextResponse.json({ success: true, platform, channel, activeBundle });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to get active channel bundle" },
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
    const { platform, channel, bundleId } = body;

    if (!platform || !channel || !bundleId) {
      return NextResponse.json(
        { error: "platform, channel, and target bundleId are required" },
        { status: 400 }
      );
    }

    const success = await OtaAssetService.rollbackChannel(titleId, platform, channel, bundleId);
    if (!success) {
      return NextResponse.json(
        { error: "Target bundle not found or platform mismatch" },
        { status: 404 }
      );
    }

    const updated = await OtaAssetService.getActiveChannelBundle(titleId, platform, channel);
    return NextResponse.json({ success: true, message: `Channel ${channel} updated`, activeBundle: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update release channel" },
      { status: 500 }
    );
  }
}
