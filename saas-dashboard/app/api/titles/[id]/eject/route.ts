import { NextRequest, NextResponse } from "next/server";
import { EjectService, EjectOptions } from "@/lib/eject";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const options: EjectOptions = {
      titleName: searchParams.get("titleName") || id,
      environment: searchParams.get("environment") || "self_hosted",
      includeSampleData: searchParams.get("includeSampleData") !== "false",
      customDomain: searchParams.get("customDomain") || undefined
    };

    const zipBuffer = await EjectService.generateEjectArchive(id, options);

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="daksh-eject-${id}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
        "X-Daksh-Eject-Title": id
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate eject package", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const options: EjectOptions = {
      titleName: body.titleName || id,
      environment: body.environment || "self_hosted",
      includeSampleData: body.includeSampleData !== false,
      customDomain: body.customDomain
    };

    const zipBuffer = await EjectService.generateEjectArchive(id, options);

    // If client requested download as attachment
    if (body.format !== "json") {
      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="daksh-eject-${id}.zip"`,
          "Content-Length": zipBuffer.length.toString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      titleId: id,
      sizeBytes: zipBuffer.length,
      downloadUrl: `/api/titles/${id}/eject?titleName=${encodeURIComponent(options.titleName || id)}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to package eject bundle", details: error.message },
      { status: 500 }
    );
  }
}
