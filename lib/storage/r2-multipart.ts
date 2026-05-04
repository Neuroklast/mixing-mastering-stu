/**
 * S3 Multipart Upload helpers for Cloudflare R2.
 *
 * These helpers replace TUS for large audio uploads (WAV/MP3 up to 5 GB+).
 * Each part must be ≥ 5 MB (except the last). We use 5 MB chunks by default.
 *
 * Flow:
 *   1. createMultipartUpload()   → { uploadId }
 *   2. signMultipartPart() × N   → presigned PUT URLs per part
 *   3. Browser PUTs each part    → receives ETag header per part
 *   4. completeMultipartUpload() → finalises the object
 *   — or —
 *   4. abortMultipartUpload()    → cancels and cleans up
 *
 * Server-side only (uses R2_* env vars). Call from server actions in
 * app/admin/_actions/r2Multipart.ts.
 */

import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface CompletedPart {
  PartNumber: number
  ETag: string
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

/**
 * Initiates a multipart upload and returns the uploadId.
 */
export async function createMultipartUpload(
  bucket: string,
  key: string,
  contentType: string,
): Promise<{ uploadId: string }> {
  const client = getR2Client()
  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })
  const response = await client.send(command)
  if (!response.UploadId) {
    throw new Error('R2 did not return an UploadId for the multipart upload')
  }
  return { uploadId: response.UploadId }
}

/**
 * Returns a presigned PUT URL for a single multipart part.
 * The URL expires in 1 hour. The browser should PUT the part bytes
 * and capture the ETag response header.
 */
export async function signMultipartPart(
  bucket: string,
  key: string,
  uploadId: string,
  partNumber: number,
): Promise<{ signedUrl: string }> {
  const client = getR2Client()
  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  })
  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
  return { signedUrl }
}

/**
 * Finalises the multipart upload by assembling all uploaded parts.
 */
export async function completeMultipartUpload(
  bucket: string,
  key: string,
  uploadId: string,
  parts: CompletedPart[],
): Promise<void> {
  const client = getR2Client()
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map((p) => ({ PartNumber: p.PartNumber, ETag: p.ETag })),
    },
  })
  await client.send(command)
}

/**
 * Aborts an in-progress multipart upload and removes all uploaded parts.
 * Call this on cancel or error to avoid incurring storage costs.
 */
export async function abortMultipartUpload(
  bucket: string,
  key: string,
  uploadId: string,
): Promise<void> {
  const client = getR2Client()
  const command = new AbortMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
  })
  await client.send(command)
}
