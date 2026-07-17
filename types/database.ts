/**
 * Database type definitions mirroring the Supabase PostgreSQL schema.
 * These are used to type the Supabase client and all query results.
 * Update these when you run schema migrations.
 *
 * Note: Each table requires a `Relationships` key (even if empty) for
 * @supabase/supabase-js v2 and @supabase/ssr to resolve insert/update types
 * correctly. Without it the client falls back to `never[]` for .insert().
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      income: {
        Row: {
          id: string
          user_id: string
          amount: number
          label: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          label?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          label?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      budget_nodes: {
        Row: {
          id: string
          user_id: string
          title: string
          parent_id: string | null
          allocated_amount: number
          color: string | null
          icon: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          parent_id?: string | null
          allocated_amount: number
          color?: string | null
          icon?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          parent_id?: string | null
          allocated_amount?: number
          color?: string | null
          icon?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          budget_node_id: string | null
          title: string
          amount: number
          note: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          budget_node_id?: string | null
          title: string
          amount: number
          note?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          budget_node_id?: string | null
          title?: string
          amount?: number
          note?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          id: string
          author_id: string
          content: string
          label: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          label?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          label?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      community_votes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          vote: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          vote: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          vote?: number
          created_at?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          parent_comment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          parent_comment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          parent_comment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // ── Chat Messages ─────────────────────────────────────────────────────
      chat_messages: {
        Row: {
          id: string
          session_id: string
          room_id: string
          sender_id: string
          content: string
          read_at: string | null
          attachment_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          room_id: string
          sender_id: string
          content: string
          read_at?: string | null
          attachment_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          room_id?: string
          sender_id?: string
          content?: string
          read_at?: string | null
          attachment_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      // ── Expert Consultation ────────────────────────────────────────────────
      expert_profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          specializations: string[]
          fee_per_session: number
          currency: string
          years_experience: number
          is_verified: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          specializations?: string[]
          fee_per_session?: number
          currency?: string
          years_experience?: number
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          specializations?: string[]
          fee_per_session?: number
          currency?: string
          years_experience?: number
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expert_availability: {
        Row: {
          id: string
          expert_id: string
          slot_start: string
          duration_minutes: number
          is_booked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          expert_id: string
          slot_start: string
          duration_minutes?: number
          is_booked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          expert_id?: string
          slot_start?: string
          duration_minutes?: number
          is_booked?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          expert_id: string
          availability_id: string
          slot_start: string
          duration_minutes: number
          booking_status: 'confirmed' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expert_id: string
          availability_id: string
          slot_start: string
          duration_minutes?: number
          booking_status?: 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expert_id?: string
          availability_id?: string
          slot_start?: string
          duration_minutes?: number
          booking_status?: 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultation_sessions: {
        Row: {
          id: string
          appointment_id: string
          session_type: 'chat' | 'video'
          status: 'waiting' | 'active' | 'ended'
          room_id: string
          provider_name: string | null
          started_at: string | null
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          session_type: 'chat' | 'video'
          status?: 'waiting' | 'active' | 'ended'
          room_id: string
          provider_name?: string | null
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          session_type?: 'chat' | 'video'
          status?: 'waiting' | 'active' | 'ended'
          room_id?: string
          provider_name?: string | null
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultation_reviews: {
        Row: {
          id: string
          appointment_id: string
          expert_id: string
          reviewer_id: string
          rating: number
          review_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          expert_id: string
          reviewer_id: string
          rating: number
          review_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          expert_id?: string
          reviewer_id?: string
          rating?: number
          review_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      booking_status_enum: 'confirmed' | 'completed' | 'cancelled'
      session_type_enum: 'chat' | 'video'
      session_status_enum: 'waiting' | 'active' | 'ended'
    }
  }
}
