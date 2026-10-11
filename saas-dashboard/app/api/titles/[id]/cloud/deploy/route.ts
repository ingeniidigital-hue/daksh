import { NextRequest, NextResponse } from "next/server";
import { CloudPlatformService } from "@/lib/cloud";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const body = await req.json().catch(() => ({}));

    const deployment = await CloudPlatformService.deployGlobalCloud(titleId, {
      regions: body.regions,
      tier: body.tier
    });

    return NextResponse.json({ success: true, deployment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to deploy global cloud" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: titleId } = await context.params;
    const deployment = await CloudPlatformService.getDeployment(titleId);

    if (!deployment) {
      return NextResponse.json({
        success: true,
        deployed: false,
        message: "No global cloud deployment yet for this title"
      });
    }

    return NextResponse.json({ success: true, deployed: true, deployment });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch deployment status" },
      { status: 500 }
    );
  }
}
