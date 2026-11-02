import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AgentInput {
  agent_name: string;
  persona: string;
}

/**
 * POST /api/rooms — buat room (FR-01): topik, persona agen, max_rounds.
 * Menghasilkan Room ID + API Key `syn_live_<32 hex>` (FR-02).
 * API key hanya dikembalikan SEKALI di response ini.
 */
export async function POST(req: NextRequest) {
  let body: {
    topic?: string;
    max_rounds?: number;
    agents?: AgentInput[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const topic = body.topic?.trim();
  const agents = Array.isArray(body.agents) ? body.agents : [];
  const maxRounds =
    typeof body.max_rounds === "number" && body.max_rounds > 0
      ? Math.floor(body.max_rounds)
      : 5;

  if (!topic) {
    return NextResponse.json({ error: "Field 'topic' wajib diisi." }, { status: 400 });
  }
  if (agents.length === 0 || agents.some((a) => !a.agent_name?.trim())) {
    return NextResponse.json(
      { error: "Minimal satu agen dengan 'agent_name' wajib diisi." },
      { status: 400 }
    );
  }

  const api_key = `syn_live_${randomBytes(16).toString("hex")}`; // syn_live_ + 32 hex
  const supabase = getServiceClient();

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({ topic, api_key, max_rounds: maxRounds })
    .select("id, topic, status, max_rounds, current_round, created_at")
    .single();
  if (roomErr || !room) {
    return NextResponse.json(
      { error: `Gagal membuat room: ${roomErr?.message}` },
      { status: 500 }
    );
  }

  const { error: agentsErr } = await supabase.from("room_agents").insert(
    agents.map((a) => ({
      room_id: room.id,
      agent_name: a.agent_name.trim(),
      persona: a.persona?.trim() || "unspecified",
    }))
  );
  if (agentsErr) {
    return NextResponse.json(
      { error: `Room dibuat tapi gagal daftar agen: ${agentsErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ room, api_key }, { status: 201 });
}
