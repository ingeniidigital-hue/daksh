import { NextRequest, NextResponse } from "next/server";
import { TitleDataService } from "@/lib/title-data";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { tableId, pityCounter, pityThreshold, pityGuaranteedRarity } = body;

    if (!tableId) {
      return NextResponse.json({ error: "Missing required 'tableId'" }, { status: 400 });
    }

    const drop = await TitleDataService.rollLootDrop({
      titleId,
      tableId,
      pityCounter: pityCounter ? Number(pityCounter) : undefined,
      pityThreshold: pityThreshold ? Number(pityThreshold) : undefined,
      pityGuaranteedRarity
    });

    return NextResponse.json({ success: true, drop });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
