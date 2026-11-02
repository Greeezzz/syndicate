import { NextRequest, NextResponse } from "next/server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
import { authenticateRoom } from "@/lib/mcp/auth";
import { createSyndicateServer } from "@/lib/mcp/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRpcId = number | string | null;
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

/**
 * Jembatan stateless: tiap POST di-handle satu pasangan
 * McpServer (tools) + Client SDK lewat InMemoryTransport.
 * Transport HTTP-nya JSON-RPC biasa — Hermes CLI cukup POST.
 */
async function bridge<T>(
  room: NonNullable<Awaited<ReturnType<typeof authenticateRoom>>>,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const server = createSyndicateServer(room);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "syndicate-http-bridge", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    return await fn(client);
  } finally {
    await client.close();
    await server.close();
  }
}

export async function POST(req: NextRequest) {
  let body: JsonRpcRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400 });
  }
  const id = body.id ?? 1;
  const isNotification =
    body.method?.startsWith("notifications/") || body.method?.startsWith("$/");

  // Handshake protokol — tanpa auth (belum ada konteks room)
  if (body.method === "initialize") {
    const params = (body.params ?? {}) as { protocolVersion?: string };
    return NextResponse.json(
      rpcResult(id, {
        protocolVersion: params.protocolVersion ?? LATEST_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "syndicate-mcp", version: "1.0.0" },
        instructions:
          "War room SYNDICATE. Semua tool butuh header Authorization: Bearer syn_live_<32 hex> milik room.",
      })
    );
  }

  if (isNotification) {
    return new NextResponse(null, { status: 202 });
  }

  // Semua operasi data wajib API key room (FR-02 / NFR-02)
  const room = await authenticateRoom(req);
  if (!room) {
    return NextResponse.json(
      rpcError(id, -32001, "Unauthorized: API key room tidak valid atau absen."),
      { status: 401 }
    );
  }

  switch (body.method) {
    case "tools/list": {
      const { tools } = await bridge(room, (c) => c.listTools());
      return NextResponse.json(rpcResult(id, { tools }));
    }
    case "tools/call": {
      const params = (body.params ?? {}) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      if (!params.name) {
        return NextResponse.json(rpcError(id, -32602, "params.name wajib ada."));
      }
      try {
        const result = await bridge(room, (c) =>
          c.callTool({ name: params.name!, arguments: params.arguments ?? {} })
        );
        return NextResponse.json(rpcResult(id, result));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json(
          rpcResult(id, {
            content: [{ type: "text", text: message }],
            isError: true,
          })
        );
      }
    }
    default:
      return NextResponse.json(
        rpcError(id, -32601, `Method tidak dikenal: ${body.method}`)
      );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Gunakan POST JSON-RPC ke endpoint ini." },
    { status: 405 }
  );
}
