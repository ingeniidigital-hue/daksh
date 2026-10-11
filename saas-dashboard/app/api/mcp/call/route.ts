import { NextRequest, NextResponse } from "next/server";
import { MCPService } from "@/lib/mcp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, arguments: args } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { isError: true, content: [{ type: "text", text: "Tool 'name' is required" }] },
        { status: 400 }
      );
    }

    const result = await MCPService.callTool({
      name,
      arguments: args
    });

    return NextResponse.json(result, { status: result.isError ? 400 : 200 });
  } catch (err: any) {
    return NextResponse.json(
      { isError: true, content: [{ type: "text", text: err.message }] },
      { status: 500 }
    );
  }
}
