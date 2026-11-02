'use client'

import LiveChatFeed from '@/components/LiveChatFeed'

export default function WarRoomPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0D] flex flex-col">
      {/* HEADER */}
      <header className="border-b border-[#45454D] bg-[#0B0B0D] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E8E8EC] font-mono">SYNDICATE</h1>
            <p className="text-xs text-[#85858D] font-mono mt-1">Topik: API Response Standardization</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-[#E8E8EC] font-mono">Status: <span className="text-emerald-400">RUNNING</span></p>
              <p className="text-xs text-[#85858D] font-mono">Ronde: 2/5</p>
            </div>
            <div className="w-32 h-2 bg-[#202024] border border-[#45454D]">
              <div className="h-full w-2/5 bg-emerald-500"></div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* CHAT FEED - Main Area */}
        <div className="flex-1 flex flex-col border-r border-[#45454D]">
          <LiveChatFeed />
        </div>

        {/* SIDEBAR - Agent Monitor */}
        <aside className="w-64 border-l border-[#45454D] bg-[#0B0B0D] p-4 overflow-y-auto">
          <h2 className="text-sm font-mono font-bold text-[#E8E8EC] mb-4 uppercase">Agent Monitor</h2>
          
          <div className="space-y-3">
            {/* Agent 1 - Thinking */}
            <div className="neo-card rounded-none p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-bold text-[#E8E8EC]">🤖 Raken</span>
                <span className="text-xs text-[#85858D]">BE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-xs text-emerald-400 font-mono">Thinking...</span>
              </div>
            </div>

            {/* Agent 2 - Idle */}
            <div className="neo-card rounded-none p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-bold text-[#E8E8EC]">🤖 Iwan</span>
                <span className="text-xs text-[#85858D]">FE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#45454D]"></div>
                <span className="text-xs text-[#85858D] font-mono">Idle</span>
              </div>
            </div>

            {/* Agent 3 - Voted */}
            <div className="neo-card rounded-none p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-bold text-[#E8E8EC]">🤖 Chelo</span>
                <span className="text-xs text-[#85858D]">Design</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                <span className="text-xs text-cyan-400 font-mono">Voted</span>
              </div>
            </div>
          </div>

          <hr className="border-[#45454D] my-4" />

          {/* Consensus Progress */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-[#E8E8EC] uppercase">Consensus</h3>
            <div className="neo-card rounded-none p-3">
              <p className="text-xs text-[#85858D] font-mono mb-2">Proposal: API Standardization</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400">2 Agree</span>
                  <span className="text-[#85858D]">1 Pending</span>
                </div>
                <div className="h-1.5 bg-[#202024] border border-[#45454D]">
                  <div className="h-full w-2/3 bg-amber-500"></div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-[#45454D] my-4" />

          {/* API Key Copy */}
          <div className="space-y-2">
            <p className="text-xs font-mono text-[#85858D]">Room API Key</p>
            <button className="w-full neo-card rounded-none p-2 text-xs font-mono text-cyan-400 hover:bg-cyan-400/10 transition">
              🔑 Copy Key
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}
