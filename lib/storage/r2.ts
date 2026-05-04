/**
 * Cloudflare R2 implementation of StorageProvider.
 *
 * R2 is S3-compatible, so we use @aws-sdk/client-s3 with R2's endpoint.
 * This is the only storage provider — Supabase Storage is no longer used.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID          – Cloudflare account ID
 *   R2_ACCESS_KEY_ID       – R2 S3-compatible access key ID
 *   R2_SECRET_ACCESS_KEY   – R2 S3-compatible secret access key
 *   R2_PUBLIC_HOST         – Public custom domain (e.g. media.example.com)
 *   R2_BUCKET_MEDIA        – Media bucket name (default: sonorativa-media)
 *   R2_BUCKET_AUDIO        – Audio bucket name (default: sonorativa-audio)
 *
 * Audio uploads use S3 Multipart Upload via the useR2MultipartUpload hook.
 * See docs/cloudflare-r2.md for full setup instructions.
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

/**
 * Normalise R2_PUBLIC_HOST so it is always a bare host (+ optional path prefix).
 *
 * Handles users who mistakenly set the env var with a protocol prefix or a
 * trailing slash, e.g.:
 *   "https://pub-xyz.r2.dev"  → "pub-xyz.r2.dev"
 *   "http://media.example.com/"  → "media.example.com"
 *   "media.example.com/cdn/"  → "media.example.com/cdn"   (path prefix kept)
 *   "media.example.com"       → "media.example.com"       (no-op)
 */
function normalizeR2Host(raw: string): string {
  // Strip leading protocol (http:// or https://, case-insensitive)
  const withoutProtocol = raw.replace(/^https?:\/\//i, '')
  // Strip trailing slashes
  return withoutProtocol.replace(/\/+$/, '')
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
   * Also accepts full URLs with protocol prefix (e.g. "https://pub-xyz.r2.dev")
   * — the protocol and any trailing slash are stripped defensively.
   */
  getPublicUrl(bucket: string, path: string): string {
    const raw = process.env.R2_PUBLIC_HOST
    if (!raw) throw new Error('Missing R2_PUBLIC_HOST environment variable')
    const host = normalizeR2Host(raw)
    // bucket is not part of the URL when using a custom domain bound to one bucket.
    // If your domain maps to a specific bucket, omit the bucket prefix.
    return `https://${host}/${encodePathSegments(path)}`
  },

  /**
   * Creates a presigned PUT URL for direct browser upload.
   * Used for small files (images, documents).
   * For large audio files (WAV/MP3), use S3 Multipart via the
   * useR2MultipartUpload hook and app/admin/_actions/r2Multipart.ts.
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

  async uploadObject(
    bucket: string,
    path: string,
    body: Buffer | Uint8Array | Blob,
    contentType: string,
  ): Promise<void> {
    const client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : body,
      ContentType: contentType,
    })
    await client.send(command)
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
