import { NextRequest, NextResponse } from "next/server";
import { OtaAssetService, AssetPlatform, ReleaseChannel } from "@/lib/ota";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const url = new URL(req.url);
    const platform = (url.searchParams.get("platform") as AssetPlatform) || undefined;
    const channel = (url.searchParams.get("channel") as ReleaseChannel) || undefined;

    const bundles = await OtaAssetService.listBundles(titleId, platform, channel);
    return NextResponse.json({ success: true, count: bundles.length, bundles });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to list asset bundles" },
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
    const contentType = req.headers.get("content-type") || "";

    let platform: AssetPlatform = "android";
    let channel: ReleaseChannel = "dev";
    let version = "v1.0.0";
    let fileName = "bundle.bin";
    let fileBuffer: Buffer;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      platform = (formData.get("platform") as AssetPlatform) || "android";
      channel = (formData.get("channel") as ReleaseChannel) || "dev";
      version = (formData.get("version") as string) || "v1.0.0";
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "Missing file in formData" }, { status: 400 });
      }
      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json();
      platform = body.platform || "android";
      channel = body.channel || "dev";
      version = body.version || "v1.0.0";
      fileName = body.fileName || "bundle.bin";

      if (body.contentBase64) {
        fileBuffer = Buffer.from(body.contentBase64, "base64");
      } else if (body.contentString) {
        fileBuffer = Buffer.from(body.contentString, "utf8");
      } else {
        fileBuffer = Buffer.from("Simulated Daksh Asset Bundle Data");
      }
    }

    const metadata = await OtaAssetService.uploadBundle({
      titleId,
      platform,
      channel,
      version,
      fileName,
      fileBuffer
    });

    return NextResponse.json({ success: true, bundle: metadata }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to upload asset bundle" },
      { status: 500 }
    );
  }
}
