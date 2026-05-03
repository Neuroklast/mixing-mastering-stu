/**
 * Cloudflare R2 implementation of StorageProvider.
 *
 * R2 is S3-compatible, so we use @aws-sdk/client-s3 with R2's endpoint.
 * Enabled by setting STORAGE_PROVIDER=r2 in environment variables.
 *
 * Required env vars when STORAGE_PROVIDER=r2:
 *   R2_ACCOUNT_ID          – Cloudflare account ID
 *   R2_ACCESS_KEY_ID       – R2 S3-compatible access key ID
 *   R2_SECRET_ACCESS_KEY   – R2 S3-compatible secret access key
 *   R2_PUBLIC_HOST         – Public custom domain (e.g. media.example.com)
 *
 * TUS limitation: R2 does not support TUS protocol. Chunked audio uploads
 * (WAVs via useTusUpload hook) remain on Supabase Storage. For image uploads
 * and signed download URLs, R2 is fully supported.
 * See docs/cloudflare-r2.md for details and migration guidance.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { StorageObject, StorageProvider } from './types'

/** Encode each path segment (but not the slashes between them). */
function encodePathSegments(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.',
    )
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export const r2StorageProvider: StorageProvider = {
  /**
   * Returns the public URL via R2's custom domain.
   * Requires R2_PUBLIC_HOST to be set (e.g. "media.example.com").
   */
  getPublicUrl(bucket: string, path: string): string {
    const host = process.env.R2_PUBLIC_HOST
    if (!host) throw new Error('Missing R2_PUBLIC_HOST environment variable')
    // bucket is not part of the URL when using a custom domain bound to one bucket.
    // If your domain maps to a specific bucket, omit the bucket prefix.
    return `https://${host}/${encodePathSegments(path)}`
  },

  /**
   * Creates a presigned PUT URL for direct browser upload.
   *
   * NOTE: R2 does not support TUS (resumable uploads). This returns a
   * single-PUT presigned URL suitable for files up to ~100 MB. For chunked
   * audio uploads use Supabase TUS (STORAGE_PROVIDER=supabase).
   * A future PR will add S3 multipart support for larger audio files on R2.
   */
  async createSignedUploadUrl(
    bucket: string,
    path: string,
  ): Promise<{ signedUrl: string; token: string; path: string }> {
    const client = getR2Client()
    const command = new PutObjectCommand({ Bucket: bucket, Key: path })
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 300 }) // 5 minutes
    return { signedUrl, token: '', path }
  },

  async createSignedDownloadUrl(
    bucket: string,
    path: string,
    expiresInSec: number,
  ): Promise<string> {
    const client = getR2Client()
    const command = new GetObjectCommand({ Bucket: bucket, Key: path })
    return getSignedUrl(client, command, { expiresIn: expiresInSec })
  },

  async deleteObject(bucket: string, path: string): Promise<void> {
    const client = getR2Client()
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: path })
    await client.send(command)
  },

  async listObjects(bucket: string, prefix?: string): Promise<StorageObject[]> {
    const client = getR2Client()
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    })
    const response = await client.send(command)
    const contents = response.Contents ?? []
    return contents.map((item) => ({
      name: item.Key ?? '',
      size: item.Size ?? 0,
      lastModified: item.LastModified ?? new Date(),
    }))
  },
}
