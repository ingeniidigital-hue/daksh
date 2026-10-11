import { NextRequest, NextResponse } from "next/server";
import { addCatalogItem, listCatalogItems } from "@/lib/economy";
import { evaluateConditionalCache } from "@/lib/sdk-sync";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  const items = listCatalogItems(titleId);
  const data = { titleId, total: items.length, items };

  const ifNoneMatch = request.headers.get("if-none-match");
  const cacheResult = evaluateConditionalCache(data, ifNoneMatch);

  if (cacheResult.status === 304) {
    return new Response(null, {
      status: 304,
      headers: {
        "ETag": cacheResult.etag,
        "Cache-Control": "public, max-age=60, must-revalidate"
      }
    });
  }

  return NextResponse.json(data, {
    headers: {
      "ETag": cacheResult.etag,
      "Cache-Control": "public, max-age=60, must-revalidate"
    }
  });
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
