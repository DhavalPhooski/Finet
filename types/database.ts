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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
