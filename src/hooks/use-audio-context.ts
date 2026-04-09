import { useRef, useCallback, useEffect } from 'react'

export interface AudioContextManager {
  getContext: () => AudioContext
  getAnalyser: () => AnalyserNode
  connectSource: (element: HTMLAudioElement) => MediaElementAudioSourceNode
  resume: () => Promise<void>
  cleanup: () => void
}

export function useAudioContext(): AudioContextManager {
  const contextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceMapRef = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(new Map())

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext()
    }
    return contextRef.current
  }, [])

  const getAnalyser = useCallback(() => {
    if (!analyserRef.current) {
      const ctx = getContext()
      analyserRef.current = ctx.createAnalyser()
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.8
      analyserRef.current.connect(ctx.destination)
    }
    return analyserRef.current
  }, [getContext])

  const connectSource = useCallback((element: HTMLAudioElement) => {
    const existing = sourceMapRef.current.get(element)
    if (existing) return existing

    const ctx = getContext()
    const analyser = getAnalyser()
    const source = ctx.createMediaElementSource(element)
    source.connect(analyser)
    sourceMapRef.current.set(element, source)
    return source
  }, [getContext, getAnalyser])

  const resume = useCallback(async () => {
    const ctx = getContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
  }, [getContext])

  const cleanup = useCallback(() => {
    sourceMapRef.current.clear()
    if (contextRef.current?.state !== 'closed') {
      contextRef.current?.close()
    }
    contextRef.current = null
    analyserRef.current = null
  }, [])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return {
    getContext,
    getAnalyser,
    connectSource,
    resume,
    cleanup,
  }
}
