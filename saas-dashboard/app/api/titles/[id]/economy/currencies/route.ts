import { NextRequest, NextResponse } from "next/server";
import { addCurrency, listCurrencies } from "@/lib/economy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  const currencies = listCurrencies(titleId);
  return NextResponse.json({ titleId, currencies });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { code, name, initialDeposit } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "Currency code and name are required" }, { status: 400 });
    }

    const created = addCurrency(titleId, {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      initialDeposit: Number(initialDeposit) || 0
    });

    return NextResponse.json({ success: true, currency: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
