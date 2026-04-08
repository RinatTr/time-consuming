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
    guest: new Array(16).fill(false), // No bass pattern
    host: new Array(16).fill(false),  // No keyboard pattern
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
    guest: [
      true, false, false, false,
      false, false, true, false,
      true, false, false, false,
      false, false, true, false,
    ],
    host: new Array(16).fill(false),
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
    guest: new Array(16).fill(false),
    host: new Array(16).fill(false),
  },

  // Polyrhythmic: 3/4 guest pattern over 4/4 host
  polyrhythmic: {
    kick: [
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
    ],
    snare: new Array(16).fill(false),
    hihat: [
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
    ],
    // 3/16 pattern (3-beat groups)
    guest: [
      true, false, false,
      true, false, false,
      true, false, false,
      true, false, false,
      true, false, false,
      true, // 6 groups of 3 = 16 steps + 1
    ],
    // 4/4 pattern (4-beat groups)
    host: [
      true, false, false, false,
      false, false, false, false,
      true, false, false, false,
      false, false, false, false,
    ],
  },

  // All empty
  empty: {
    kick: new Array(16).fill(false),
    snare: new Array(16).fill(false),
    hihat: new Array(16).fill(false),
    guest: new Array(16).fill(false),
    host: new Array(16).fill(false),
  },

  // Random 50% fill
  random: {
    kick: Array.from({ length: 16 }, () => Math.random() > 0.5),
    snare: Array.from({ length: 16 }, () => Math.random() > 0.5),
    hihat: Array.from({ length: 16 }, () => Math.random() > 0.5),
    guest: Array.from({ length: 16 }, () => Math.random() > 0.5),
    host: Array.from({ length: 16 }, () => Math.random() > 0.5),
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
