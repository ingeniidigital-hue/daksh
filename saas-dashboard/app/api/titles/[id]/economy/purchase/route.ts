import { NextRequest, NextResponse } from "next/server";
import { EconomyService, getWalletBalance } from "@/lib/economy";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: titleId } = await params;
  try {
    const body = await request.json();
    const { playerId, itemId, currencyCode, idempotencyKey } = body;

    if (!playerId || !itemId || !currencyCode) {
      return NextResponse.json(
        { error: "playerId, itemId, and currencyCode are required" },
        { status: 400 }
      );
    }

    // Ensure initial balance for testing/demo if wallet is empty
    const currentBalance = getWalletBalance(titleId, playerId, currencyCode);
    if (currentBalance === 0) {
      EconomyService.creditWallet(titleId, playerId, currencyCode, 500);
    }

    const result = await EconomyService.purchaseItem({
      titleId,
      playerId,
      itemId,
      currencyCode: currencyCode.toUpperCase(),
      idempotencyKey: idempotencyKey || `tx_${Date.now()}`
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 402 }); // Payment Required / Insufficient funds
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
