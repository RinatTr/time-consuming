/**
 * partsLibrary.js
 * Static lookup table of handcrafted per-instrument parts.
 * 
 * Structure: PARTS_LIBRARY[instrumentId][role][hostMeter][subdivision][groupingOption] → boolean[]
 * 
 * The host parts have groupings even though they don't use the groupingOption directly, because the generator needs to know how many steps are in each host group to 
 * calculate the guest pattern repeats. This is a bit redundant but keeps the generator logic simpler and more consistent.
 * All 6 instruments × 2 roles × 3 meters × 2 subdivisions × 3 groupingOptions = 216 leaf entries.
 * Missing leaves fall back to [] (generator treats as all-false with a warning).
 */

export const PARTS_LIBRARY = {
  kick: {
    host: {
      '4/4': {
        '16th': {
          3: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          4: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          5: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        },
        '8th-triplet': {
          3: [true, false, false, true, false, false, true, false, false, true, false, false],
          4: [true, false, false, true, false, false, true, false, false, true, false, false],
          5: [true, false, false, true, false, false, true, false, false, true, false, false],
        },
      },
      '5/4': {
        '16th': {
          3: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          4: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          5: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        },
        '8th-triplet': {
          3: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false],
          4: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false],
          5: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false],
        },
      },
      '6/8': {
        '16th': {
          3: [true, false, false, false, true, false, false, false, true, false, false, false],
          4: [true, false, false, false, true, false, false, false, true, false, false, false],
          5: [true, false, false, false, true, false, false, false, true, false, false, false],
        },
        '8th-triplet': {
          3: [true, false, false, true, false, false, true, false, false],
          4: [true, false, false, true, false, false, true, false, false],
          5: [true, false, false, true, false, false, true, false, false],
        },
      },
    },
    guest: {
      '4/4': {
        '16th': {
          3: [true, false, false],
          4: [true, false, false, false],
          5: [true, false, false, false, false],
        },
        '8th-triplet': {
          3: [true, false, false],
          4: [true, false, false, false],
          5: [true, false, false, false, false],
        },
      },
      '5/4': {
        '16th': {
          3: [true, false, false],
          4: [true, false, false, false],
          5: [true, false, false, false, false],
        },
        '8th-triplet': {
          3: [true, false, false],
          4: [true, false, false, false],
          5: [true, false, false, false, false],
        },
      },
      '6/8': {
        '16th': {
          3: [true, false, false],
          4: [true, false, false, false],
          5: [true, false, false, false, false],
        },
        '8th-triplet': {
          3: [true, false, false],
          4: [true, false, false, false],
          5: [true, false, false, false, false],
        },
      },
    },
  },

  snare: {
    host: {
      '4/4': {
        '16th': {
          3: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
          4: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
          5: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        },
        '8th-triplet': {
          3: [false, false, false, false, true, false, false, false, false, false, false, false],
          4: [false, false, false, false, true, false, false, false, false, false, false, false],
          5: [false, false, false, false, true, false, false, false, false, false, false, false],
        },
      },
      '5/4': {
        '16th': {
          3: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
          4: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
          5: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        },
        '8th-triplet': {
          3: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false],
          4: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false],
          5: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false],
        },
      },
      '6/8': {
        '16th': {
          3: [false, false, false, false, true, false, false, false, false, false, false, false],
          4: [false, false, false, false, true, false, false, false, false, false, false, false],
          5: [false, false, false, false, true, false, false, false, false, false, false, false],
        },
        '8th-triplet': {
          3: [false, false, false, false, true, false, false, false, false],
          4: [false, false, false, false, true, false, false, false, false],
          5: [false, false, false, false, true, false, false, false, false],
        },
      },
    },
    guest: {
      '4/4': {
        '16th': {
          3: [false, true, false],
          4: [false, true, false, false],
          5: [false, true, false, false, false],
        },
        '8th-triplet': {
          3: [false, true, false],
          4: [false, true, false, false],
          5: [false, true, false, false, false],
        },
      },
      '5/4': {
        '16th': {
          3: [false, true, false],
          4: [false, true, false, false],
          5: [false, true, false, false, false],
        },
        '8th-triplet': {
          3: [false, true, false],
          4: [false, true, false, false],
          5: [false, true, false, false, false],
        },
      },
      '6/8': {
        '16th': {
          3: [false, true, false],
          4: [false, true, false, false],
          5: [false, true, false, false, false],
        },
        '8th-triplet': {
          3: [false, true, false],
          4: [false, true, false, false],
          5: [false, true, false, false, false],
        },
      },
    },
  },

  hihat: {
    host: {
      '4/4': {
        '16th': {
          3: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
          4: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
          5: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        },
        '8th-triplet': {
          3: [true, false, true, true, false, true, true, false, true, true, false, true],
          4: [true, false, true, true, false, true, true, false, true, true, false, true],
          5: [true, false, true, true, false, true, true, false, true, true, false, true],
        },
      },
      '5/4': {
        '16th': {
          3: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
          4: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
          5: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        },
        '8th-triplet': {
          3: [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true],
          4: [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true],
          5: [true, false, true, true, false, true, true, false, true, true, false, true, true, false, true],
        },
      },
      '6/8': {
        '16th': {
          3: [true, false, true, false, true, false, true, false, true, false, true, false],
          4: [true, false, true, false, true, false, true, false, true, false, true, false],
          5: [true, false, true, false, true, false, true, false, true, false, true, false],
        },
        '8th-triplet': {
          3: [true, false, true, true, false, true, true, false, true],
          4: [true, false, true, true, false, true, true, false, true],
          5: [true, false, true, true, false, true, true, false, true],
        },
      },
    },
    guest: {
      '4/4': {
        '16th': {
          3: [true, true, false],
          4: [true, true, false, false],
          5: [true, true, false, false, false],
        },
        '8th-triplet': {
          3: [true, true, false],
          4: [true, true, false, false],
          5: [true, true, false, false, false],
        },
      },
      '5/4': {
        '16th': {
          3: [true, true, false],
          4: [true, true, false, false],
          5: [true, true, false, false, false],
        },
        '8th-triplet': {
          3: [true, true, false],
          4: [true, true, false, false],
          5: [true, true, false, false, false],
        },
      },
      '6/8': {
        '16th': {
          3: [true, true, false],
          4: [true, true, false, false],
          5: [true, true, false, false, false],
        },
        '8th-triplet': {
          3: [true, true, false],
          4: [true, true, false, false],
          5: [true, true, false, false, false],
        },
      },
    },
  },

  bass: {
    host: {
      '4/4': {
        '16th': {
          3: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          4: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          5: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        },
        '8th-triplet': {
          3: [true, false, false, true, false, false, true, false, false, true, false, false],
          4: [true, false, false, true, false, false, true, false, false, true, false, false],
          5: [true, false, false, true, false, false, true, false, false, true, false, false],
        },
      },
      '5/4': {
        '16th': {
          3: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          4: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
          5: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        },
        '8th-triplet': {
          3: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false],
          4: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false],
          5: [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false],
        },
      },
      '6/8': {
        '16th': {
          3: [true, false, false, false, true, false, false, false, true, false, false, false],
          4: [true, false, false, false, true, false, false, false, true, false, false, false],
          5: [true, false, false, false, true, false, false, false, true, false, false, false],
        },
        '8th-triplet': {
          3: [true, false, false, true, false, false, true, false, false],
          4: [true, false, false, true, false, false, true, false, false],
          5: [true, false, false, true, false, false, true, false, false],
        },
      },
    },
    guest: {
      '4/4': {
        '16th': {
          3: [true, false, true],
          4: [true, false, true, false],
          5: [true, false, true, false, false],
        },
        '8th-triplet': {
          3: [true, false, true],
          4: [true, false, true, false],
          5: [true, false, true, false, false],
        },
      },
      '5/4': {
        '16th': {
          3: [true, false, true],
          4: [true, false, true, false],
          5: [true, false, true, false, false],
        },
        '8th-triplet': {
          3: [true, false, true],
          4: [true, false, true, false],
          5: [true, false, true, false, false],
        },
      },
      '6/8': {
        '16th': {
          3: [true, false, true],
          4: [true, false, true, false],
          5: [true, false, true, false, false],
        },
        '8th-triplet': {
          3: [true, false, true],
          4: [true, false, true, false],
          5: [true, false, true, false, false],
        },
      },
    },
  },

  keys: {
    host: {
      '4/4': {
        '16th': {
          3: [],
          4: [],
          5: [],
        },
        '8th-triplet': {
          3: [],
          4: [],
          5: [],
        },
      },
      '5/4': {
        '16th': {
          3: [],
          4: [],
          5: [],
        },
        '8th-triplet': {
          3: [],
          4: [],
          5: [],
        },
      },
      '6/8': {
        '16th': {
          3: [],
          4: [],
          5: [],
        },
        '8th-triplet': {
          3: [],
          4: [],
          5: [],
        },
      },
    },
    guest: {
      '4/4': {
        '16th': {
          3: [false, false, true],
          4: [false, false, true, false],
          5: [false, false, true, false, false],
        },
        '8th-triplet': {
          3: [false, false, true],
          4: [false, false, true, false],
          5: [false, false, true, false, false],
        },
      },
      '5/4': {
        '16th': {
          3: [],
          4: [],
          5: [],
        },
        '8th-triplet': {
          3: [],
          4: [],
          5: [],
        },
      },
      '6/8': {
        '16th': {
          3: [],
          4: [],
          5: [],
        },
        '8th-triplet': {
          3: [],
          4: [],
          5: [],
        },
      },
    },
  },

  guitar: {
    host: {
      '4/4': {
        '16th': {
          3: [],
          4: [],
          5: [],
        },
        '8th-triplet': {
          3: [],
          4: [],
          5: [],
        },
      },
      '5/4': {
        '16th': {
          3: [],
          4: [],
          5: [],
        },
        '8th-triplet': {
          3: [],
          4: [],
          5: [],
        },
      },
      '6/8': {
        '16th': {
          3: [],
          4: [],
          5: [],
        },
        '8th-triplet': {
          3: [],
          4: [],
          5: [],
        },
      },
    },
    guest: {
      '4/4': {
        '16th': {
          3: [false, false, true],
          4: [false, false, true, false],
          5: [false, false, true, false, false],
        },
        '8th-triplet': {
          3: [false, false, true],
          4: [false, false, true, false],
          5: [false, false, true, false, false],
        },
      },
      '5/4': {
        '16th': {
          3: [false, false, true],
          4: [false, false, true, false],
          5: [false, false, true, false, false],
        },
        '8th-triplet': {
          3: [false, false, true],
          4: [false, false, true, false],
          5: [false, false, true, false, false],
        },
      },
      '6/8': {
        '16th': {
          3: [false, false, true],
          4: [false, false, true, false],
          5: [false, false, true, false, false],
        },
        '8th-triplet': {
          3: [false, false, true],
          4: [false, false, true, false],
          5: [false, false, true, false, false],
        },
      },
    },
  },
}
