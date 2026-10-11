import { NextRequest, NextResponse } from "next/server";
import { TitleDataService, seedDefaultTitleData } from "@/lib/title-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  let tables = await TitleDataService.listLootTables(titleId);

  if (tables.length === 0) {
    seedDefaultTitleData(titleId);
    tables = await TitleDataService.listLootTables(titleId);
  }

  return NextResponse.json({ titleId, total: tables.length, tables });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { tableId, name, description, entries } = body;

    if (!tableId || !name || !entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "tableId, name, and non-empty entries array are required" },
        { status: 400 }
      );
    }

    const created = await TitleDataService.registerLootTable({
      titleId,
      tableId: tableId.trim(),
      name: name.trim(),
      description,
      entries
    });

    return NextResponse.json({ success: true, table: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
