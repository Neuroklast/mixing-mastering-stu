export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          created_at: string
          client_name: string
          client_email: string
          service_type: 'mixing' | 'mastering' | 'mixing_mastering'
          package_tier: 'starter' | 'professional' | 'premium'
          status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
          notes: string | null
          total_price: number
        }
        Insert: {
          id?: string
          created_at?: string
          client_name: string
          client_email: string
          service_type: 'mixing' | 'mastering' | 'mixing_mastering'
          package_tier: 'starter' | 'professional' | 'premium'
          status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
          notes?: string | null
          total_price?: number
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: []
      }
      files: {
        Row: {
          id: string
          created_at: string
          order_id: string
          filename: string
          storage_path: string
          public_url: string
          file_size_bytes: number
          mime_type: 'audio/wav' | 'audio/mpeg'
          type: 'original' | 'mixed' | 'mastered'
        }
        Insert: {
          id?: string
          created_at?: string
          order_id: string
          filename: string
          storage_path: string
          public_url: string
          file_size_bytes: number
          mime_type: 'audio/wav' | 'audio/mpeg'
          type?: 'original' | 'mixed' | 'mastered'
        }
        Update: Partial<Database['public']['Tables']['files']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'files_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          price_cents: number
          currency: string
          product_type: 'vst_plugin' | 'sample_pack' | 'preset_bank'
          stripe_product_id: string | null
          stripe_price_id: string | null
          is_active: boolean
          download_url: string | null
          license_type: 'single' | 'commercial' | 'unlimited'
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          price_cents: number
          currency?: string
          product_type: 'vst_plugin' | 'sample_pack' | 'preset_bank'
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          is_active?: boolean
          download_url?: string | null
          license_type?: 'single' | 'commercial' | 'unlimited'
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }
      licenses: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          product_id: string
          order_reference: string
          license_key: string
          activated_at: string | null
          expires_at: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          product_id: string
          order_reference: string
          license_key?: string
          activated_at?: string | null
          expires_at?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['licenses']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'licenses_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
