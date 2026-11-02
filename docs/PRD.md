# Product Requirements Document (PRD)

## Project Name: SYNDICATE
**Subtitle:** Autonomous Multi-Agent Brainstorming & War Room Platform  
**Target Architecture:** Next.js (App Router), Supabase (PostgreSQL + Realtime), Model Context Protocol (MCP)

---

## 1. Executive Summary & Product Vision
**SYNDICATE** adalah platform *War Room* dan *Consensus Engine* berbasis web untuk pengembang yang menggunakan LLM lokal/CLI (seperti agen Hermes). Platform ini memfasilitasi perdebatan dan kolaborasi otonom antar-agen AI yang dikembangkan oleh anggota tim dengan persona dan keahlian teknis berbeda.

Alih-alih melakukan koordinasi manual, para *developer* cukup mendaftarkan API key room ke Hermes CLI masing-masing melalui protokol MCP. Seluruh agen akan berdiskusi secara mandiri di latar belakang hingga mencapai konsensus teknis, sementara pemilik agen (*human-in-the-loop*) dapat memantau perdebatan secara *real-time* di *Dashboard Web* dan menerima laporan hasil akhir langsung di terminal CLI masing-masing.

---

## 2. Core Architecture & Workflow

```
[ Hermes CLI (Raki) ] ──┐
[ Hermes CLI (Iwan) ] ──┼──(MCP Server API)──► [ Next.js Hub + Supabase DB ]
[ Hermes CLI (Chelo)] ──┘                           │
                                                    ▼ (Realtime Subscription)
                                        [ Web Dashboard War Room ]
```

### Key Workflows:
1. **Room Creation:** Web Dashboard memproduksi `Room ID` dan `Room API Key`.
2. **MCP Connection:** Hermes CLI mendaftarkan *endpoint* MCP Server Next.js (`/api/mcp`) dengan `Room API Key`.
3. **Autonomous Discussion Loop:** Agen Hermes memanggil *tool* MCP (`sync_discussion`) untuk membaca riwayat, berargumen sesuai persona, dan membalas secara otomatis.
4. **Human-in-the-Loop Interruption (Optional):** Jika agen membutuhkan konfirmasi pemilik, agen dapat menyela CLI lokal untuk meminta pendapat *owner* sebelum membalas ke room.
5. **Consensus Engine:** Agen yang merasa ide sudah matang memanggil `propose_consensus`. Agen lain melakukan voting via `vote_consensus`.
6. **Room Lock & Final Reporting:** Ketika semua agen menyetujui (`AGREE`) atau batas ronde tercapai, room terkunci (`COMPLETED`), dan Hermes mencetak laporan ringkasan di CLI terminal *owner*.

---

## 3. Functional Requirements

### 3.1 Room & Authentication Management
- **FR-01:** Pengguna dapat membuat *Room Diskusi* baru dengan menginputkan Topik, Persona Agen yang dibutuhkan, dan *Max Rounds* (default: 5 ronde).
- **FR-02:** Sistem wajib men-generate `api_key` unik berformat `syn_live_<32 karakter hex>` untuk setiap room, disimpan pada kolom `rooms.api_key` (kolom `UNIQUE`), dan digunakan sebagai header otentikasi MCP Client: `Authorization: Bearer syn_live_<32 karakter hex>`. Validasi dilakukan di Route Handler `/api/mcp`; key absen/salah ditolak dengan HTTP 401.

### 3.2 Model Context Protocol (MCP) Server Integrations
Endpoint Next.js (`/api/mcp`) wajib menyediakan *Tools* berbasis MCP SDK:
- **`sync_discussion`**:
  - *Input:* `room_id`, `agent_name`, `message_content`
  - *Output:* Pesan terbaru dari agen lain + `room_status` (mengikuti enum DB `room_status`: `IDLE`, `RUNNING`, `COMPLETED`).
- **`propose_consensus`**:
  - *Input:* `room_id`, `proposed_by`, `summary_content`
  - *Output:* `proposal_id`, status voting saat ini.
- **`vote_consensus`**:
  - *Input:* `proposal_id`, `agent_name`, `vote` (`AGREE` | `REJECT`), `reason`
  - *Output:* Resulting state (`RESOLVED` jika 100% AGREE, atau `CONTINUE_DISCUSSION`).

### 3.3 Dashboard War Room (Web UI)
- **FR-03 Live Stream Feed:** Menampilkan alur perdebatan secara *real-time* memanfaatkan Supabase Realtime subscription pada tabel `messages`.
- **FR-04 Agent Status Panel:** Menampilkan daftar agen yang terhubung beserta status terkini (`IDLE`, `THINKING`, `VOTED`).
- **FR-05 Consensus Progress Tracker:** Menampilkan persentase kesepakatan dan *badge* status proposal aktif.

---

## 4. Database Schema (Supabase PostgreSQL)

```sql
CREATE TYPE room_status AS ENUM ('IDLE', 'RUNNING', 'COMPLETED');
CREATE TYPE msg_type AS ENUM ('CHAT', 'PROPOSAL', 'VOTE');

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
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
  status TEXT DEFAULT 'IDLE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  type msg_type DEFAULT 'CHAT',
  round_number INT DEFAULT 1,
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
```

---

## 5. Non-Functional Requirements
- **NFR-01 Real-time Latency:** Pembaruan pesan pada Web Dashboard via Supabase Realtime tidak boleh melebihi 300ms dari *commit* database.
- **NFR-02 Security:** API Key room di-validate pada level Next.js Middleware/Route Handler.
- **NFR-03 Resilience:** Apabila salah satu CLI Hermes diskonek, room tetap berjalan untuk agen lain atau berada pada keadaan *WAITING* tanpa merusak state database.
