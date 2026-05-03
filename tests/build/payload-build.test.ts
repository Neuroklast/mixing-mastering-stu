import { describe, it, expect } from 'vitest'
import { spawnSync } from 'child_process'
import { existsSync, unlinkSync } from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '../..')
const OUTPUT_FILE = path.join('/tmp', `payload-types-test-${process.pid}.ts`)

describe('payload generate:types', () => {
  it('generates types without ERR_REQUIRE_ASYNC_MODULE or other errors', () => {
    const result = spawnSync(
      path.join(ROOT, 'node_modules', '.bin', 'payload'),
      ['generate:types'],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          // Minimal env so the config loads; no live DB connection needed for type generation
          DATABASE_URI: 'postgresql://placeholder:placeholder@localhost:5432/test',
          PAYLOAD_SECRET: 'test-secret-placeholder-at-least-32-characters-long',
          // Redirect output away from the repo to avoid dirty working tree in CI
          PAYLOAD_TS_OUTPUT_PATH: OUTPUT_FILE,
        },
        encoding: 'utf-8',
        timeout: 60_000,
      },
    )

    // Cleanup temp file regardless of outcome
    if (existsSync(OUTPUT_FILE)) {
      unlinkSync(OUTPUT_FILE)
    }

    const nodeVer = process.version
    const diagnostics =
      `Node.js ${nodeVer} (requires >=24)\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    expect(
      result.status,
      `payload generate:types exited with code ${result.status}\n${diagnostics}`,
    ).toBe(0)
  }, 60_000)
})
