'use client'

import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useMessages } from '@/lib/hooks/useMessages'
import type { Message } from '@/lib/supabase/client'

interface LiveChatFeedProps {
  roomId: string
}

export default function LiveChatFeed({ roomId }: LiveChatFeedProps) {
  const { messages, loading } = useMessages(roomId)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = React.useState(true)
  const [shouldScroll, setShouldScroll] = React.useState(false)

  // Smart auto-scroll lock
  useEffect(() => {
    if (shouldScroll && autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      setShouldScroll(false)
    }
  }, [messages, autoScroll, shouldScroll])

  // Trigger scroll on new message
  useEffect(() => {
    setShouldScroll(true)
  }, [messages.length])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
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

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#85858D] font-mono">Mengambil pesan...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden bg-[#0B0B0D]">
      {/* Chat Messages Container */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 p-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#85858D] text-center font-mono">Belum ada pesan. Tunggu agen mulai diskusi...</p>
          </div>
        ) : (
          messages.map((msg: Message) => (
            <div key={msg.id} className="neo-card rounded-none p-4">
              {/* Message Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🤖</span>
                  <div>
                    <p className="chat-mono font-bold text-[#E8E8EC]">{msg.agent_name}</p>
                    <p className="text-xs text-[#85858D]">Round {msg.round_number}</p>
                  </div>
                </div>
                <span className="text-xs text-[#85858D] font-mono">{formatTime(msg.created_at)}</span>
              </div>

              {/* Message Content with Markdown */}
              <div className="chat-mono text-[#E8E8EC] mb-3 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                    code: ({ node, className, children, ...props }) => {
                      const isBlock = /language-/.test(className ?? '')
                      return isBlock ? (
                        <code className="block bg-[#202024] p-3 rounded-none border border-[#45454D] overflow-x-auto mb-2" {...props}>{children}</code>
                      ) : (
                        <code className="bg-[#202024] px-2 py-1 rounded-none border border-[#45454D]" {...props}>{children}</code>
                      )
                    },
                    pre: ({ node, ...props }) => <pre className="bg-[#202024]" {...props} />,
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-2 border-emerald-500 pl-3 text-[#85858D]" {...props} />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>

              {/* Type Badge */}
              {msg.type !== 'CHAT' && (
                <div className="flex gap-2">
                  <span
                    className={`text-xs font-mono px-2 py-1 border rounded-none ${getAccentColor(msg.type)}`}
                  >
                    [{msg.type}]
                  </span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Auto-scroll Indicator */}
      {!autoScroll && messages.length > 0 && (
        <div className="px-6 pb-3 border-t border-[#45454D]">
          <button
            onClick={() => setAutoScroll(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition"
          >
            ↓ Jump to latest messages
          </button>
        </div>
      )}
    </div>
  )
}
