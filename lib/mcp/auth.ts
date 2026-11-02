import { getServiceClient, type Room } from "@/lib/supabase/server";

/**
 * Validasi `Authorization: Bearer syn_live_<32 hex>` (FR-02 / NFR-02).
 * Format dicek dulu (fail fast, hemat query), lalu lookup ke rooms.
 * Return null kalau key absen/malah format salah/room gak ada.
 */
export async function authenticateRoom(req: Request): Promise<Room | null> {
  const header = (req.headers.get("authorization") ?? "").trim();
  const match = /^Bearer\s+(syn_live_[0-9a-f]{32})$/i.exec(header);
  if (!match) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("api_key", match[1])
    .single();

  if (error || !data) return null;
  return data as Room;
}
