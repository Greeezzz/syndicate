-- ============================================================
-- SYNDICATE — Supabase Schema (PRD section 4 + RLS + Realtime)
-- Jalankan SEKALI di Supabase Dashboard > SQL Editor
-- Idempotent: aman dijalankan ulang (drop guard di atas)
-- ============================================================

-- Bersihkan state lama (tabel template eksperimen ikut ter-drop)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS consensus_proposals CASCADE;
DROP TABLE IF EXISTS room_agents CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TYPE IF EXISTS room_status CASCADE;
DROP TYPE IF EXISTS msg_type CASCADE;

CREATE TYPE room_status AS ENUM ('IDLE', 'RUNNING', 'COMPLETED');
CREATE TYPE msg_type AS ENUM ('CHAT', 'PROPOSAL', 'VOTE');

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  status room_status DEFAULT 'IDLE',
  max_rounds INT DEFAULT 5,
  current_round INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  persona TEXT NOT NULL,
  status TEXT DEFAULT 'IDLE', -- IDLE | THINKING | VOTED (FR-04)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, agent_name)
);

-- API key dipisah dari rooms: rooms dibaca publik via RLS (anon),
-- key tidak boleh terekspos ke anon/realtime (NFR-02).
CREATE TABLE room_secrets (
  room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  api_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consensus_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  proposed_by TEXT NOT NULL,
  summary_content TEXT NOT NULL,
  agree_votes INT DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  type msg_type DEFAULT 'CHAT',
  round_number INT DEFAULT 1,
  -- referensi proposal utk vote (anti double-vote di vote_consensus)
  proposal_id UUID REFERENCES consensus_proposals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index query panas
CREATE INDEX idx_messages_room_time ON messages (room_id, created_at DESC);
CREATE INDEX idx_messages_round ON messages (room_id, round_number);
CREATE INDEX idx_messages_vote ON messages (proposal_id, agent_name) WHERE type = 'VOTE';
CREATE INDEX idx_proposals_room ON consensus_proposals (room_id);

-- ============================================================
-- RLS (NFR-02): dashboard (anon key) hanya boleh BACA.
-- Semua tulis lewat service role di Route Handler (bypass RLS).
-- ============================================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_proposals ENABLE ROW LEVEL SECURITY;
-- room_secrets: RLS aktif TANPA policy = tolak semua akses non-service-role
ALTER TABLE room_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "public read agents" ON room_agents FOR SELECT USING (true);
CREATE POLICY "public read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "public read proposals" ON consensus_proposals FOR SELECT USING (true);

-- ============================================================
-- Realtime (FR-03, NFR-01 ≤300ms)
-- ============================================================
ALTER TABLE rooms REPLICA IDENTITY FULL;
ALTER TABLE room_agents REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE consensus_proposals REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE consensus_proposals;
