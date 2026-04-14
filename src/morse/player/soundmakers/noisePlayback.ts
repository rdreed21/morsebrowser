/** Noise types supported by the Web Audio noise nodes (see SmoothedSoundsPlayer). */
const VALID_NOISE_TYPES = new Set(['white', 'brown', 'pink'])

/**
 * Map stored UI / query noise selection to the value passed into the sound maker.
 * Any unknown string is treated as off.
 */
export function effectiveNoiseType (noiseType: string): 'white' | 'brown' | 'pink' | 'off' {
  return VALID_NOISE_TYPES.has(noiseType) ? (noiseType as 'white' | 'brown' | 'pink') : 'off'
}
