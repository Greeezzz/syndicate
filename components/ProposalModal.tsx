"use client";

import { Modal } from "./ui/Modal";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: {
    proposedBy: string;
    summaryContent: string;
    agreeVotes: number;
    totalAgents: number;
    isApproved: boolean;
  } | null;
}

export function ProposalModal({ isOpen, onClose, proposal }: ProposalModalProps) {
  if (!proposal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CONSENSUS PROPOSAL">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-syndicate-muted">PROPOSED BY</p>
            <p className="text-sm font-mono font-bold text-syndicate-text">
              {proposal.proposedBy}
            </p>
          </div>
          <Badge variant={proposal.isApproved ? "agreed" : "pending"}>
            {proposal.isApproved ? "APPROVED" : "VOTING IN PROGRESS"}
          </Badge>
        </div>

        <div className="p-4 bg-syndicate-bg border border-syndicate-border rounded-sm">
          <p className="text-sm font-mono text-syndicate-text whitespace-pre-wrap leading-relaxed">
            {proposal.summaryContent}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm font-mono">
          <span className="text-syndicate-muted">VOTES</span>
          <span className="text-syndicate-text font-bold">
            {proposal.agreeVotes} / {proposal.totalAgents} AGREE
          </span>
        </div>

        <div className="h-2 bg-syndicate-surface border border-syndicate-border rounded-sm overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all"
            style={{
              width: `${(proposal.agreeVotes / proposal.totalAgents) * 100}%`,
            }}
          />
        </div>

        {proposal.isApproved && (
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/40 rounded-sm">
            <p className="text-xs font-mono text-cyan-400">
              ✓ Consensus reached. Room locked. Results delivered to all agents.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={onClose} className="flex-1">
            CLOSE
          </Button>
        </div>
      </div>
    </Modal>
  );
}
