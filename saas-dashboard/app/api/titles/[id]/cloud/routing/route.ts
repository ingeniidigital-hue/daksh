import { NextRequest, NextResponse } from "next/server";
import { CloudPlatformService } from "@/lib/cloud";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clientIpCountry = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || body.ipCountry;

    const route = CloudPlatformService.routeNearestPoP({
      ipCountry: clientIpCountry,
      latencyMap: body.latencyMap
    });

    return NextResponse.json({ success: true, route });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to resolve latency route" },
      { status: 500 }
    );
  }
}
