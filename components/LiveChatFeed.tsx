'use client'

import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useMessages } from '@/lib/hooks/useMessages'
import type { Message } from '@/lib/supabase/client'

interface LiveChatFeedProps {
  roomId: string
}

// Agent configuration with POV
const AGENTS = {
  Rover: { initial: 'R', tag: 'ARCH', role: 'System Architect', isMe: true },
  Noelle: { initial: 'N', tag: 'LEAD', role: 'Lead Coordinator', isMe: false },
  Diablo: { initial: 'D', tag: 'FE', role: 'Frontend Engineer', isMe: false },
}

export default function LiveChatFeed({ roomId }: LiveChatFeedProps) {
  const { messages, loading } = useMessages(roomId)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = React.useState(true)
  const [shouldScroll, setShouldScroll] = React.useState(false)

  // Calculate voting progress
  const votingStats = React.useMemo(() => {
    const votes = messages.filter((m) => m.type === 'VOTE')
    const proposals = messages.filter((m) => m.type === 'PROPOSAL')
    const agrees = votes.filter((v) => v.content.includes('AGREE')).length
    const disagrees = votes.filter((v) => v.content.includes('DISAGREE')).length
    
    return {
      hasProposal: proposals.length > 0,
      lastProposal: proposals[proposals.length - 1] || null,
      agrees,
      disagrees,
      total: votes.length,
      consensus: agrees > 0 && disagrees === 0 ? 'AGREE' : disagrees > 0 && agrees === 0 ? 'DISAGREE' : null,
    }
  }, [messages])

  // Smart auto-scroll
  useEffect(() => {
    if (shouldScroll && autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      setShouldScroll(false)
    }
  }, [messages, autoScroll, shouldScroll])

  useEffect(() => {
    setShouldScroll(true)
  }, [messages.length])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
    setAutoScroll(isAtBottom)
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getAgentConfig = (agentName: string) => {
    return AGENTS[agentName as keyof typeof AGENTS] || { initial: agentName[0], tag: 'AGT', role: 'Agent', isMe: false }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#85858D] font-mono text-xs uppercase tracking-wider">Mengambil pesan...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden bg-[#0B0B0D]">
      {/* Chat Messages Container */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-[18px] scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#45454D transparent' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#85858D] text-center font-mono text-sm">Belum ada pesan. Tunggu agen mulai diskusi...</p>
          </div>
        ) : (
          messages.map((msg: Message) => {
            const agent = getAgentConfig(msg.agent_name)
            const isMe = agent.isMe

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-[6px] w-fit max-w-[min(780px,88%)] animate-[sent_0.25s_ease-out] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                {/* Agent Info */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-[26px] h-[26px] flex items-center justify-center border border-[#45454D] bg-[#0B0B0D] font-mono text-xs font-bold text-[#E8E8EC]"
                    aria-hidden="true"
                  >
                    {agent.initial}
                  </div>
                  <span className="font-mono text-sm font-bold text-[#E8E8EC]">{msg.agent_name}</span>
                  <span className="font-mono text-[10px] font-medium tracking-wider border border-[#45454D] px-[6px] py-[1px] text-[#9D9DA6]">
                    {agent.tag}
                  </span>
                </div>

                {/* Bubble */}
                <div
                  className={`relative min-w-[min(260px,100%)] max-w-full ${
                    isMe
                      ? 'bg-[#1E2F2D] border-[#1A6B50] rounded-[18px_0_18px_18px]'
                      : 'bg-[#202024] border-[#45454D] rounded-[0_18px_18px_18px]'
                  } border px-4 pt-3 pb-2`}
                >
                  {/* Tail triangle */}
                  <div
                    className={`absolute w-0 h-0 border-solid border-transparent ${
                      isMe
                        ? 'right-[-10px] top-[-1px] border-t-[11px] border-t-[#1A6B50] border-r-[10px]'
                        : 'left-[-10px] top-[-1px] border-t-[11px] border-t-[#45454D] border-l-[10px]'
                    }`}
                  />
                  <div
                    className={`absolute w-0 h-0 border-solid border-transparent ${
                      isMe
                        ? 'right-[-9px] top-0 border-t-[10px] border-t-[#1E2F2D] border-r-[10px]'
                        : 'left-[-9px] top-0 border-t-[10px] border-t-[#202024] border-l-[10px]'
                    }`}
                  />

                  {/* Badge Tags */}
                  {(msg.type === 'PROPOSAL' || msg.type === 'VOTE') && (
                    <div className="flex gap-[6px] flex-wrap mb-[10px]">
                      {msg.type === 'PROPOSAL' && (
                        <span className="text-[11px] font-mono font-medium tracking-wider uppercase px-[9px] py-[3px] border border-amber-500/60 bg-amber-500/10 text-amber-400 whitespace-nowrap proposal-glow">
                          [PROPOSAL]
                        </span>
                      )}
                      {msg.type === 'VOTE' && (
                        <span
                          className={`text-[11px] font-mono font-medium tracking-wider uppercase px-[9px] py-[3px] border whitespace-nowrap badge-pulse ${
                            msg.content.includes('AGREE')
                              ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400'
                              : 'border-red-500/60 bg-red-500/10 text-red-400'
                          }`}
                        >
                          {msg.content.includes('AGREE') ? '[VOTE: AGREE]' : '[VOTE: DISAGREE]'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="font-mono text-sm leading-[1.8] text-[#E8E8EC]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-3 overflow-wrap-anywhere" {...props} />,
                        code: ({ node, className, children, ...props }) => {
                          const isBlock = /language-/.test(className ?? '')
                          return isBlock ? (
                            <div className="relative rounded-[10px] bg-[#0B0B0D] border border-[#45454D] px-[14px] py-3 overflow-x-auto font-mono text-xs leading-[1.7] text-[#E8E8EC] mb-3">
                              <pre className="whitespace-pre">
                                <code>{children}</code>
                              </pre>
                              <span className="absolute top-0 right-0 px-2 py-[2px] border-l border-b border-[#45454D] font-mono text-[10px] font-medium tracking-widest text-[#9D9DA6]">
                                CODE
                              </span>
                            </div>
                          ) : (
                            <code
                              className="rounded-[5px] bg-[#0B0B0D] border border-[#45454D] px-[5px] py-0 font-mono text-xs"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-emerald-500 pl-3 text-[#85858D] mb-3" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Footer timestamp */}
                  <div className="mt-2 text-right font-mono text-[11px] font-medium text-[#9D9DA6]">
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Voting Progress Indicator */}
      {votingStats.hasProposal && votingStats.total > 0 && (
        <div className="px-6 py-4 border-t border-[#45454D] bg-[#0B0B0D]/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#85858D] uppercase tracking-widest font-semibold">Consensus Voting</span>
              {votingStats.consensus && (
                <span
                  className={`text-xs font-mono px-2 py-1 ${
                    votingStats.consensus === 'AGREE' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {votingStats.consensus === 'AGREE' ? '✓ KESEPAKATAN' : '✗ PENOLAKAN'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-[3px] bg-[#0B0B0D] border-0 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(votingStats.agrees / Math.max(votingStats.total, 1)) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums min-w-[4ch]">
                {votingStats.agrees}/{votingStats.total}
              </span>
            </div>

            <div className="text-xs font-mono text-[#85858D] grid grid-cols-2 gap-2">
              <div>
                ✓ Setuju: <span className="text-emerald-400">{votingStats.agrees}</span>
              </div>
              <div>
                ✗ Tidak: <span className="text-red-400">{votingStats.disagrees}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-scroll Indicator */}
      {!autoScroll && messages.length > 0 && (
        <div className="px-6 pb-3 pt-2 border-t border-[#45454D]">
          <button
            onClick={() => {
              setAutoScroll(true)
              setShouldScroll(true)
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition uppercase tracking-wider"
          >
            ↓ Jump to latest messages
          </button>
        </div>
      )}
    </div>
  )
}
