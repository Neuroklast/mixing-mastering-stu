/**
 * Supabase Storage implementation of StorageProvider.
 *
 * Uses the Supabase JavaScript client for all storage operations.
 * This is the default provider when STORAGE_PROVIDER is unset or 'supabase'.
 */

import { createClient } from '@supabase/supabase-js'
import type { StorageObject, StorageProvider } from './types'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export const supabaseStorageProvider: StorageProvider = {
  getPublicUrl(bucket: string, path: string): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
    return `${url}/storage/v1/object/public/${bucket}/${path}`
  },

  async createSignedUploadUrl(
    bucket: string,
    path: string,
  ): Promise<{ signedUrl: string; token: string; path: string }> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)
    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create signed upload URL')
    }
    return data
  },

  async createSignedDownloadUrl(
    bucket: string,
    path: string,
    expiresInSec: number,
  ): Promise<string> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSec)
    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? 'Failed to create signed download URL')
    }
    return data.signedUrl
  },

  async deleteObject(bucket: string, path: string): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw new Error(error.message)
  },

  async listObjects(bucket: string, prefix?: string): Promise<StorageObject[]> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.storage.from(bucket).list(prefix ?? '')
    if (error || !data) throw new Error(error?.message ?? 'Failed to list objects')
    return data.map((item) => ({
      name: item.name,
      size: item.metadata?.size ?? 0,
      lastModified: new Date(item.updated_at ?? item.created_at ?? Date.now()),
      contentType: item.metadata?.mimetype,
    }))
  },
}
