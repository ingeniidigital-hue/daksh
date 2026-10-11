import { NextRequest, NextResponse } from "next/server";
import { addCatalogItem, listCatalogItems } from "@/lib/economy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  const items = listCatalogItems(titleId);
  return NextResponse.json({ titleId, total: items.length, items });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { id, name, description, category, prices, metadata } = body;

    if (!id || !name || !category || !prices) {
      return NextResponse.json(
        { error: "id, name, category, and prices are required fields" },
        { status: 400 }
      );
    }

    const created = addCatalogItem(titleId, {
      id: id.trim(),
      name: name.trim(),
      description: description || "",
      category,
      prices,
      isActive: true,
      metadata: metadata || {}
    });

    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
