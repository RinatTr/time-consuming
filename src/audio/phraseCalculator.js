/**
 * phraseCalculator.js
 * Pure utility for deriving polyrhythmic block groupings across multiple bars
 * No side effects; deterministic output based on barCount.
 */

/**
 * calculatePhraseGroupings
 * Derives guest block groupings (size 3) across barCount * 16 steps continuously.
 * Each bar's groupings reflect where the 3-step stream lands within that bar's window.
 *
 * @param {number} barCount - 1, 2, 3, or 4
 * @param {number} guestSize - steps per guest group (default: 3, hardcoded for this iteration)
 * @param {number} stepsPerBar - always 16
 * @returns {number[][]} - array of barCount arrays; each array sums to 16
 *
 * Example outputs:
 *   barCount=1: [[3,3,3,3,3,1]]
 *   barCount=2: [[3,3,3,3,3,1], [2,3,3,3,3,2]]
 *   barCount=3: [[3,3,3,3,3,1], [2,3,3,3,3,2], [1,3,3,3,3,3]]
 *   barCount=4: [[3,3,3,3,3,1], [2,3,3,3,3,2], [1,3,3,3,3,3], [3,3,3,3,3,1]]
 *
 * Validation:
 *   - Every internal bar boundary: last of bar[n] + first of bar[n+1] === guestSize
 */
export function calculatePhraseGroupings(barCount, guestSize = 3, stepsPerBar = 16) {
  const result = Array.from({ length: barCount }, () => [])
  let carry = 0  // steps of the current group already placed in previous bar

  for (let bar = 0; bar < barCount; bar++) {
    let stepsRemaining = stepsPerBar

    // If carry from previous bar, complete that group first
    if (carry > 0) {
      const complete = guestSize - carry
      result[bar].push(complete)
      stepsRemaining -= complete
      carry = 0
    }

    // Fill full groups
    while (stepsRemaining >= guestSize) {
      result[bar].push(guestSize)
      stepsRemaining -= guestSize
    }

    // Handle leftover at bar boundary
    if (stepsRemaining > 0) {
      result[bar].push(stepsRemaining)
      carry = stepsRemaining
    }
  }

  // Validation (unit test assertion, not production check)
  // Only validate INTERNAL boundaries (not wrap-around at end)
  if (process.env.NODE_ENV === 'development') {
    for (let b = 0; b < barCount - 1; b++) {
      const boundary = result[b][result[b].length - 1] + result[b + 1][0]
      if (boundary !== guestSize) {
        console.warn(
          `[phraseCalculator] Boundary validation failed at bar ${b}/${b + 1}: ` +
          `${result[b][result[b].length - 1]} + ${result[b + 1][0]} !== ${guestSize}`
        )
      }
    }
  }

  return result
}

/**
 * getGuestGroupsForBar
 * Convenience function: get the groupings for a specific bar.
 */
export function getGuestGroupsForBar(barCount, barIndex, guestSize = 3) {
  const groupings = calculatePhraseGroupings(barCount, guestSize)
  return groupings[barIndex] || []
}

/**
 * getHostGroupings
 * Host groupings are always [4, 4, 4, 4] regardless of barCount.
 */
export function getHostGroupings() {
  return [4, 4, 4, 4]
}

/**
 * Convenience: derive block start positions from groupings
 * (These mark group boundaries within a bar, not musical downbeats)
 */
export function getGuestBlockBoundaries(guestGroupings) {
  return new Set(
    guestGroupings.reduce((acc, size, i) => {
      acc.push(i === 0 ? 0 : acc[acc.length - 1] + guestGroupings[i - 1])
      return acc
    }, [])
  )
}

export function getHostBlockBoundaries() {
  return new Set([0, 4, 8, 12])  // for 16 steps, 4-step groups
}

/**
 * generatePolyrhythmicPattern
 * Generates a polyrhythmic beat pattern that repeats across multiple bars.
 * Places a beat every `beatInterval` steps in a continuous stream across all bars.
 * 
 * @param {number} barCount - number of bars
 * @param {number} beatInterval - steps between beats (default: 3 for "true, false, false" pattern)
 * @param {number} stepsPerBar - steps per bar (default: 16)
 * @returns {boolean[]} - flattened pattern array of length barCount * stepsPerBar
 * 
 * Example with beatInterval=3, barCount=2:
 *   Continuous beat positions: 0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30
 *   Returns: [true, false, false, true, false, false, ..., true, false, false, ...]
 */
export function generatePolyrhythmicPattern(barCount, beatInterval = 3, stepsPerBar = 16) {
  const totalSteps = barCount * stepsPerBar
  const pattern = new Array(totalSteps).fill(false)
  
  // Place beats every beatInterval steps across the continuous stream
  for (let step = 0; step < totalSteps; step += beatInterval) {
    pattern[step] = true
  }
  
  return pattern
}
