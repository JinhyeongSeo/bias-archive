export type Database = {
  public: {
    Tables: {
      biases: {
        Row: {
          id: string
          name: string
          group_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          group_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          group_name?: string | null
          updated_at?: string
        }
      }
      links: {
        Row: {
          id: string
          url: string
          title: string | null
          description: string | null
          thumbnail_url: string | null
          platform: string | null
          original_date: string | null
          bias_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          title?: string | null
          description?: string | null
          thumbnail_url?: string | null
          platform?: string | null
          original_date?: string | null
          bias_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          title?: string | null
          description?: string | null
          thumbnail_url?: string | null
          platform?: string | null
          original_date?: string | null
          bias_id?: string | null
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      link_tags: {
        Row: {
          link_id: string
          tag_id: string
        }
        Insert: {
          link_id: string
          tag_id: string
        }
        Update: {
          link_id?: string
          tag_id?: string
        }
      }
    }
  }
}

// Convenience types
export type Bias = Database['public']['Tables']['biases']['Row']
export type Link = Database['public']['Tables']['links']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type LinkTag = Database['public']['Tables']['link_tags']['Row']
