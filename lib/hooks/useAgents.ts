'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export type Agent = {
  id: string
  room_id: string
  agent_name: string
  persona: string
  status: string
  created_at: string
}

export const useAgents = (roomId: string | null) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    const fetchAgents = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('room_agents')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })

        if (error) throw error
        setAgents(data || [])
      } catch (error) {
        console.error('Error fetching agents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()

    // Subscribe to agent status updates
    const channel = supabase
      .channel(`agents_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_agents',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setAgents((prev) =>
            prev.map((agent) =>
              agent.id === payload.new.id ? (payload.new as Agent) : agent
            )
          )
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId])

  return { agents, loading }
}
