import * as migration_20250503_000000_initial from './20250503_000000_initial.js'

export const migrations = [
  {
    up: migration_20250503_000000_initial.up,
    down: migration_20250503_000000_initial.down,
    name: '20250503_000000_initial',
  },
]
