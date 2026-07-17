/**
 * Database type definitions mirroring the Supabase PostgreSQL schema.
 * These are used to type the Supabase client and all query results.
 * Update these when you run schema migrations.
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
      }
      community_votes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          vote: number   // 1 | -1
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
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
