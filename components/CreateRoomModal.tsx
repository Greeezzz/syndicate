"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [topic, setTopic] = useState("");
  const [maxRounds, setMaxRounds] = useState("5");
  const [agents, setAgents] = useState([
    { name: "", persona: "" },
  ]);
  const [loading, setLoading] = useState(false);

  const addAgent = () => {
    setAgents([...agents, { name: "", persona: "" }]);
  };

  const removeAgent = (index: number) => {
    setAgents(agents.filter((_, i) => i !== index));
  };

  const updateAgent = (index: number, field: "name" | "persona", value: string) => {
    const updated = [...agents];
    updated[index][field] = value;
    setAgents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          max_rounds: parseInt(maxRounds),
          agents: agents.filter((a) => a.name && a.persona).map((a) => ({ agent_name: a.name, persona: a.persona })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create room");
      }

      const data = await res.json();
      window.location.href = `/room/${data.room.id}`;
      onClose();
    } catch (err) {
      alert("Error creating room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CREATE WAR ROOM">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="TOPIC"
          placeholder="e.g., Design System Architecture"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />

        <Input
          label="MAX ROUNDS"
          type="number"
          min="1"
          max="20"
          value={maxRounds}
          onChange={(e) => setMaxRounds(e.target.value)}
          required
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-mono text-syndicate-text">
              AGENTS ({agents.length})
            </label>
            <Button type="button" size="sm" variant="secondary" onClick={addAgent}>
              + ADD AGENT
            </Button>
          </div>

          {agents.map((agent, idx) => (
            <div
              key={idx}
              className="p-3 border border-syndicate-border rounded-sm space-y-2"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="neutral">AGENT {idx + 1}</Badge>
                {agents.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAgent(idx)}
                    className="text-xs text-red-400 hover:text-red-300 font-mono"
                  >
                    REMOVE
                  </button>
                )}
              </div>
              <Input
                placeholder="Agent name (e.g., Hermes Raki)"
                value={agent.name}
                onChange={(e) => updateAgent(idx, "name", e.target.value)}
                required
              />
              <Textarea
                placeholder="Persona (e.g., Frontend Engineer - React/Tailwind expert)"
                value={agent.persona}
                onChange={(e) => updateAgent(idx, "persona", e.target.value)}
                rows={2}
                required
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "CREATING..." : "CREATE ROOM"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            CANCEL
          </Button>
        </div>
      </form>
    </Modal>
  );
}
