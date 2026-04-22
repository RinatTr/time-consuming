/**
 * partsLibrary.js
 * Handcrafted per-instrument repeatable parts.
 *
 * HOST structure:
 *   PARTS_LIBRARY[instrumentId].host[hostMeter][subdivision] → boolean[]
 *   - Part length equals stepsPerBar for that meter+subdivision combo.
 *   - Does NOT vary by groupingOption (same part regardless of guest group size).
 *   - Tiling: the generator repeats this pattern within one bar, then copies
 *     that bar across all bars in the phrase.
 *
 * GUEST structure:
 *   PARTS_LIBRARY[instrumentId].guest[groupingOption] → boolean[]
 *   - Part length equals groupingOption (3, 4, or 5 steps).
 *   - Universal: the same part is used regardless of hostMeter or subdivision.
 *   - Tiling: the generator tiles this unit continuously across the full phrase
 *     (barCount × stepsPerBar), crossing bar boundaries without reset.
 *
 * Supported combos:
 *   hostMeter × subdivision:
 *     4/4  × 16th         → 16 steps/bar
 *     4/4  × 8th-triplet  → 12 steps/bar
 *     5/4  × 16th         → 20 steps/bar  [placeholder — no authored parts yet]
 *     5/4  × 8th-triplet  → 15 steps/bar  [placeholder — no authored parts yet]
 *     6/8  × 16th         → 12 steps/bar
 *     6/8  × 8th-triplet  → DISABLED (UI prevents this selection)
 *
 * Missing or empty entries ([]) fall back to all-false with a console.warn.
 * Default instrument roles: kick=host, snare=host, bass=host,
 *                           hihat=guest, guitar=guest, keys=guest
 */

export const PARTS_LIBRARY = {

  // ─────────────────────────────────────────────────────────────
  // KICK
  // ─────────────────────────────────────────────────────────────
  kick: {
    host: {
      '4/4': {
        '16th':        [true, false, false, false, false, false, false, true,  false, true,  true,  false, false, false, false, false],
        '8th-triplet': [true, false, false, false, false, false, false, false, true,  false, false, true],
      },
      '5/4': {
        '16th':        [],   // no authored pattern yet
        '8th-triplet': [],   // no authored pattern yet
      },
      '6/8': {
        '16th':        [true, false, false, false, false, true,  false, false, false, true,  false, true],
        // '8th-triplet' disabled — UI prevents this combo
      },
    },
    guest: {
      3: [true, false, false],
      4: [true, false, false, false],
      5: [true, false, true,  false, false],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // SNARE
  // ─────────────────────────────────────────────────────────────
  snare: {
    host: {
      '4/4': {
        '16th':        [false, false, false, false, true,  false, false, false, false, false, false, false, true,  false, false, true],
        '8th-triplet': [false, false, false, true,  false, false, false, false, false, true,  false, false],
      },
      '5/4': {
        '16th':        [],
        '8th-triplet': [],
      },
      '6/8': {
        '16th':        [false, false, false, false, false, false, true,  false, false, false, false, false],
      },
    },
    guest: {
      3: [true,  false, false],
      4: [true,  false, false, false],
      5: [true,  false, false, false, false],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // HI-HAT
  // ─────────────────────────────────────────────────────────────
  hihat: {
    host: {
      '4/4': {
        '16th':        [true,  false, true,  true,  true,  false, true,  true,  true,  false, true,  true,  true,  false, true,  true],
        '8th-triplet': [true,  false, true,  true,  false, true,  true,  false, true,  true,  false, true],
      },
      '5/4': {
        '16th':        [],
        '8th-triplet': [],
      },
      '6/8': {
        '16th':        [true,  false, true,  true,  true,  true,  true,  false, true,  true,  true,  true],
      },
    },
    guest: {
      3: [true,  false, true],
      4: [true,  false, false, false],
      5: [true,  false, true,  true,  false],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // BASS
  // ─────────────────────────────────────────────────────────────
  bass: {
    host: {
      '4/4': {
        '16th':        [true,  false, false, false, false, false, false, true,  false, true,  true,  false, false, false, false, false],
        '8th-triplet': [true,  false, false, false, false, false, false, false, true,  false, false, true],
      },
      '5/4': {
        '16th':        [],
        '8th-triplet': [],
      },
      '6/8': {
        '16th':        [true,  false, false, false, false, false, false, false, false, true,  false, true],
      },
    },
    guest: {
      3: [true,  false, false],
      4: [true,  false, false, false],
      5: [true,  false, true,  false, false],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // KEYS
  // ─────────────────────────────────────────────────────────────
  keys: {
    host: {
      '4/4': {
        '16th':        [true,  false, false, true,  false, false, true,  false, false, false, false, false, false, false, false, false],
        '8th-triplet': [true,  false, false, true,  false, false, true,  false, false, true,  false, true],
      },
      '5/4': {
        '16th':        [],
        '8th-triplet': [],
      },
      '6/8': {
        '16th':        [true,  false, false, false, false, false, true,  false, false, true,  false, false],
      },
    },
    guest: {
      3: [true,  false, true],
      4: [true,  false, false, false],
      5: [true,  false, false, false, false],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // GUITAR
  // ─────────────────────────────────────────────────────────────
  guitar: {
    host: {
      '4/4': {
        '16th':        [true,  false, false, false, false, false, true,  false, false, true,  false, false, true,  false, false, false],
        '8th-triplet': [true,  false, true,  false, false, false, true,  false, true,  false, false, false],
      },
      '5/4': {
        '16th':        [],
        '8th-triplet': [],
      },
      '6/8': {
        '16th':        [true,  false, false, false, false, false, true,  false, false, true,  false, false],
      },
    },
    guest: {
      3: [true,  false, true],
      4: [true,  false, false, false],
      5: [true,  false, false, false, false],
    },
  },
}