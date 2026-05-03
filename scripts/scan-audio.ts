/**
 * Audio Directory Scanner & CMS Sync
 *
 * Usage:
 *   npx tsx scripts/scan-audio.ts [--incoming <dir>] [--dry-run]
 *
 * What it does:
 *   1. Auto-Organizer – scans an optional "incoming" directory (or
 *      /public/audio/showcase root) for loose .wav files matching the
 *      pattern "Artist - Title - TYPE.wav" and moves them into the correct
 *      subfolder structure.
 *   2. Directory Scanner – scans /public/audio/showcase recursively.
 *      For each "Artist - Title" subdirectory it finds:
 *        • A file with DEMO in its name  → mix/before track
 *        • A file with MASTER in its name → master/after track
 *      Only folders with BOTH files are processed.
 *   3. WAV Validation – reads the WAV header to verify the file is
 *      24-bit/96 kHz (warns and skips if not).
 *   4. Waveform Peaks – generates 200 amplitude peak values from the
 *      master file's PCM data for fast waveform rendering.
 *   5. Payload CMS Upsert – creates or updates a Showcase document
 *      identified by a normalised slug (artist-title).
 *
 * Environment variables required (same as the Next.js app):
 *   DATABASE_URI   – PostgreSQL connection string
 *   PAYLOAD_SECRET – Payload CMS secret
 */

import * as fs   from 'node:fs'
import * as path from 'node:path'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WavInfo {
  valid: boolean
  bitDepth?: number
  sampleRate?: number
  numChannels?: number
  dataOffset?: number   // byte offset where PCM samples begin
  dataSize?: number     // byte length of PCM data
  blockAlign?: number   // bytes per sample frame
  error?: string
}

interface ScanResult {
  slug: string
  artist: string
  title: string
  demoPath: string
  masterPath: string
  demoUrl: string       // root-relative URL for Next.js
  masterUrl: string
  wavInfo: WavInfo
  peaks: number[]       // 200 RMS amplitude values in [0, 1]
}

// ─── CLI arg parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun       = args.includes('--dry-run')
const incomingIdx  = args.indexOf('--incoming')
const incomingDir  = incomingIdx !== -1 ? args[incomingIdx + 1] : undefined

const SHOWCASE_DIR = path.resolve('./public/audio/showcase')

// ─── Slug helper ──────────────────────────────────────────────────────────────

/** Generate a URL-safe, lowercase slug from an arbitrary string. */
function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── WAV header parser ────────────────────────────────────────────────────────

/**
 * Read the RIFF/WAVE chunk structure and extract format information.
 * Handles non-standard headers with extra metadata chunks before "data".
 */
function parseWavHeader(filePath: string): WavInfo {
  let fd: number | null = null
  try {
    fd = fs.openSync(filePath, 'r')
    // Read enough bytes to cover the header + possible extra chunks
    const HEADER_BUF_SIZE = 512
    const buf = Buffer.alloc(HEADER_BUF_SIZE)
    fs.readSync(fd, buf, 0, HEADER_BUF_SIZE, 0)

    // Validate RIFF/WAVE magic bytes
    if (buf.toString('ascii', 0, 4) !== 'RIFF') {
      return { valid: false, error: 'Not a RIFF file' }
    }
    if (buf.toString('ascii', 8, 12) !== 'WAVE') {
      return { valid: false, error: 'Not a WAVE file' }
    }

    let offset = 12
    let fmtFound    = false
    let dataOffset  = 0
    let dataSize    = 0
    let bitDepth    = 0
    let sampleRate  = 0
    let numChannels = 0
    let blockAlign  = 0

    // Walk through RIFF chunks
    while (offset + 8 <= HEADER_BUF_SIZE) {
      const chunkId   = buf.toString('ascii', offset, offset + 4)
      const chunkSize = buf.readUInt32LE(offset + 4)

      if (chunkId === 'fmt ') {
        const audioFormat = buf.readUInt16LE(offset + 8)  // 1 = PCM, 3 = IEEE float, 65534 = extensible
        if (audioFormat !== 1 && audioFormat !== 65534) {
          return { valid: false, error: `Unsupported WAV format: ${audioFormat}` }
        }
        numChannels = buf.readUInt16LE(offset + 10)
        sampleRate  = buf.readUInt32LE(offset + 12)
        blockAlign  = buf.readUInt16LE(offset + 20)
        bitDepth    = buf.readUInt16LE(offset + 22)
        fmtFound    = true
      } else if (chunkId === 'data') {
        dataOffset = offset + 8
        dataSize   = chunkSize
        break
      }

      offset += 8 + chunkSize
      // Align to even byte boundary (RIFF spec)
      if (chunkSize % 2 !== 0) offset++
    }

    if (!fmtFound) return { valid: false, error: 'fmt chunk not found' }
    if (dataOffset === 0) return { valid: false, error: 'data chunk not found in header window' }

    return { valid: true, bitDepth, sampleRate, numChannels, dataOffset, dataSize, blockAlign }
  } catch (err) {
    return { valid: false, error: String(err) }
  } finally {
    if (fd !== null) fs.closeSync(fd)
  }
}

