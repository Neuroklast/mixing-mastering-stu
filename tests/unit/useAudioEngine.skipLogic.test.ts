// @vitest-environment jsdom

/**
 * Tests for the URL-guard / skip logic in useAudioEngine.
 *
 * These tests verify the hasMountedRef fix that replaced the broken
 * initialUrlsRef guard, ensuring that navigating back to the first track
 * correctly re-triggers the load cycle.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioEngine } from '@/hooks/useAudioEngine'

// ── Mock: StereoFieldAnalyzer ─────────────────────────────────────────────────
vi.mock('@/lib/StereoFieldAnalyzer', () => ({
  StereoFieldAnalyzer: class {
    attach() { return Promise.resolve() }
    dispose() {}
  },
}))

// ── Mock: HTMLAudioElement ────────────────────────────────────────────────────

type ListenerEntry = { cb: (e: Event) => void; once: boolean }

const mockInstances: MockAudio[] = []

class MockAudio {
  src: string
  currentTime = 0
  duration = 0
  preload = ''
  crossOrigin: string | null = null
  private _map = new Map<string, ListenerEntry[]>()

  constructor(src = '') {
    this.src = src
    mockInstances.push(this)
  }

  addEventListener(
    type: string,
    cb: (e: Event) => void,
    options?: boolean | { once?: boolean },
  ) {
    const once = typeof options === 'object' && options !== null ? !!options.once : false
    if (!this._map.has(type)) this._map.set(type, [])
    this._map.get(type)!.push({ cb, once })
  }

  removeEventListener(type: string, cb: (e: Event) => void) {
    const arr = this._map.get(type)
    if (!arr) return
    const idx = arr.findIndex(x => x.cb === cb)
    if (idx !== -1) arr.splice(idx, 1)
  }

  /** Fire a synthetic event on all registered listeners, honouring `once`. */
  fire(type: string) {
    const e = new Event(type)
    const arr = [...(this._map.get(type) ?? [])]
    for (const entry of arr) {
      entry.cb(e)
      if (entry.once) this.removeEventListener(type, entry.cb)
    }
  }

  /** Snapshot of currently-registered callbacks for a given event type. */
  getListeners(type: string): Array<(e: Event) => void> {
    return (this._map.get(type) ?? []).map(x => x.cb)
  }

  play() { return Promise.resolve() }
  pause() {}
  load() {}
}

// ── Mock: AudioContext ────────────────────────────────────────────────────────

class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  }
  connect = vi.fn()
}

class MockAnalyserNode {
  frequencyBinCount = 1024
  fftSize = 2048
  connect = vi.fn()
  getByteFrequencyData = vi.fn()
}

class MockMediaElementSourceNode {
  connect = vi.fn()
}

