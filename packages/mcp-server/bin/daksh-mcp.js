#!/usr/bin/env node

/**
 * Official Model Context Protocol (MCP) Stdio Server for Daksh
 * Compatible with Claude Desktop, Cursor, Antigravity, and all standard MCP clients.
 */

const readline = require("readline");
const http = require("http");

const DAKSH_URL = process.env.DAKSH_URL || "http://localhost:3000";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendJsonRpc(response) {
  process.stdout.write(JSON.stringify(response) + "\n");
}

async function forwardToDakshHttp(jsonRpcMessage) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(jsonRpcMessage);
    const url = new URL("/api/mcp", DAKSH_URL);

    const req = http.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Invalid JSON from Daksh server: ${body}`));
          }
        });
      }
    );

    req.on("error", (err) => {
      // Fallback response if Daksh HTTP daemon is offline
      if (jsonRpcMessage.method === "initialize") {
        resolve({
          jsonrpc: "2.0",
          id: jsonRpcMessage.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "daksh-mcp-standalone", version: "0.1.0" }
          }
        });
      } else if (jsonRpcMessage.method === "ping") {
        resolve({ jsonrpc: "2.0", id: jsonRpcMessage.id, result: {} });
      } else {
        resolve({
          jsonrpc: "2.0",
          id: jsonRpcMessage.id,
          error: {
            code: -32000,
            message: `Could not connect to Daksh instance at ${DAKSH_URL}: ${err.message}`
          }
        });
      }
    });

    req.write(postData);
    req.end();
  });
}

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const message = JSON.parse(trimmed);
    const response = await forwardToDakshHttp(message);
    sendJsonRpc(response);
  } catch (err) {
    sendJsonRpc({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${err.message}`
      }
    });
  }
});

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
