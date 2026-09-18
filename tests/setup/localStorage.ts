/**
 * Node >= 25 exposes a global `localStorage` that shadows jsdom's implementation
 * and has no methods unless `--localstorage-file` points to a valid file
 * ("localStorage.clear is not a function").
 *
 * Install a minimal in-memory Storage when that happens so tests that exercise
 * browser storage run on any Node version without extra CLI flags.
 */

class MemoryStorage {
  private readonly store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(String(key)) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(String(key))
  }

  setItem(key: string, value: string): void {
    this.store.set(String(key), String(value))
  }
}

if (typeof window !== 'undefined' && typeof window.localStorage?.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  })
}
