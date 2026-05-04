'use server'

/**
 * Server actions for Cloudflare R2 S3 Multipart Upload.
 *
 * These actions replace the TUS upload path. All four steps of the S3
 * multipart protocol are exposed as admin-gated server actions so the
 * browser never holds R2 credentials directly.
 *
 * Used by: hooks/useR2MultipartUpload.ts → AudioUploadField.tsx
 */

import { requireAdmin } from '@/app/admin/_actions/auth'
import {
  createMultipartUpload,
  signMultipartPart,
  completeMultipartUpload,
  abortMultipartUpload,
} from '@/lib/storage/r2-multipart'
import type { CompletedPart } from '@/lib/storage/r2-multipart'

const AUDIO_BUCKET = process.env.R2_BUCKET_AUDIO ?? 'sonorativa-audio'

export async function createMultipartUploadAction(
  key: string,
  contentType: string,
): Promise<{ uploadId: string }> {
  await requireAdmin()
  return createMultipartUpload(AUDIO_BUCKET, key, contentType)
}

export async function signMultipartPartAction(
  key: string,
  uploadId: string,
  partNumber: number,
): Promise<{ signedUrl: string }> {
  await requireAdmin()
  return signMultipartPart(AUDIO_BUCKET, key, uploadId, partNumber)
}

export async function completeMultipartUploadAction(
  key: string,
  uploadId: string,
  parts: CompletedPart[],
): Promise<void> {
  await requireAdmin()
  await completeMultipartUpload(AUDIO_BUCKET, key, uploadId, parts)
}

export async function abortMultipartUploadAction(
  key: string,
  uploadId: string,
): Promise<void> {
  await requireAdmin()
  await abortMultipartUpload(AUDIO_BUCKET, key, uploadId)
}
