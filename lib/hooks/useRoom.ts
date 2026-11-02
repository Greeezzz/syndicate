'use client'

import { useState, useEffect } from 'react'
import { supabase, type Room } from '@/lib/supabase/client'

export const useRoom = (roomId: string | null) => {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    const fetchRoom = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single()

        if (error) throw error
        setRoom(data)
      } catch (error) {
        console.error('Error fetching room:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()

    // Subscribe to room updates
    const channel = supabase
      .channel(`room_updates_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          setRoom(payload.new as Room)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return { room, loading }
}
