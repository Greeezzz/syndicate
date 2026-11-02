import { createClient, SupabaseClient } from "@supabase/supabase-js";

/** Status room — single source of truth mengikuti enum DB room_status */
export type RoomStatus = "IDLE" | "RUNNING" | "COMPLETED";

export interface Room {
  id: string;
  topic: string;
  api_key: string;
  status: RoomStatus;
  max_rounds: number;
  current_round: number;
  created_at: string;
}

/**
 * Service role client — HANYA untuk server (Route Handler).
 * Bypass RLS: seluruh tulis DB melewati sini (NFR-02).
 */
export function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Env Supabase belum diisi. Salin .env.example jadi .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Anon client — dipakai komponen frontend (Chelo/Iwan) untuk
 * subscribe Supabase Realtime. Baca saja; RLS mengunci tulisan.
 */
export function getBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Env Supabase anon belum diisi (.env.local).");
  }
  return createClient(url, key);
}
