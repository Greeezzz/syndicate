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
  // api_key tinggal di room_secrets (bukan rooms) — kolom rooms tanpa key
  // supaya anon/realtime tidak bisa membacanya (NFR-02).
  const { data, error } = await supabase
    .from("room_secrets")
    .select("room:rooms(*)")
    .eq("api_key", match[1])
    .single();

  if (error || !data?.room) return null;
  return data.room as unknown as Room;
}
