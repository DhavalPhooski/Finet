import { createClient } from '@/lib/supabase/client'
import type {
  ConsultationSession,
  ConsultationSessionInsert,
  ConsultationSessionUpdate,
  ChatMessage,
  ChatMessageInsert,
  SessionType,
  ServiceResult,
} from '@/types'

// ════════════════════════════════════════════════════════════
// SESSION
// ════════════════════════════════════════════════════════════

/**
 * Get the consultation session for an appointment, if one exists.
 */
export async function getSession(
  appointmentId: string
): Promise<ServiceResult<ConsultationSession | null>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('consultation_sessions')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

/**
 * Create a new consultation session for an appointment.
 *
 * room_id format:
 *   chat  → "chat:<appointment_id>"  (stable Supabase Realtime channel name)
 *   video → "video:<appointment_id>" (provider room ID — swappable via provider_name)
 *
 * This function is idempotent in spirit: callers should check getSession() first
 * and only call this if no session exists yet.
 */
export async function createSession(
  appointmentId: string,
  sessionType: SessionType,
  providerName?: string
): Promise<ServiceResult<ConsultationSession>> {
  const supabase = createClient()

  const room_id =
    sessionType === 'chat'
      ? `chat:${appointmentId}`
      : `video:${appointmentId}`

  const payload: ConsultationSessionInsert = {
    appointment_id: appointmentId,
    session_type: sessionType,
    status: 'waiting',
    room_id,
    provider_name: providerName ?? null,
  }

  const { data, error } = await supabase
    .from('consultation_sessions')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to create session.' }
  return { data, error: null }
}

/**
 * Mark a session as active (first participant joined).
 */
export async function activateSession(
  sessionId: string
): Promise<ServiceResult<ConsultationSession>> {
  const supabase = createClient()

  const update: ConsultationSessionUpdate = {
    status: 'active',
    started_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('consultation_sessions')
    .update(update)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to activate session.' }
  return { data, error: null }
}

/**
 * Mark a session as ended and flip the appointment to 'completed'.
 * Called when the 60-minute timer runs out or the user manually ends.
 */
export async function endSession(
  sessionId: string,
  appointmentId: string
): Promise<ServiceResult<null>> {
  const supabase = createClient()

  const now = new Date().toISOString()

  // End the session
  const { error: sessionError } = await supabase
    .from('consultation_sessions')
    .update({ status: 'ended', ended_at: now })
    .eq('id', sessionId)

  if (sessionError) return { data: null, error: sessionError.message }

  // Mark the appointment as completed
  const { error: appointmentError } = await supabase
    .from('appointments')
    .update({ booking_status: 'completed' })
    .eq('id', appointmentId)

  if (appointmentError) return { data: null, error: appointmentError.message }

  return { data: null, error: null }
}

// ════════════════════════════════════════════════════════════
// CHAT MESSAGES
// ════════════════════════════════════════════════════════════

/**
 * Fetch the message history for a chat session.
 * Called once on mount — subsequent messages arrive via Realtime subscription.
 */
export async function getChatHistory(
  sessionId: string
): Promise<ServiceResult<ChatMessage[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

/**
 * Send a chat message. The Realtime subscription will deliver it
 * to both participants without needing to re-fetch.
 */
export async function sendChatMessage(
  payload: ChatMessageInsert
): Promise<ServiceResult<ChatMessage>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Failed to send message.' }
  return { data, error: null }
}
