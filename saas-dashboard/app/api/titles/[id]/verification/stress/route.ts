import { NextRequest, NextResponse } from "next/server";
import { StressRunner, AirgapService, OwaspAuditService } from "@/lib/verification";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const virtualUsers = Math.min(Number(body.virtualUsers) || 5000, 10000);
    const operationsPerUser = Number(body.operationsPerUser) || 2;

    const stressResult = await StressRunner.runSimulation({
      titleId: id,
      virtualUsers,
      operationsPerUser,
      targetP99Ms: 50
    });

    const buildCheck = AirgapService.verifyBuildManifest();
    
    const owaspReport = await OwaspAuditService.runAudit({
      sqlInjectionVectors: [
        "'; DROP TABLE players; --",
        "' OR '1'='1' --",
        "admin'--"
      ],
      xssVectors: [
        "<script>alert(1)</script>",
        "<img src=x onerror=alert(1)>"
      ],
      tamperedTokens: [
        "eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.",
        "tampered.signature.here"
      ]
    });

    return NextResponse.json({
      titleId: id,
      stress: stressResult,
      build: buildCheck,
      owasp: owaspReport,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to run load stress verification", details: err.message },
      { status: 500 }
    );
  }
}
