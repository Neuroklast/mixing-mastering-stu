/**
 * Central terminology constants – single source of truth for all display labels
 * used across the project.  Import from here instead of hard-coding strings.
 */

// ── A/B Player track labels ──────────────────────────────────────────────────
/** Label for the "before" (unprocessed / demo) track. */
export const LABEL_DEMO = 'DEMO'
/** Label for the "after" (processed / final) track. */
export const LABEL_FINAL = 'FINAL'

/** Convenience record used wherever both labels are needed together. */
export const TRACK_LABELS = {
  BEFORE: LABEL_DEMO,
  AFTER: LABEL_FINAL,
} as const

// ── Service type names ────────────────────────────────────────────────────────
export const SERVICE_MIX            = 'Mix'
export const SERVICE_MASTER         = 'Master'
export const SERVICE_MIX_AND_MASTER = 'Mix & Master'
export const SERVICE_PRODUCING      = 'Producing'

// ── Tooltip / help copy ───────────────────────────────────────────────────────
export const TOOLTIP_SPECTRUM_CURVE =
  'Frequency Curve: Shows the full-spectrum energy profile of the audio signal. ' +
  'Red = active track; grey = inactive track; green Δ line = energy difference between DEMO and FINAL.'

export const TOOLTIP_PHASE_METER =
  'Phase Correlation Meter: Measures stereo phase coherence per frequency band (Low / Mid / High). ' +
  '+1 = perfectly mono-compatible; 0 = no correlation; −1 = out of phase (destructive summing).'
