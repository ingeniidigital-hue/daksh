import { NextRequest, NextResponse } from "next/server";
import { CloudPlatformService, SuperRegion } from "@/lib/cloud";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const url = new URL(req.url);
    const region = (url.searchParams.get("region") as SuperRegion) || undefined;

    const servers = await CloudPlatformService.listGameServers(titleId, region);
    return NextResponse.json({ success: true, count: servers.length, servers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to list Agones servers" },
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
    const { region = "bom", gameMode = "standard" } = body;

    const allocated = await CloudPlatformService.allocateGameServer({
      titleId,
      region,
      gameMode
    });

    return NextResponse.json({ success: true, server: allocated }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to allocate Agones server" },
      { status: 500 }
    );
  }
}
