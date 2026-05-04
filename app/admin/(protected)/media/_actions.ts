'use server'

import { revalidatePath } from 'next/cache'
import { getStorageProvider } from '@/lib/storage'

export async function deleteMediaFile(bucket: string, path: string) {
  const storage = getStorageProvider()
  await storage.deleteObject(bucket, path)
  revalidatePath('/admin/media')
}
