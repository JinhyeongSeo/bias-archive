export type Database = {
  public: {
    Tables: {
      biases: {
        Row: {
          id: string
          name: string
          name_en: string | null
          name_ko: string | null
          group_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_en?: string | null
          name_ko?: string | null
          group_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_en?: string | null
          name_ko?: string | null
          group_name?: string | null
          updated_at?: string
        }
        Relationships: []
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
          author_name: string | null
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
          author_name?: string | null
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
          author_name?: string | null
          bias_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'links_bias_id_fkey'
            columns: ['bias_id']
            isOneToOne: false
            referencedRelation: 'biases'
            referencedColumns: ['id']
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: 'link_tags_link_id_fkey'
            columns: ['link_id']
            isOneToOne: false
            referencedRelation: 'links'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'link_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          }
        ]
      }
      link_media: {
        Row: {
          id: string
          link_id: string
          media_url: string
          media_type: 'image' | 'video' | 'gif'
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          link_id: string
          media_url: string
          media_type: 'image' | 'video' | 'gif'
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          link_id?: string
          media_url?: string
          media_type?: 'image' | 'video' | 'gif'
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: 'link_media_link_id_fkey'
            columns: ['link_id']
            isOneToOne: false
            referencedRelation: 'links'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Bias = Database['public']['Tables']['biases']['Row']
export type Link = Database['public']['Tables']['links']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type LinkTag = Database['public']['Tables']['link_tags']['Row']
export type LinkMedia = Database['public']['Tables']['link_media']['Row']

// Insert types
export type BiasInsert = Database['public']['Tables']['biases']['Insert']
export type LinkInsert = Database['public']['Tables']['links']['Insert']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type LinkTagInsert = Database['public']['Tables']['link_tags']['Insert']
export type LinkMediaInsert = Database['public']['Tables']['link_media']['Insert']

// Update types
export type BiasUpdate = Database['public']['Tables']['biases']['Update']
export type LinkUpdate = Database['public']['Tables']['links']['Update']
export type TagUpdate = Database['public']['Tables']['tags']['Update']
export type LinkTagUpdate = Database['public']['Tables']['link_tags']['Update']
export type LinkMediaUpdate = Database['public']['Tables']['link_media']['Update']

// Composite types
export type LinkWithMedia = Link & { media: LinkMedia[] }
