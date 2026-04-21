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

/*

const PATTERNS_COMPUTABLE = {
   
    // a default computable pattern to any either host or guest beat (the polythmic one) for each grouping option, and for each instrument. 
    // the grouping options are 3, 4, and 5, and then we calculate their amount of repeats based on the bar length.
    // the maximum bar length option is 4.
  

  // Guest groupings parts (subdivision is 16th notes)
  guest: {
      //denominator
      '3': {
      kick: [],
      snare: [],
      hihat: [],
      bass: [],
      keys: [],
      guitar: [],
    },
      '4': {
        kick: [],
        snare: [],
        hihat: [],
        bass: [],
        keys: [],
        guitar: [],
      },
      '5': {
        kick: [],
        snare: [],
        hihat: [],
        bass: [],
        keys: [],
        guitar: [],
      },
  },
  //Host groupings parts, 
  host: {

    //denominator - 4/4 bar (subdivision is 16th notes)
      '4': {
      kick: [true, false, false, false],
      snare: [],
      hihat: [],
      bass: [],
      keys: [],
      guitar: [],
    },
    //5/4
    '5': {
      kick: [],
      snare: [],
      hihat: [],
      bass: [],
      keys: [],
      guitar: [],
    },

  }

  
  //i'd like to send the following explanations to claude for spec planning. 
  // the most relevant files for context are useAudioSequencer.js, InstrumentPanel.jsx, and BarPagination.jsx, 
  // but the overall app structure and goals are relevant as well, which you can find in the readme
 
  // computable pattern generation function:
  // desired result:
  // we have a default pattern part for each instrument, for each grouping option, and for each host meter option, and each subdivision.
  // given a number of bars (options are 1-4 bar count), a grouping option (options are 3-5 notes per group/lego block, being either 16th notes or eighth note triplets), 
  // a host meter (options are 4/4, 5/4, 6/8), and a subdivision (16th notes or eighth note triplets- which are applied across the board to all instruments, both beat and host)
  // we use the default relevant repeatable part for each instrument based on all these options, and then we tile it across the number of bars to create a full pattern for each instrument.
  // we receive an array with patterns for each instrument
  // in a format that we can load into the drum machine.



  // example:
  // input: barCount=1, groupingOption=3, hostMeter=4/4, subdivision=16th notes
  // output: /* an array of patterns for each instrument, 
  // and a default state indication for which instrument is guest or host for a start 
  // (we want that as a UI option to be toggled between for each instrument, but we need a default state to start with) 

  // todo: eventually, a function that also builds a grid UI based on same input, including block sizes etc.:
  // we are changing the grid UI from bar pagination to one page, with all blocks visible and stacked from left to right, up and down, read like a sheet music. 


}

*/