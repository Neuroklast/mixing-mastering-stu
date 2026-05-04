/**
 * Abstract storage provider interface.
 * Currently backed by Supabase Storage — swap to Cloudflare R2 (S3-compatible)
 * by implementing this interface and updating lib/storage/index.ts.
 */

export interface StorageObject {
  name: string
  size: number
  lastModified: Date
  contentType?: string
}

export interface StorageProvider {
  /** Returns the public URL for an object in a public bucket. */
  getPublicUrl(bucket: string, path: string): string

  /** Creates a signed URL allowing a browser to PUT an object directly. */
  createSignedUploadUrl(
    bucket: string,
    path: string,
  ): Promise<{ signedUrl: string; token: string; path: string }>

  /** Creates a signed URL for temporary read access to a private object. */
  createSignedDownloadUrl(
    bucket: string,
    path: string,
    expiresInSec: number,
  ): Promise<string>

  /**
   * Uploads a binary object from the server side (e.g. a received File/FormData).
   * Use this only for server-side uploads where you already have the bytes.
   * For browser-side uploads, prefer createSignedUploadUrl (small files) or
   * the S3 multipart flow via useR2MultipartUpload (large audio files).
   */
  uploadObject(
    bucket: string,
    path: string,
    body: Buffer | Uint8Array | Blob,
    contentType: string,
  ): Promise<void>

  /** Deletes an object from the specified bucket. */
  deleteObject(bucket: string, path: string): Promise<void>

  /** Lists objects in a bucket, optionally filtered by prefix. */
  listObjects(bucket: string, prefix?: string): Promise<StorageObject[]>
}
