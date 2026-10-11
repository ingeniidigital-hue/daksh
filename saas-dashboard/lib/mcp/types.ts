export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPListToolsResponse {
  tools: MCPTool[];
}

export interface MCPCallToolRequest {
  name: string;
  arguments?: Record<string, any>;
}

export interface MCPContentItem {
  type: "text";
  text: string;
}

export interface MCPCallToolResult {
  content: MCPContentItem[];
  isError?: boolean;
}
