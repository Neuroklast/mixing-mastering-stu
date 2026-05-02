import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FRAMES_DIR = path.join(process.cwd(), 'public', 'video', 'frames')
const IMAGE_EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg'])

export const dynamic = 'force-static' // cached at build time in production

export function GET() {
  let names: string[] = []
  try {
    names = fs
      .readdirSync(FRAMES_DIR)
      .filter((f: string) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }))
  } catch {
    // directory missing in some CI/preview environments – return empty list
  }
  const frames = names.map((n) => `/video/frames/${n}`)
  return NextResponse.json({ frames })
}
