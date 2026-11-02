"use client";

import { Badge } from "./ui/Badge";

interface HeaderConsensusProps {
  topic: string;
  status: "IDLE" | "RUNNING" | "COMPLETED";
  totalAgents: number;
  votedAgents: number;
  currentRound: number;
  maxRounds: number;
}

export function HeaderConsensus({
  topic,
  status,
  totalAgents,
  votedAgents,
  currentRound,
  maxRounds,
}: HeaderConsensusProps) {
  const progressPercent = totalAgents > 0 ? (votedAgents / totalAgents) * 100 : 0;

  return (
    <div className="bg-syndicate-surface border-b border-syndicate-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Topic & Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-mono font-bold text-lg text-syndicate-text truncate">
                {topic}
              </h1>
              <Badge
                variant={
                  status === "COMPLETED"
                    ? "agreed"
                    : status === "RUNNING"
                    ? "active"
                    : "neutral"
                }
              >
                {status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-syndicate-muted">
              <span>
                ROUND {currentRound} / {maxRounds}
              </span>
              <span>•</span>
              <span>
                AGENTS: {totalAgents}
              </span>
            </div>
          </div>

          {/* Right: Consensus Progress */}
          <div className="lg:w-80">
            <div className="flex items-center justify-between text-xs font-mono text-syndicate-muted mb-2">
              <span>CONSENSUS PROGRESS</span>
              <span>
                {votedAgents} / {totalAgents}
              </span>
            </div>
            <div className="h-2 bg-syndicate-bg border border-syndicate-border rounded-sm overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
