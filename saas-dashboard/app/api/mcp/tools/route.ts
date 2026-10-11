import { NextResponse } from "next/server";
import { MCPService } from "@/lib/mcp";

export async function GET() {
  const result = await MCPService.listTools();
  return NextResponse.json(result);
}
