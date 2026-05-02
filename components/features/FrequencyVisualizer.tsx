'use client'

import { FREQUENCY_BANDS } from '@/hooks/useAudioPlayer'

interface FrequencyVisualizerProps {
  frequencyBands: number[]
  isPlaying: boolean
}

const BAND_COLORS = [
  'oklch(0.75 0.20 160)',
  'oklch(0.70 0.18 180)',
  'oklch(0.65 0.16 200)',
  'oklch(0.70 0.18 220)',
  'oklch(0.75 0.20 240)',
] as const

const getBarStyle = (
  bandValue: number,
  color: string,
  isPlaying: boolean,
): React.CSSProperties => ({
  height: `${Math.max(bandValue * 100, 2)}%`,
  background: `linear-gradient(to top, ${color}, ${color}aa)`,
  boxShadow: isPlaying && bandValue > 0.1 ? `0 0 12px ${color}88` : 'none',
})

export const FrequencyVisualizer = ({
  frequencyBands,
  isPlaying,
}: FrequencyVisualizerProps): JSX.Element => (
  <div className="p-6 bg-secondary/30">
    <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
      Frequency Spectrum
    </h4>
    <div className="flex items-end justify-between gap-3 h-40">
      {frequencyBands.map((bandValue, index) => (
        <div key={FREQUENCY_BANDS[index].label} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full bg-muted/50 border border-border/50 rounded-sm overflow-hidden relative h-full">
            <div
              className="absolute bottom-0 w-full transition-[height] duration-100 rounded-sm"
              style={getBarStyle(bandValue, BAND_COLORS[index], isPlaying)}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {FREQUENCY_BANDS[index].label}
          </span>
        </div>
      ))}
    </div>
  </div>
)
