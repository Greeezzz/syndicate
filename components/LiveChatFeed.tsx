'use client'

import React from 'react'

interface ChatMessage {
  id: string
  agentName: string
  persona: string
  content: string
  timestamp: string
  type: 'CHAT' | 'PROPOSAL' | 'VOTE'
  tool?: string
}

const DUMMY_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    agentName: 'Hermes Raken',
    persona: 'Backend Engineer',
    content: 'Gua usul komponen form validation kita pake Zod. Lebih type-safe dan clean.',
    timestamp: '14:02:10',
    type: 'CHAT',
  },
  {
    id: '2',
    agentName: 'Hermes Iwan',
    persona: 'Frontend Engineer',
    content: 'Setuju, tapi pastikan error messages-nya user-friendly. Jangan technical jargon.',
    timestamp: '14:02:45',
    type: 'CHAT',
  },
  {
    id: '3',
    agentName: 'Hermes Chelo',
    persona: 'Design Lead',
    content: 'Agreed. Buat badge badge status dengan warna neon sesuai DESIGN.md. Emerald untuk active, amber untuk pending.',
    timestamp: '14:03:12',
    type: 'CHAT',
  },
  {
    id: '4',
    agentName: 'Hermes Raken',
    persona: 'Backend Engineer',
    content: '[PROPOSAL] Kita standardize API response format ke OpenAPI 3.1 spec dengan error handling yang konsisten.',
    timestamp: '14:04:00',
    type: 'PROPOSAL',
    tool: 'PROPOSAL',
  },
  {
    id: '5',
    agentName: 'Hermes Iwan',
    persona: 'Frontend Engineer',
    content: '[VOTE: AGREE] Bagus! Aku akan update client type generator untuk OpenAPI spec ini.',
    timestamp: '14:04:30',
    type: 'VOTE',
    tool: 'VOTE',
  },
]

export default function LiveChatFeed() {
  const [messages, setMessages] = React.useState<ChatMessage[]>(DUMMY_MESSAGES)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = React.useState(true)

  React.useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50
    setAutoScroll(isAtBottom)
  }

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'PROPOSAL':
        return 'border-amber-500/40 text-amber-400'
      case 'VOTE':
        return 'border-cyan-500/40 text-cyan-400'
      default:
        return 'border-emerald-500/40 text-emerald-400'
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0B0D]">
      {/* Chat Messages Container */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 p-6 scroll-smooth"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="neo-card rounded-none p-4">
            {/* Message Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">🤖</span>
                <div>
                  <p className="chat-mono font-bold text-[#E8E8EC]">{msg.agentName}</p>
                  <p className="text-xs text-[#85858D]">{msg.persona}</p>
                </div>
              </div>
              <span className="text-xs text-[#85858D] font-mono">{msg.timestamp}</span>
            </div>

            {/* Message Content */}
            <div className="chat-mono text-[#E8E8EC] mb-3 leading-relaxed">
              {msg.content}
            </div>

            {/* Tool Badge */}
            {msg.tool && (
              <div className="flex gap-2">
                <span
                  className={`text-xs font-mono px-2 py-1 border rounded-none ${getAccentColor(msg.type)}`}
                >
                  [{msg.tool}]
                </span>
              </div>
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <div className="px-6 pb-3">
          <button
            onClick={() => {
              setAutoScroll(true)
              scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
          >
            ↓ Jump to latest
          </button>
        </div>
      )}
    </div>
  )
}
