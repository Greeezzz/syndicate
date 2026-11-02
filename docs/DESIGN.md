# Design System & Guidelines (DESIGN.md)

## Project Name: SYNDICATE
**Aesthetic Style:** Developer War Room / Dark Neobrutalist Command Center  
**Design Philosophy:** Kontras tinggi, tegas, presisi teknis, tajam (*sharp corners*), dan mengedepankan legibilitas teks dalam kondisi *dark mode*.

---

## 1. Color Palette & Design Tokens

### Primary Dark Palette
| Token | Hex Code | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Background Main** | `#0B0B0D` | `bg-[#0B0B0D]` | Latar belakang dasar aplikasi |
| **Surface / Card** | `#202024` | `bg-[#202024]` | Kontainer obrolan, sidebar, modal |
| **Border / Divider** | `#45454D` | `border-[#45454D]` | Batas garis tebal komponen (1px–2px solid) |
| **Text Muted / Meta** | `#85858D` | `text-[#85858D]` | Timestamp, ID room, label sekunder |
| **Text Primary** | `#E8E8EC` | `text-[#E8E8EC]` | Teks utama obrolan dan judul panel |

### Neon Status Accents
| State | Hex Code | Tailwind Accent | Application |
| :--- | :--- | :--- | :--- |
| **Active / Thinking** | `#10B981` | `text-emerald-400`, `bg-emerald-500/10` | Indikator agen aktif & pesan masuk |
| **Pending / Voting** | `#F59E0B` | `text-amber-400`, `bg-amber-500/10` | Proposal sedang ditinjau |
| **Consensus Agreed** | `#06B6D4` | `text-cyan-400`, `bg-cyan-500/10` | Room COMPLETED & Konsensus tercapai |
| **Error / Rejected** | `#EF4444` | `text-red-400`, `bg-red-500/10` | Voting ditolak / Error API |

---

## 2. Typography Rules

- **Primary Font:** `Inter`, `Geist Sans`, atau System UI (`sans-serif`). Digunakan untuk teks umum, tombol, dan header.
- **Monospace Font (Utama):** `JetBrains Mono`, `Geist Mono`, atau `Fira Code` (`font-mono`). **Wajib** untuk:
  - Isi percakapan pesan Hermes.
  - Kode blok, API Keys, Room ID, dan status tag.
  - Terminal output dan indikator timestamp.

---

## 3. Component Specs & Neobrutalist Rules

### 3.1 Corners & Borders
- **Strict Square Edge / Subtle Radius:** Gunakan `rounded-none` atau maksimal `rounded-sm` (2px). Dilarang keras menggunakan `rounded-xl` atau `rounded-full` pada kontainer utama.
- **Borders:** Semua kartu (`Card`), modal, dan tombol harus memiliki border tegas `border border-[#45454D]`.

### 3.2 Chat Bubbles (`LiveChatFeed`)
- Background kontainer pesan menggunakan `#202024`.
- Header pesan menampilkan nama agen (Font Mono, Bold), Aksen Persona (FE, BE, Infra), serta timestamp (`#85858D`).
- Tag Tool Call MCP disajikan menggunakan *badge* tegas:
  - `[TOOL: SYNC]` -> `border-emerald-500/40 text-emerald-400`
  - `[PROPOSAL]` -> `border-amber-500/40 text-amber-400`
  - `[VOTE: AGREE]` -> `border-cyan-500/40 text-cyan-400`

### 3.3 Status Badges & Pulse Indicators
- Agen yang sedang berpikir (*Thinking*) wajib menampilkan efek dot pulse neon emerald:
  ```html
  <span class="relative flex h-2 w-2">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
  </span>
  ```

---

## 4. Layout Architecture (War Room Page)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER: [Topik Room] | Status: RUNNING | Progress Consensus: [████░░] 2/3   │
├──────────────────────────────────────────────┬──────────────────────────────┤
│                                              │ SIDEBAR: AGENT MONITOR       │
│ LIVE FEED CHAT STREAM (Scrollable)           │ ┌──────────────────────────┐ │
│                                              │ │ 🤖 Hermes Raki (FE)      │ │
│ ┌──────────────────────────────────────────┐ │ │ Status: Thinking...      │ │
│ │ 🤖 Hermes Raki [FE] • 14:02:10           │ │ └──────────────────────────┘ │
│ │ "Gua usul komponen Tailwind disamakan..."│ │ ┌──────────────────────────┐ │
│ └──────────────────────────────────────────┘ │ │ 🤖 Hermes Iwan (BE)      │ │
│ ┌──────────────────────────────────────────┐ │ │ Status: Idle             │ │
│ │ 🤖 Hermes Iwan [BE] • 14:02:45           │ │ └──────────────────────────┘ │
│ │ "Setuju, tapi pastikan API payload..."   │ │                              │
│ └──────────────────────────────────────────┘ │ [🔑 Copy Room API Key]       │
└──────────────────────────────────────────────┴──────────────────────────────┘
```

---

## 5. Consistency & Quality Control Guidelines
1. **No Soft Gradients:** Hindari penggunaan *soft gradient* warna-warni khas consumer app. Hanya gunakan solid surfaces atau subtle dark opacity overlay.
2. **High Contrast Text:** Teks di atas `#202024` wajib menggunakan `#E8E8EC` agar terbaca sempurna.
3. **Monospace Priority:** Log perdebatan AI wajib dipresentasikan sebagai *code/terminal interface*, bukan obrolan media sosial.