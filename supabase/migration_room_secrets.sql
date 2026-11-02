-- ============================================================
-- MIGRATION: api_key pindah dari rooms ke room_secrets
-- Alasan: rooms dibaca publik via RLS → api_key bocor ke anon
-- dan realtime payload (NFR-02 dilanggar).
-- Jalankan SEKALI di Supabase Dashboard > SQL Editor. Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS room_secrets (
  room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pindahkan key yang sudah ada
INSERT INTO room_secrets (room_id, api_key)
SELECT id, api_key FROM rooms
WHERE api_key IS NOT NULL
ON CONFLICT (room_id) DO NOTHING;

-- Buang kolom dari tabel publik
ALTER TABLE rooms DROP COLUMN IF EXISTS api_key;

-- Kunci tabel: RLS tanpa policy = hanya service-role yang bisa akses
ALTER TABLE room_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON room_secrets FROM anon, authenticated;