// ─── Waveform peak generator ──────────────────────────────────────────────────

/**
 * Read PCM samples from a WAV file and compute RMS amplitude peaks
 * split into `numPeaks` equally-sized windows.  Returns values in [0, 1].
 */
function generatePeaks(filePath: string, wavInfo: WavInfo, numPeaks = 200): number[] {
  if (!wavInfo.valid || !wavInfo.dataOffset || !wavInfo.dataSize || !wavInfo.bitDepth || !wavInfo.blockAlign) {
    return Array(numPeaks).fill(0)
  }

  let fd: number | null = null
  try {
    fd = fs.openSync(filePath, 'r')

    const { dataOffset, dataSize, bitDepth, blockAlign } = wavInfo
    const bytesPerSample = bitDepth / 8
    const totalFrames    = Math.floor(dataSize / blockAlign)
    const framesPerPeak  = Math.max(1, Math.floor(totalFrames / numPeaks))
    const peaks: number[] = []

    // Read in chunks of up to 4096 frames to stay memory-efficient
    const CHUNK_FRAMES = 4096
    const chunkBuf = Buffer.alloc(CHUNK_FRAMES * blockAlign)

    for (let p = 0; p < numPeaks; p++) {
      const startFrame = p * framesPerPeak
      const endFrame   = Math.min(startFrame + framesPerPeak, totalFrames)
      const count      = endFrame - startFrame
      if (count <= 0) { peaks.push(0); continue }

      let sumSquares = 0
      let processed  = 0

      while (processed < count) {
        const batch    = Math.min(CHUNK_FRAMES, count - processed)
        const bytePos  = dataOffset + (startFrame + processed) * blockAlign
        const bytesRead = fs.readSync(fd, chunkBuf, 0, batch * blockAlign, bytePos)
        const frames    = Math.floor(bytesRead / blockAlign)

        for (let f = 0; f < frames; f++) {
          // Use first channel only for the peak meter
          const sampleOffset = f * blockAlign
          let sample = 0
          if (bitDepth === 16) {
            sample = chunkBuf.readInt16LE(sampleOffset) / 32768
          } else if (bitDepth === 24) {
            // 24-bit little-endian signed integer
            const b0 = chunkBuf[sampleOffset]!
            const b1 = chunkBuf[sampleOffset + 1]!
            const b2 = chunkBuf[sampleOffset + 2]!
            const raw = b0 | (b1 << 8) | (b2 << 16)
            sample = (raw & 0x800000 ? raw - 0x1000000 : raw) / 8388608
          } else if (bitDepth === 32) {
            sample = chunkBuf.readInt32LE(sampleOffset) / 2147483648
          }
          sumSquares += sample * sample
        }
        processed += frames
      }

      const rms = Math.sqrt(sumSquares / count)
      peaks.push(Math.min(1, rms))
    }

    return peaks
  } catch {
    return Array(numPeaks).fill(0)
  } finally {
    if (fd !== null) fs.closeSync(fd)
  }
}

