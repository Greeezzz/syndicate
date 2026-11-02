'use client'

import { use, useState } from 'react'
import { useRoom } from '@/lib/hooks/useRoom'
import { useAgents } from '@/lib/hooks/useAgents'
import { useMessages } from '@/lib/hooks/useMessages'
import LiveChatFeed from '@/components/LiveChatFeed'
import { AgentSidebar } from '@/components/AgentSidebar'
import { HeaderConsensus } from '@/components/HeaderConsensus'
import { ProposalModal } from '@/components/ProposalModal'

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { room, loading: roomLoading } = useRoom(id)
  const { agents, loading: agentsLoading } = useAgents(id)
  const { messages } = useMessages(id)
  const [showProposal, setShowProposal] = useState(false)

  // ponytail: fetch proposal dari consensus_proposals saat ada PROPOSAL message
  const latestProposal = messages.find((m) => m.type === 'PROPOSAL')
  const proposalData = latestProposal
    ? {
        proposedBy: latestProposal.agent_name,
        summaryContent: latestProposal.content,
        agreeVotes: 0, // fetch dari consensus_proposals
        totalAgents: agents.length,
        isApproved: room?.status === 'COMPLETED',
      }
    : null

  const votedAgents = agents.filter((a) => a.status === 'VOTED').length

  if (roomLoading || agentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-syndicate-muted">Loading war room...</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-syndicate-muted">Room not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderConsensus
        topic={room.topic}
        status={room.status}
        totalAgents={agents.length}
        votedAgents={votedAgents}
        currentRound={room.current_round}
        maxRounds={room.max_rounds}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <LiveChatFeed roomId={id} />
        </div>

        <div className="w-80 border-l border-syndicate-border p-4 overflow-y-auto">
          <AgentSidebar
            agents={agents.map((a) => ({
              id: a.id,
              name: a.agent_name,
              persona: a.persona,
              status: a.status as 'IDLE' | 'THINKING' | 'VOTED',
            }))}
            roomApiKey={room.api_key}
          />
        </div>
      </div>

      {proposalData && (
        <ProposalModal
          isOpen={showProposal}
          onClose={() => setShowProposal(false)}
          proposal={proposalData}
        />
      )}
    </div>
  )
}
