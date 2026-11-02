import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getServiceClient,
  type Room,
  type RoomStatus,
} from "@/lib/supabase/server";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function text(payload: unknown, isError = false): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

function fail(message: string): ToolResult {
  return text({ error: message }, true);
}

interface ChatMessage {
  agent_name: string;
  content: string;
  type: string;
  round_number: number;
  created_at: string;
}

/**
 * MCP server SYNDICATE per-room.
 * Dibuat per-request di route.ts setelah auth — tools "menangkap"
 * context room dari API key (room_id dari param divalidasi ulang,
 * key adalah otoritas tunggal, NFR-02).
 */
export function createSyndicateServer(room: Room): McpServer {
  // Lazy: tools/list tidak butuh DB — jalan walau env Supabase belum diisi
  let _db: SupabaseClient | null = null;
  const db = (): SupabaseClient => (_db ??= getServiceClient());
  const server = new McpServer({
    name: "syndicate-mcp",
    version: "1.0.0",
  });

  // ----------------------------------------------------------
  // sync_discussion — loop diskusi otonom (PRD workflow #3)
  // ----------------------------------------------------------
  server.registerTool(
    "sync_discussion",
    {
      description:
        "Kirim argumen/persona kamu ke war room, lalu terima balasan terbaru dari agen lain + status room. Room terkunci (COMPLETED) saat max_rounds terlampaui.",
      inputSchema: {
        room_id: z.string().uuid(),
        agent_name: z.string().min(1),
        message_content: z.string().min(1),
      },
    },
    async ({ room_id, agent_name, message_content }) => {
      if (room_id !== room.id) {
        return fail("room_id tidak cocok dengan API key room kamu.");
      }
      if (room.status === "COMPLETED") {
        return text({
          room_status: "COMPLETED",
          locked: true,
          notice:
            "Room sudah terkunci. Diskusi selesai — tidak ada pesan baru yang diterima.",
        });
      }

      // Daftarkan agen bila belum ada (NFR-03: CLI baru boleh nyusul)
      const { data: existing } = await db()
        .from("room_agents")
        .select("id")
        .eq("room_id", room.id)
        .eq("agent_name", agent_name)
        .maybeSingle();
      if (!existing) {
        const { error: insErr } = await db().from("room_agents").insert({
          room_id: room.id,
          agent_name,
          persona: "auto-registered",
        });
        if (insErr) return fail(`Gagal daftar agen: ${insErr.message}`);
      }

      const round = room.current_round;
      const { error: msgErr } = await db().from("messages").insert({
        room_id: room.id,
        agent_name,
        content: message_content,
        type: "CHAT",
        round_number: round,
      });
      if (msgErr) return fail(`Gagal simpan pesan: ${msgErr.message}`);

      await db()
        .from("room_agents")
        .update({ status: "IDLE" })
        .eq("room_id", room.id)
        .eq("agent_name", agent_name);

      // Pesan terbaru dari agen lain (20 terakhir, terlama → terbaru)
      const { data: recent } = await db()
        .from("messages")
        .select("agent_name, content, type, round_number, created_at")
        .eq("room_id", room.id)
        .neq("agent_name", agent_name)
        .order("created_at", { ascending: false })
        .limit(20);
      const others = ((recent ?? []) as ChatMessage[]).reverse();

      // Ronde selesai bila semua agen terdaftar sudah bicara di ronde ini
      const { data: agents } = await db()
        .from("room_agents")
        .select("agent_name")
        .eq("room_id", room.id);
      const names = (agents ?? []).map((a) => a.agent_name);
      const { data: spoke } = await db()
        .from("messages")
        .select("agent_name")
        .eq("room_id", room.id)
        .eq("round_number", round);
      const spokeSet = new Set((spoke ?? []).map((m) => m.agent_name));
      const roundComplete =
        names.length > 0 && names.every((n) => spokeSet.has(n));

      const patch: Record<string, unknown> = {};
      let nextRound = round;
      let status: RoomStatus = room.status === "IDLE" ? "RUNNING" : room.status;
      if (room.status === "IDLE") patch.status = "RUNNING";
      if (roundComplete) {
        nextRound = round + 1;
        patch.current_round = nextRound;
        if (nextRound > room.max_rounds) {
          patch.status = "COMPLETED";
          status = "COMPLETED";
        }
      }
      if (Object.keys(patch).length > 0) {
        await db().from("rooms").update(patch).eq("id", room.id);
      }

      return text({
        room_status: status,
        round,
        next_round: nextRound,
        max_rounds: room.max_rounds,
        locked: status === "COMPLETED",
        recent_messages_from_others: others,
      });
    }
  );

  // ----------------------------------------------------------
  // propose_consensus — ajukan kesepakatan akhir (workflow #5)
  // ----------------------------------------------------------
  server.registerTool(
    "propose_consensus",
    {
      description:
        "Ajukan proposal konsensus berisi ringkasan kesepakatan. Agen lain vote via vote_consensus.",
      inputSchema: {
        room_id: z.string().uuid(),
        proposed_by: z.string().min(1),
        summary_content: z.string().min(1),
      },
    },
    async ({ room_id, proposed_by, summary_content }) => {
      if (room_id !== room.id) {
        return fail("room_id tidak cocok dengan API key room kamu.");
      }
      if (room.status === "COMPLETED") {
        return fail(
          "Room sudah COMPLETED — tidak bisa mengajukan proposal baru."
        );
      }

      const { data: proposal, error } = await db()
        .from("consensus_proposals")
        .insert({ room_id: room.id, proposed_by, summary_content })
        .select()
        .single();
      if (error || !proposal)
        return fail(`Gagal buat proposal: ${error?.message}`);

      await db().from("messages").insert({
        room_id: room.id,
        agent_name: proposed_by,
        content: `[PROPOSAL] ${summary_content}`,
        type: "PROPOSAL",
        round_number: room.current_round,
        proposal_id: proposal.id,
      });

      if (room.status === "IDLE") {
        await db()
          .from("rooms")
          .update({ status: "RUNNING" })
          .eq("id", room.id);
      }

      const { count } = await db()
        .from("room_agents")
        .select("id", { count: "exact", head: true })
        .eq("room_id", room.id);

      return text({
        proposal_id: proposal.id,
        agree_votes: 0,
        agents_total: count ?? 0,
        voting_status: "OPEN",
      });
    }
  );

  // ----------------------------------------------------------
  // vote_consensus — voting + consensus engine (workflow #6)
  // ----------------------------------------------------------
  server.registerTool(
    "vote_consensus",
    {
      description:
        "Vote proposal konsensus (AGREE/REJECT) + alasan. 100% AGREE → room terkunci COMPLETED dan state RESOLVED dikembalikan ke semua CLI.",
      inputSchema: {
        proposal_id: z.string().uuid(),
        agent_name: z.string().min(1),
        vote: z.enum(["AGREE", "REJECT"]),
        reason: z.string().optional(),
      },
    },
    async ({ proposal_id, agent_name, vote, reason }) => {
      const { data: proposal, error } = await db()
        .from("consensus_proposals")
        .select("*")
        .eq("id", proposal_id)
        .single();
      if (error || !proposal) return fail("Proposal tidak ditemukan.");
      if (proposal.room_id !== room.id) {
        return fail("Proposal ini bukan milik room kamu.");
      }
      if (proposal.is_approved) {
        return text({
          state: "RESOLVED",
          notice: "Proposal sudah disetujui sebelumnya.",
          summary_content: proposal.summary_content,
        });
      }

      // Anti double-vote
      const { data: prior } = await db()
        .from("messages")
        .select("id")
        .eq("proposal_id", proposal_id)
        .eq("agent_name", agent_name)
        .eq("type", "VOTE")
        .limit(1);
      if (prior && prior.length > 0) {
        return text({
          state: "ALREADY_VOTED",
          notice: `Agen '${agent_name}' sudah vote untuk proposal ini.`,
        });
      }

      await db().from("messages").insert({
        room_id: room.id,
        agent_name,
        content: reason ? `[VOTE: ${vote}] ${reason}` : `[VOTE: ${vote}]`,
        type: "VOTE",
        round_number: room.current_round,
        proposal_id,
      });

      await db()
        .from("room_agents")
        .update({ status: "VOTED" })
        .eq("room_id", room.id)
        .eq("agent_name", agent_name);

      const { count } = await db()
        .from("room_agents")
        .select("id", { count: "exact", head: true })
        .eq("room_id", room.id);
      const agentsTotal = count ?? 0;

      let agreeVotes: number = proposal.agree_votes ?? 0;
      if (vote === "AGREE") {
        agreeVotes += 1;
        await db()
          .from("consensus_proposals")
          .update({ agree_votes: agreeVotes })
          .eq("id", proposal_id);
      }

      // Konsensus tercapai: 100% AGREE → kunci room (PRD workflow #6)
      if (vote === "AGREE" && agreeVotes >= agentsTotal && agentsTotal > 0) {
        await db()
          .from("consensus_proposals")
          .update({ is_approved: true })
          .eq("id", proposal_id);
        await db()
          .from("rooms")
          .update({ status: "COMPLETED" })
          .eq("id", room.id);
        return text({
          state: "RESOLVED",
          agree_votes: agreeVotes,
          agents_total: agentsTotal,
          room_status: "COMPLETED",
          summary_content: proposal.summary_content,
          notice:
            "Konsensus tercapai. Room terkunci — cetak ringkasan ini di terminal owner.",
        });
      }

      return text({
        state: "CONTINUE_DISCUSSION",
        agree_votes: agreeVotes,
        agents_total: agentsTotal,
        room_status: room.status,
      });
    }
  );

  return server;
}
