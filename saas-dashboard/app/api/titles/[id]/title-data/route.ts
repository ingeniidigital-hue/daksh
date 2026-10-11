import { NextRequest, NextResponse } from "next/server";
import {
  TitleDataService,
  TitleDataScope,
  seedDefaultTitleData,
  SERVER_MASTER_SECRET
} from "@/lib/title-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  const searchParams = request.nextUrl.searchParams;

  const scopeParam = searchParams.get("scope") as TitleDataScope | null;
  const scope: TitleDataScope = scopeParam === "internal" ? "internal" : "public";
  const keysParam = searchParams.get("keys");
  const isListMode = searchParams.get("list") === "true";
  const secretKey = request.headers.get("x-secret-key") || searchParams.get("secretKey") || undefined;

  // Auto-seed defaults if empty for convenient developer experience
  const existingPublic = await TitleDataService.listTitleData(titleId, "public");
  if (existingPublic.length === 0) {
    seedDefaultTitleData(titleId);
  }

  try {
    if (isListMode) {
      // Internal scope query in list mode also requires secret authorization
      if (scope === "internal" && secretKey !== SERVER_MASTER_SECRET) {
        return NextResponse.json(
          { error: "FORBIDDEN: Server authorization required for Internal Title Data" },
          { status: 403 }
        );
      }
      const items = await TitleDataService.listTitleData(titleId, scope);
      return NextResponse.json({ titleId, scope, total: items.length, items });
    }

    const keys = keysParam ? keysParam.split(",").map(k => k.trim()) : undefined;
    const result = await TitleDataService.getTitleData({
      titleId,
      scope,
      keys,
      secretKey
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.message.includes("FORBIDDEN")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { key, value, scope = "public", description, validateJson = true } = body;

    if (!key || typeof key !== "string" || !key.trim()) {
      return NextResponse.json({ error: "Missing or invalid 'key'" }, { status: 400 });
    }

    if (value === undefined || value === null) {
      return NextResponse.json({ error: "Missing 'value'" }, { status: 400 });
    }

    const valueStr = typeof value === "string" ? value : JSON.stringify(value, null, 2);

    const result = await TitleDataService.setTitleData({
      titleId,
      key: key.trim(),
      value: valueStr,
      scope: scope === "internal" ? "internal" : "public",
      description,
      validateJson
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get("key");
  const scope = (searchParams.get("scope") as TitleDataScope) || "public";

  if (!key) {
    return NextResponse.json({ error: "Missing 'key' query parameter" }, { status: 400 });
  }

  const result = await TitleDataService.deleteTitleData(titleId, key, scope);
  return NextResponse.json(result);
}
