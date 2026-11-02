import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Message = {
  id: string
  room_id: string
  agent_name: string
  content: string
  type: 'CHAT' | 'PROPOSAL' | 'VOTE'
  round_number: number
  created_at: string
}

export type Room = {
  id: string
  topic: string
  status: 'IDLE' | 'RUNNING' | 'COMPLETED'
  max_rounds: number
  current_round: number
  created_at: string
}
