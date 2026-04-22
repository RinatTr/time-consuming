/**
 * phraseGenerator.js
 * Pure function generator for creating complete polyrhythmic phrases from a parametric config.
 * 
 * No side effects. No imports from DrumMachine.
 * Takes a config object, a parts library, and a role assignment, and returns
 * a complete grid state ready to load into DrumMachine.
 */

import { getStepsPerBar, getHostGroupingsForMeter, calculatePhraseGroupings } from './phraseCalculator'

/**
 * generatePhrase
 * Pure generator function that creates a complete phrase state.
 * 
 * @param {Object} config - Configuration object
 *   @param {number} config.barCount - 1–4
 *   @param {number} config.groupingOption - 3 | 4 | 5 (guest grouping size)
 *   @param {string} config.hostMeter - '4/4' | '5/4' | '6/8'
 *   @param {string} config.subdivision - '16th' | '8th-triplet'
 * 
 * @param {Object} partsLibrary - PARTS_LIBRARY from partsLibrary.js
 * 
 * @param {Object} roleAssignment - Role assignment per instrument
 *   @param {string} roleAssignment.kick - 'host' | 'guest'
 *   @param {string} roleAssignment.snare - 'host' | 'guest'
 *   @param {string} roleAssignment.hihat - 'host' | 'guest'
 *   @param {string} roleAssignment.bass - 'host' | 'guest'
 *   @param {string} roleAssignment.keys - 'host' | 'guest'
 *   @param {string} roleAssignment.guitar - 'host' | 'guest'
 * 
 * @returns {Object} Complete phrase state
 *   @returns {Object} .patterns - { kick, snare, hihat, bass, keys, guitar } boolean arrays
 *   @returns {Object} .groupings - { guest: number[][], host: number[] }
 *   @returns {number} .stepsPerBar
 *   @returns {number} .totalSteps
 */
export function generatePhrase(config, partsLibrary, roleAssignment) {
  const { barCount, groupingOption, hostMeter, subdivision } = config

  // Compute derived values
  const stepsPerBar = getStepsPerBar(hostMeter, subdivision)
  const totalSteps = barCount * stepsPerBar

  // Initialize patterns object
  const patterns = {
    kick: new Array(totalSteps).fill(false),
    snare: new Array(totalSteps).fill(false),
    hihat: new Array(totalSteps).fill(false),
    bass: new Array(totalSteps).fill(false),
    keys: new Array(totalSteps).fill(false),
    guitar: new Array(totalSteps).fill(false),
  }

  // Process each instrument
  const instrumentIds = Object.keys(patterns)

  for (const instrumentId of instrumentIds) {
    const role = roleAssignment[instrumentId]

    // Fetch part from library 
    const part = role === 'guest'
      ? partsLibrary[instrumentId].guest[groupingOption]
      : partsLibrary[instrumentId].host[hostMeter][subdivision]

    if (!part || part.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[phraseGenerator] No part for ${instrumentId}/${role}/${hostMeter}/${subdivision}/${groupingOption}; using silence`
        )
      }
      // patterns[instrumentId] already filled with false, so skip
      continue
    }

    if (role === 'guest') {
      // Continuous tiling across the full phrase
      for (let step = 0; step < totalSteps; step++) {
        patterns[instrumentId][step] = part[step % part.length]
      }
    } else if (role === 'host') {
      // Tile within one bar, then copy bar across all bars
      const barPattern = new Array(stepsPerBar)
      for (let step = 0; step < stepsPerBar; step++) {
        barPattern[step] = part[step % part.length]
      }

      // Copy bar pattern to all bars
      for (let bar = 0; bar < barCount; bar++) {
        const barOffset = bar * stepsPerBar
        for (let step = 0; step < stepsPerBar; step++) {
          patterns[instrumentId][barOffset + step] = barPattern[step]
        }
      }
    }
  }

  // Compute groupings
  const guestGroupings = calculatePhraseGroupings(barCount, groupingOption, stepsPerBar)
  const hostGroupings = getHostGroupingsForMeter(hostMeter, subdivision)

  return {
    patterns,
    groupings: {
      guest: guestGroupings,
      host: hostGroupings,
    },
    stepsPerBar,
    totalSteps,
  }
}
