/** DEPRECATED, use partsLibrary instead */

/**
 * Pattern presets - Common drum patterns ready to load into the sequencer
 * Use: const pattern = PATTERNS.fourOnFloor.kick
 *      DrumMachine.setGridPattern('kick', pattern)
 */

export const PATTERNS = {
  // Basic four-on-the-floor (kick on every beat)
  fourOnFloor: {
    kick: [
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
    ],
    snare: [
      false, false, false, false,
      true, false, false, false,
      false, false, false, false,
      true, false, false, false,
    ],
    hihat: [
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
    ],
    bass: new Array(16).fill(false),
    keys: new Array(16).fill(false),  // No keyboard pattern
  },

  // Techno/House pattern
  technoHouse: {
    kick: [
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
    ],
    snare: [
      false, false, false, false,
      true, false, false, false,
      false, false, false, false,
      true, false, false, false,
    ],
    hihat: [
      true, true, true, true,
      true, true, true, true,
      true, true, true, true,
      true, true, true, true,
    ],
    bass: [
      true, false, false, false,
      false, false, true, false,
      true, false, false, false,
      false, false, true, false,
    ],
    keys: new Array(16).fill(false),
  },

  // Hip-hop/Boom-bap pattern
  boomBap: {
    kick: [
      true, false, false, false,
      false, false, true, false,
      true, false, false, false,
      false, true, false, false,
    ],
    snare: [
      false, false, false, false,
      true, false, false, false,
      false, false, false, false,
      true, false, false, false,
    ],
    hihat: [
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
    ],
    bass: [
        false, false, true, false,
        false, false, false, false,
        true, false, false, true,
        false, false, false, false,
    ],
    keys: [
        false, false, false, false,
        false, false, false, false,
        false, false, false, false,
        false, false, false, true,
    ],
  },

  // Polyrhythmic: 3/4 bass pattern over 4/4 keys
  polyrhythmic: {
    kick: [
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
    ],
    // hihat: new Array(16).fill(false),  // Constant hi-hat on every step
    snare: [
      true, false, false,
      true, false, false,
      true, false, false,
      true, false, false,
      true, false, false,
      true,
    ],
    bass: [
      true, false, false, false,
      false, false, false, false,
      false, false, true, false,
      false, false, false, false,
    ],
    hihat: [
      false, false, true, false,
      false, false, true, false,
      false, false, true, false,
      false, false, true, false,
    ],
    // 4/4 pattern (4-beat groups)
    keys: [
      true, false, false, false,
      false, false, false, false,
      false, false, true, false,
      false, false, false, false,
    ],
  },

  // All empty
  empty: {
    kick: new Array(16).fill(false),
    snare: new Array(16).fill(false),
    hihat: new Array(16).fill(false),
    bass: new Array(16).fill(false),
    keys: new Array(16).fill(false),
  },

  // Random 50% fill
  random: {
    kick: Array.from({ length: 16 }, () => Math.random() > 0.5),
    snare: Array.from({ length: 16 }, () => Math.random() > 0.5),
    hihat: Array.from({ length: 16 }, () => Math.random() > 0.5),
    bass: Array.from({ length: 16 }, () => Math.random() > 0.5),
    keys: Array.from({ length: 16 }, () => Math.random() > 0.5),
  },
}

/**
 * Load a preset pattern into the drum machine
 * Usage: loadPattern('fourOnFloor')
 */
export function loadPattern(patternName, drumMachine) {
  const pattern = PATTERNS[patternName]
  if (!pattern) {
    console.warn(`Pattern "${patternName}" not found`)
    return
  }

  Object.entries(pattern).forEach(([instrument, steps]) => {
    drumMachine.setGridPattern(instrument, steps)
  })
}

/**
 * Get available pattern names
 */
export function getAvailablePatterns() {
  return Object.keys(PATTERNS)
}