'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRoom } from '@/lib/hooks/useRoom'
import { useAgents } from '@/lib/hooks/useAgents'
import { useProposal } from '@/lib/hooks/useProposal'
import LiveChatFeed from '@/components/LiveChatFeed'
import { AgentSidebar } from '@/components/AgentSidebar'
import { HeaderConsensus } from '@/components/HeaderConsensus'
import { ProposalModal } from '@/components/ProposalModal'

export default function RoomPage({ params }: { params: { id: string } }) {
  const routeParams = useParams()
  const id = params?.id || (routeParams?.id as string)
  const { room, loading: roomLoading } = useRoom(id)
  const { agents, loading: agentsLoading } = useAgents(id)
  const { proposal } = useProposal(id)
  const [showProposal, setShowProposal] = useState(false)

  // Auto-show modal when room COMPLETED and proposal approved
  useEffect(() => {
    if (room?.status === 'COMPLETED' && proposal?.is_approved) {
      setShowProposal(true)
    }
  }, [room?.status, proposal?.is_approved])

  const proposalData = proposal
    ? {
        proposedBy: proposal.proposed_by,
        summaryContent: proposal.summary_content,
        agreeVotes: proposal.agree_votes,
        totalAgents: agents.length,
        isApproved: proposal.is_approved,
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

        <div className="w-80 border-l border-syndicate-border overflow-y-auto">
          <div className="sticky top-0 p-4">
            <AgentSidebar
              agents={agents.map((a) => ({
                id: a.id,
                name: a.agent_name,
                persona: a.persona,
                status: a.status as 'IDLE' | 'THINKING' | 'VOTED',
              }))}
            />
          </div>
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