// ─── Auto-Organizer ───────────────────────────────────────────────────────────

/**
 * Normalise a string: replace special chars / underscores / consecutive
 * spaces with a single space, then trim.
 */
function normaliseName(s: string): string {
  return s.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Scan a directory for loose .wav files matching "Artist - Title - TYPE.wav"
 * (or with underscores instead of spaces) and move them into the correct
 * /public/audio/showcase/Artist - Title/ subfolder, renaming them to a clean
 * canonical form.
 */
function autoOrganize(sourceDir: string): void {
  if (!fs.existsSync(sourceDir)) return

  // Pattern: anything containing " - " (or "_-_") followed by DEMO or MASTER
  const LOOSE_WAV = /^(.+?)\s*[-–]\s*(.+?)\s*[-–]\s*(demo|master)\.wav$/i

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!entry.name.toLowerCase().endsWith('.wav')) continue

    const normName = normaliseName(entry.name).replace(/\.wav$/i, '')
    const match    = normName.match(LOOSE_WAV)
    if (!match) continue

    const artist   = normaliseName(match[1]!)
    const title    = normaliseName(match[2]!)
    const fileType = match[3]!.toUpperCase() // DEMO or MASTER

    const folderName = `${artist} - ${title}`
    const folderPath = path.join(SHOWCASE_DIR, folderName)

    // Canonical filename: Artist_Title_MASTER.wav (underscores, no spaces)
    const safeArtist = artist.replace(/\s+/g, '_')
    const safeTitle  = title.replace(/\s+/g, '_')
    const newFileName = `${safeArtist}_${safeTitle}_${fileType}.wav`
    const srcPath     = path.join(sourceDir, entry.name)
    const destPath    = path.join(folderPath, newFileName)

    if (!dryRun) {
      fs.mkdirSync(folderPath, { recursive: true })
      // Atomic: copy then delete (avoid partial writes)
      fs.copyFileSync(srcPath, destPath)
      fs.unlinkSync(srcPath)
    }

    console.log(`[organizer] ${entry.name} → ${folderName}/${newFileName}${dryRun ? ' (dry-run)' : ''}`)
  }
}

// ─── Directory Scanner ────────────────────────────────────────────────────────

// Pattern for "Artist - Title" folder names (also allows em-dash)
const FOLDER_PATTERN = /^(.+?)\s*[-–]\s*(.+)$/

function findWavFile(dir: string, keyword: string): string | null {
  const files = fs.readdirSync(dir)
  const re    = new RegExp(keyword, 'i')
  const match = files.find(
    (f) => re.test(f) && f.toLowerCase().endsWith('.wav'),
  )
  return match ? path.join(dir, match) : null
}

function scanDirectory(): ScanResult[] {
  if (!fs.existsSync(SHOWCASE_DIR)) {
    console.warn(`[scanner] showcase directory not found: ${SHOWCASE_DIR}`)
    return []
  }

  const results: ScanResult[] = []
  const entries = fs.readdirSync(SHOWCASE_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const match = entry.name.match(FOLDER_PATTERN)
    if (!match) {
      console.warn(`[scanner] skipping "${entry.name}" – does not match "Artist - Title" pattern`)
      continue
    }

    const artist = normaliseName(match[1]!)
    const title  = normaliseName(match[2]!)
    const slug   = toSlug(`${artist}-${title}`)
    const dirPath = path.join(SHOWCASE_DIR, entry.name)

    // Locate DEMO and MASTER files
    const demoPath   = findWavFile(dirPath, 'demo')
    const masterPath = findWavFile(dirPath, 'master')

    if (!demoPath || !masterPath) {
      const missing = !demoPath && !masterPath ? 'DEMO + MASTER' : !demoPath ? 'DEMO' : 'MASTER'
      console.error(`[scanner] ERROR: "${entry.name}" is missing ${missing} file — skipping`)
      continue
    }

    // Validate master file WAV format
    const wavInfo = parseWavHeader(masterPath)
    if (!wavInfo.valid) {
      console.error(`[scanner] ERROR: "${masterPath}" is not a valid WAV: ${wavInfo.error} — skipping`)
      continue
    }
    if (wavInfo.bitDepth !== 24 || wavInfo.sampleRate !== 96000) {
      console.warn(
        `[scanner] WARN: "${masterPath}" is ${wavInfo.bitDepth}-bit/${wavInfo.sampleRate} Hz ` +
        `(expected 24-bit/96 kHz) — processing anyway`,
      )
    }

    // Root-relative URLs for the Next.js app (files live under /public/)
    const relDir    = path.relative(path.resolve('./public'), dirPath).replace(/\\/g, '/')
    const demoUrl   = `/${relDir}/${path.basename(demoPath)}`
    const masterUrl = `/${relDir}/${path.basename(masterPath)}`

    // Generate waveform peaks from master file
    const peaks = generatePeaks(masterPath, wavInfo)

    console.log(`[scanner] ✓ "${entry.name}" (${wavInfo.bitDepth}-bit/${wavInfo.sampleRate} Hz)`)

    results.push({ slug, artist, title, demoPath, masterPath, demoUrl, masterUrl, wavInfo, peaks })
  }

  return results
}

