import { useEffect, useState, useRef, useCallback } from 'react'
import DrumMachine from '../audio/DrumMachine'
import { loadPattern, PATTERNS } from '../audio/patterns'
import { generatePolyrhythmicPattern } from '../audio/phraseCalculator'

/**
 * useAudioSequencer - Custom hook for managing drum machine state and playback
 * Handles initialization, playback control, BPM updates, playhead tracking, and multi-bar sequencing
 */
export function useAudioSequencer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [bpm, setBpm] = useState(120)
  const [isInitialized, setIsInitialized] = useState(false)
  const [barCount, setBarCount] = useState(1)
  const [activeBarIndex, setActiveBarIndex] = useState(0)
  const initializingRef = useRef(false)

  // DEBUG: Log all state updates
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useAudioSequencer STATE] barCount=${barCount}, activeBarIndex=${activeBarIndex}, isPlaying=${isPlaying}`)
    }
  }, [barCount, activeBarIndex, isPlaying])

  const initializeAudio = async () => {
    if (initializingRef.current || isInitialized) return

    initializingRef.current = true
    try {
      await DrumMachine.initialize()
      setIsInitialized(true)
      setBpm(DrumMachine.getBPM())
      // Load polyrhythmic pattern
      loadPattern('polyrhythmic', DrumMachine)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      initializingRef.current = false
    }
  }

  /**
   * Initialize multi-bar mode: tile the 16-step pattern across N bars
   * For guest instruments (e.g., snare), apply polyrhythmic pattern
   * For host instruments, tile the base pattern
   */
  const initializeBarCount = useCallback((n) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[initializeBarCount] called with n=${n}, isPlaying=${isPlaying}`)
    }
    if (n < 1 || n > 4 || isPlaying) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[initializeBarCount] BLOCKED: n in range=${n >= 1 && n <= 4}, isPlaying=${isPlaying}`)
      }
      return
    }

    // Guest instruments (snare) get polyrhythmic pattern
    const guestInstruments = ['snare']
    
    // Host instruments keep their base pattern tiled
    const hostInstruments = ['hihat', 'bass', 'kick', 'keys']

    // Apply polyrhythmic pattern to guest instruments
    guestInstruments.forEach((instrumentName) => {
      if (DrumMachine.gridState[instrumentName]) {
        const polyPattern = generatePolyrhythmicPattern(n, 3, 16)
        DrumMachine.gridState[instrumentName] = polyPattern
        if (process.env.NODE_ENV === 'development') {
          console.log(`[initializeBarCount] Applied polyrhythmic pattern to ${instrumentName}:`, polyPattern)
        }
      }
    })

    // Tile each host instrument's 16-step pattern across N bars
    hostInstruments.forEach((instrumentName) => {
      if (DrumMachine.gridState[instrumentName]) {
        const basePattern = DrumMachine.gridState[instrumentName].slice(0, 16)
        const fullPattern = new Array(n * 16).fill(false)

        for (let bar = 0; bar < n; bar++) {
          const barOffset = bar * 16
          for (let step = 0; step < 16; step++) {
            fullPattern[barOffset + step] = basePattern[step]
          }
        }

        DrumMachine.gridState[instrumentName] = fullPattern
      }
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`[initializeBarCount] Setting barCount=${n}, activeBarIndex=0`)
    }
    setBarCount(n)
    setActiveBarIndex(0)
  }, [isPlaying])

  /**
   * Navigate to a specific bar (only when stopped)
   */
  const goToBar = useCallback((barIndex) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[goToBar] called with barIndex=${barIndex}, isPlaying=${isPlaying}, barCount=${barCount}`)
    }
    if (isPlaying || barIndex < 0 || barIndex >= barCount) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[goToBar] BLOCKED: isPlaying=${isPlaying}, barIndex in range=${barIndex >= 0 && barIndex < barCount}`)
      }
      return
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[goToBar] Setting activeBarIndex to ${barIndex}`)
    }
    setActiveBarIndex(barIndex)
  }, [isPlaying, barCount])

  /**
   * Start playback
   */
  const play = async () => {
    if (!isInitialized) {
      await initializeAudio()
    }
    const stepCount = barCount * 16
    DrumMachine.play(stepCount)
    setIsPlaying(true)
  }

  /**
   * Stop playback
   */
  const stop = () => {
    DrumMachine.stop()
    setIsPlaying(false)
    setCurrentStep(0)
    setActiveBarIndex(0)
  }

  /**
   * Update BPM
   */
  const updateBPM = (newBpm) => {
    DrumMachine.setBPM(newBpm)
    setBpm(newBpm)
  }

  /**
   * Set grid cell active/inactive
   */
  const setGridCell = (instrumentName, step, isActive) => {
    DrumMachine.setGridCell(instrumentName, step, isActive)
  }

  /**
   * Get grid cell state
   */
  const getGridCell = (instrumentName, step) => {
    return DrumMachine.getGridCell(instrumentName, step)
  }

  /**
   * Set entire pattern for an instrument
   */
  const setPattern = (instrumentName, pattern) => {
    DrumMachine.setGridPattern(instrumentName, pattern)
  }

  /**
   * Get entire pattern for an instrument
   */
  const getPattern = (instrumentName) => {
    return DrumMachine.getGridPattern(instrumentName)
  }

  // Memoize step change handler to prevent re-creating it on every render
  const handleStepChange = useCallback((globalStep) => {
    setCurrentStep(globalStep)

    // Auto-follow: update activeBarIndex during playback
    if (isPlaying) {
      const newBarIndex = Math.floor(globalStep / 16)
      setActiveBarIndex(newBarIndex)
    }
  }, [isPlaying])

  // Subscribe to step changes for playhead tracking and auto-follow during playback
  useEffect(() => {
    DrumMachine.onStepChange(handleStepChange)

    return () => {
      // Clean up listener to prevent accumulation
      DrumMachine.offStepChange(handleStepChange)
    }
  }, [handleStepChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Dispose resources if component unmounts
      // Optionally: DrumMachine.dispose()
    }
  }, [])

  return {
    // State
    isPlaying,
    currentStep,
    bpm,
    isInitialized,
    barCount,
    activeBarIndex,

    // Control methods
    play,
    stop,
    updateBPM,

    // Multi-bar methods
    initializeBarCount,
    goToBar,

    // Grid methods
    setGridCell,
    getGridCell,
    setPattern,
    getPattern,

    // Direct access to drum machine (if needed)
    drumMachine: DrumMachine,
  }
}
