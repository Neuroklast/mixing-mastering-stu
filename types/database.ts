export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
        Update: {
          id?: string
          created_at?: string
          client_name?: string
          client_email?: string
          service_type?: 'mixing' | 'mastering' | 'mixing_mastering'
          package_tier?: 'starter' | 'professional' | 'premium'
          status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled'
          notes?: string | null
          total_price?: number
        }
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
        Update: {
          id?: string
          created_at?: string
          order_id?: string
          filename?: string
          storage_path?: string
          public_url?: string
          file_size_bytes?: number
          mime_type?: 'audio/wav' | 'audio/mpeg'
          type?: 'original' | 'mixed' | 'mastered'
        }
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
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          price_cents?: number
          currency?: string
          product_type?: 'vst_plugin' | 'sample_pack' | 'preset_bank'
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          is_active?: boolean
          download_url?: string | null
          license_type?: 'single' | 'commercial' | 'unlimited'
        }
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
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          product_id?: string
          order_reference?: string
          license_key?: string
          activated_at?: string | null
          expires_at?: string | null
          stripe_payment_intent_id?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