// ─── Payload CMS Sync ─────────────────────────────────────────────────────────

async function syncToPayload(results: ScanResult[]): Promise<void> {
  if (results.length === 0) {
    console.log('[sync] nothing to sync')
    return
  }

  // Dynamic import to avoid issues when Payload is not configured
  let payload: Awaited<ReturnType<typeof import('payload')['getPayload']>>
  try {
    const { getPayload } = await import('payload')
    const { default: config } = await import('../payload.config')
    payload = await getPayload({ config })
  } catch (err) {
    console.error('[sync] Could not initialise Payload (is DATABASE_URI set?)', err)
    console.log('[sync] Outputting scan results to /tmp/scan-results.json instead')
    fs.writeFileSync('/tmp/scan-results.json', JSON.stringify(results, null, 2))
    return
  }

  for (const [i, result] of results.entries()) {
    const { slug, artist, title, demoUrl, masterUrl, peaks } = result

    // Check if entry already exists
    const existing = await payload.find({
      collection: 'showcase',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    const data = {
      slug,
      title,
      artist,
      beforeUrl: demoUrl,
      afterUrl: masterUrl,
      waveformData: peaks,
      order: i,
      active: true,
    }

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'showcase',
        id: String(existing.docs[0]!.id),
        data,
      })
      console.log(`[sync] updated: "${title}" (slug: ${slug})`)
    } else {
      await payload.create({ collection: 'showcase', data })
      console.log(`[sync] created: "${title}" (slug: ${slug})`)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n=== Sonorativa Audio Scanner ===`)
  console.log(`showcase dir : ${SHOWCASE_DIR}`)
  if (incomingDir) console.log(`incoming dir : ${incomingDir}`)
  if (dryRun)      console.log(`mode         : DRY RUN (no files will be moved or written)\n`)
  else             console.log()

  // Step 1: auto-organise loose files
  const sourceDir = incomingDir ? path.resolve(incomingDir) : SHOWCASE_DIR
  if (incomingDir) {
    console.log('[organizer] scanning incoming directory...')
    autoOrganize(sourceDir)
  }

  // Step 2: scan the organised showcase directory
  console.log('[scanner] scanning showcase directory...')
  const results = scanDirectory()
  console.log(`[scanner] found ${results.length} valid track pair(s)\n`)

  if (dryRun) {
    console.log('[dry-run] scan results:')
    for (const r of results) {
      console.log(`  ${r.slug}:  demo=${r.demoUrl}  master=${r.masterUrl}`)
    }
    return
  }

  // Step 3: sync to Payload CMS
  console.log('[sync] syncing to Payload CMS...')
  await syncToPayload(results)
  console.log('\n=== Done ===\n')
}

main().catch((err) => {
  console.error('[scanner] fatal error:', err)
  process.exit(1)
})
