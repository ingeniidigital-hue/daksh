import { NextRequest, NextResponse } from "next/server";
import { MCPService } from "@/lib/mcp";

/**
 * Official Model Context Protocol (MCP) JSON-RPC 2.0 Endpoint
 * Conforms to Anthropic Model Context Protocol specification (2024-11-05).
 * Supports methods: 'initialize', 'ping', 'tools/list', 'tools/call'.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await MCPService.handleJsonRpc(body);
    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: `Parse error: ${err.message}`
        }
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  const tools = await MCPService.listTools();
  return NextResponse.json({
    status: "ok",
    server: "daksh-mcp",
    protocolVersion: "2024-11-05",
    ...tools
  });
}
