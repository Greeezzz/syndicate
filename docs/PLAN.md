# Project Plan & Task Division (PLAN.md)

## Project Name: SYNDICATE
**Team Composition:** 3 Developers (1 Backend Lead, 2 Frontend Leads)

---

## 1. Team Roles & Responsibilities

| Name | Role | Primary Focus | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **Raken** | Lead Backend Engineer | Database, MCP Engine & Server API | Supabase Schema, RLS, Route Handler `/api/mcp`, MCP Tools Logic, Consensus Engine & API Auth |
| **Chelo** | Lead Frontend Engineer (Core War Room) | Live Feed Stream & Dynamic Dashboard Layout | App Router Layout, Live Chat Feed with Supabase Realtime, Markdown Message Renderer, Auto-scroll Engine |
| **Iwan** | Lead Frontend Engineer (Controls & UI Polish) | Room Creator, Agent Controls & Design Tokens | Landing Page, Room Generator UI, Agent Status Sidebar, Consensus Proposal Modals, API Key Clipboard Copy |

---

## 2. Sprint & Implementation Phases

### Phase 1: Architecture & Foundation (Day 1 - Day 2)
- **Raken (Backend):**
  - Setup proyek Next.js 14+ (App Router) & konfigurasi Supabase Client/Server.
  - Eksekusi `schema.sql` pada Supabase & konfigurasi PubSub Realtime untuk tabel `messages` dan `rooms`.
  - Membuat helper autentikasi API Key middleware untuk request MCP.
- **Chelo (Frontend):**
  - Membuat *base layout* App Router dengan *Dark Neobrutalist Theme* (CSS Variables & Tailwind Config).
  - Mengimplementasikan komponen `LiveChatFeed.tsx` dengan data *dummy*.
- **Iwan (Frontend):**
  - Setup komponen UI Neobrutalist murni (`Button`, `Card`, `Badge`, `Input`).
  - Membuat Landing Page (`app/page.tsx`) dan Modal "Create Room".

### Phase 2: MCP Engine & Real-time Integration (Day 3 - Day 4)
- **Raken (Backend):**
  - Mengembangkan Route Handler MCP di `app/api/mcp/route.ts` menggunakan `@modelcontextprotocol/sdk`.
  - Membuat logika *tools*: `sync_discussion`, `propose_consensus`, dan `vote_consensus` di `lib/mcp/tools.ts`.
  - Menguji *endpoint* menggunakan Postman/Curl dengan Bearer API Key.
- **Chelo (Frontend):**
  - Menghubungkan `LiveChatFeed.tsx` ke Supabase Realtime Channel (`supabase-js`).
  - Integrasi Markdown parsing untuk pesan perdebatan agen (dukungan format kode, list, dan aksen khusus).
  - Implementasi *Smart Auto-scroll Lock* (scroll bawah otomatis saat ada pesan baru kecuali user sedang scroll ke atas).
- **Iwan (Frontend):**
  - Mengembangkan komponen `AgentSidebar.tsx` untuk memantau status Hermes yang aktif (`IDLE`, `THINKING`, `VOTED`).
  - Membuat komponen `HeaderConsensus.tsx` yang menampilkan topik room, status (`RUNNING`/`COMPLETED`), dan progress bar voting.

### Phase 3: Consensus Engine & End-to-End Loop Testing (Day 5)
- **Raken (Backend):**
  - Penyempurnaan logika perhitung voting pada `consensus_proposals`.
  - Otomatisasi penguncian room (`status = 'COMPLETED'`) ketika seluruh agen menyetujui proposal konsensus.
- **Chelo (Frontend):**
  - Menambahkan animasi & visual indicator khusus ketika ada *Proposal Konsensus* diajukan di tengah-tengah percakapan chat.
- **Iwan (Frontend):**
  - Mengembangkan `ProposalModal.tsx` untuk pratinjau hasil kesepakatan akhir saat room berstatus `COMPLETED`.
  - Menambahkan *1-Click Copy Room API Key* dan petunjuk konfigurasi MCP untuk Hermes CLI.

### Phase 4: Polish, Testing & Deployment (Day 6)
- **Seluruh Tim:**
  - Pengujian simulasi 3 agen Hermes CLI berdiskusi secara otonom dari laptop masing-masing.
  - *Refactoring* kode, perbaikan kontras UI Neobrutalist, dan pengecekan kehalusan animasi.