class MockAudioContext {
  currentTime = 0
  state: AudioContextState = 'running'
  destination = {} as AudioDestinationNode
  createAnalyser() { return new MockAnalyserNode() as unknown as AnalyserNode }
  createGain() { return new MockGainNode() as unknown as GainNode }
  createMediaElementSource() {
    return new MockMediaElementSourceNode() as unknown as MediaElementAudioSourceNode
  }
  resume() { return Promise.resolve() }
  close() { return Promise.resolve() }
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockInstances.length = 0
  vi.stubGlobal('Audio', MockAudio)
  vi.stubGlobal('AudioContext', MockAudioContext)
  vi.stubGlobal('requestAnimationFrame', vi.fn())
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTrack(tag: string) {
  return {
    before: { label: 'before' as const, url: `/audio/${tag}_before.wav` },
    after:  { label: 'after'  as const, url: `/audio/${tag}_after.wav`  },
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAudioEngine – track navigation guard (hasMountedRef fix)', () => {

  it('initial render: mount effect runs, URL-change effect is skipped (no double-load)', () => {
    const tracks = makeTrack('a')
    const { result } = renderHook(() => useAudioEngine(tracks))

    // Mount effect sets status to 'loading'
    expect(result.current.status).toBe('loading')

    // Exactly 2 Audio elements created by the mount effect.
    // A double-load would create 2 more (URL-change effect creates none –
    // it reuses existing elements – but this check confirms only mount ran).
    expect(mockInstances).toHaveLength(2)

    // crossOrigin must be set to 'anonymous' on both elements so the Web Audio
    // MediaElementAudioSourceNode does not silence cross-origin streams.
    expect(mockInstances[0].crossOrigin).toBe('anonymous')
    expect(mockInstances[1].crossOrigin).toBe('anonymous')
  })

  it('navigating to a new track (different URLs) triggers a reload → status goes loading → then ready after loadedmetadata fires on both elements', async () => {
    const tracksA = makeTrack('a')
    const tracksB = makeTrack('b')

    const { result, rerender } = renderHook(
      (props: typeof tracksA) => useAudioEngine(props),
      { initialProps: tracksA },
    )

    expect(result.current.status).toBe('loading')

    // Navigate to track B
    await act(async () => { rerender(tracksB) })

    // URL-change effect should have set status back to 'loading'
    expect(result.current.status).toBe('loading')

    // Fire loadedmetadata on both audio elements
    await act(async () => {
      mockInstances[0].fire('loadedmetadata')
      mockInstances[1].fire('loadedmetadata')
    })

    // Both metadata events received → status should be 'ready'
    expect(result.current.status).toBe('ready')
  })

  it('navigating BACK to the first track (same URLs as initial) still triggers a reload → status goes loading (regression test for the initialUrlsRef bug)', async () => {
    const tracksA = makeTrack('a')
    const tracksB = makeTrack('b')

    const { result, rerender } = renderHook(
      (props: typeof tracksA) => useAudioEngine(props),
      { initialProps: tracksA },
    )

    // Go forward to B and let it fully load
    await act(async () => { rerender(tracksB) })
    await act(async () => {
      mockInstances[0].fire('loadedmetadata')
      mockInstances[1].fire('loadedmetadata')
    })
    expect(result.current.status).toBe('ready')

    // Navigate BACK to track A (URLs identical to the initial mount)
    await act(async () => { rerender(tracksA) })

    // With the old initialUrlsRef guard, the URL-change effect would silently
    // bail out here (URLs matched initial), leaving status as 'ready'.
    // With the hasMountedRef fix, the effect must run and set status to 'loading'.
    expect(result.current.status).toBe('loading')
  })

  it('rapid skip: firing loadedmetadata for a stale generation does not advance status to ready', async () => {
    const tracksA = makeTrack('a')
    const tracksB = makeTrack('b')
    const tracksC = makeTrack('c')

    const { result, rerender } = renderHook(
      (props: typeof tracksA) => useAudioEngine(props),
      { initialProps: tracksA },
    )

    // Navigate to B – URL-change effect registers generation-2 callbacks
    await act(async () => { rerender(tracksB) })

    // Save a reference to the stale generation-2 "before" callback before
    // React's cleanup removes it on the next rerender.
    const staleBeforeCb = mockInstances[0].getListeners('loadedmetadata').slice(-1)[0]

    // Immediately navigate to C – React cleanup removes B's callbacks and
    // registers fresh generation-3 callbacks.
    await act(async () => { rerender(tracksC) })
    expect(result.current.status).toBe('loading')

    // Manually invoke the stale generation-2 callback (simulates an in-flight
    // browser event from the previous load cycle arriving late).
    if (staleBeforeCb) {
      await act(async () => { staleBeforeCb(new Event('loadedmetadata')) })
    }

    // The generation guard inside the callback must reject it → still loading
    expect(result.current.status).toBe('loading')
  })

  it('metadataLoadedRef is reset to 0 on each URL change so both tracks must fire loadedmetadata before status becomes ready', async () => {
    const tracksA = makeTrack('a')
    const tracksB = makeTrack('b')
    const tracksC = makeTrack('c')

    const { result, rerender } = renderHook(
      (props: typeof tracksA) => useAudioEngine(props),
      { initialProps: tracksA },
    )

    // Navigate to B and fire only the "before" element's loadedmetadata
    await act(async () => { rerender(tracksB) })
    await act(async () => { mockInstances[0].fire('loadedmetadata') })
    // Only 1 of 2 metadata events fired → still loading
    expect(result.current.status).toBe('loading')

    // Navigate to C – metadataLoadedRef must be reset to 0
    await act(async () => { rerender(tracksC) })
    expect(result.current.status).toBe('loading')

    // Fire "before" once for generation C (counter goes 0 → 1)
    await act(async () => { mockInstances[0].fire('loadedmetadata') })
    // If the reset were missing, the carry-over count from B (=1) would make
    // total = 2 and prematurely flip status to 'ready'.
    expect(result.current.status).toBe('loading')

    // Fire "after" to complete the pair
    await act(async () => { mockInstances[1].fire('loadedmetadata') })
    expect(result.current.status).toBe('ready')
  })
})
