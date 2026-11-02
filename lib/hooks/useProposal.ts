'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export type Proposal = {
  id: string
  room_id: string
  proposed_by: string
  summary_content: string
  agree_votes: number
  is_approved: boolean
  created_at: string
}

export const useProposal = (roomId: string | null) => {
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    const fetchProposal = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('consensus_proposals')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error
        setProposal(data)
      } catch (error) {
        console.error('Error fetching proposal:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()

    // Subscribe to proposal updates
    const channel = supabase
      .channel(`proposal_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consensus_proposals',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setProposal(payload.new as Proposal)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return { proposal, loading }
}
