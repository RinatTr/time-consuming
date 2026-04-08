import { useEffect, useState, useRef } from 'react'
import DrumMachine from '../audio/DrumMachine'

/**
 * useAudioSequencer - Custom hook for managing drum machine state and playback
 * Handles initialization, playback control, BPM updates, and playhead tracking
 */
export function useAudioSequencer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [bpm, setBpm] = useState(120)
  const [isInitialized, setIsInitialized] = useState(false)
  const initializingRef = useRef(false)

  /**
   * Initialize audio context (must be called from a user gesture)
   */
  const initializeAudio = async () => {
    if (initializingRef.current || isInitialized) return

    initializingRef.current = true
    try {
      await DrumMachine.initialize()
      setIsInitialized(true)
      setBpm(DrumMachine.getBPM())
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      initializingRef.current = false
    }
  }

  /**
   * Start playback
   */
  const play = async () => {
    if (!isInitialized) {
      await initializeAudio()
    }
    DrumMachine.play()
    setIsPlaying(true)
  }

  /**
   * Stop playback
   */
  const stop = () => {
    DrumMachine.stop()
    setIsPlaying(false)
    setCurrentStep(0)
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

  // Subscribe to step changes for playhead tracking
  useEffect(() => {
    const handleStepChange = (step) => {
      setCurrentStep(step)
    }

    DrumMachine.onStepChange(handleStepChange)

    // Cleanup on unmount
    return () => {
      // Note: In a real app, you might want to track and remove listeners
    }
  }, [])

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

    // Control methods
    play,
    stop,
    updateBPM,

    // Grid methods
    setGridCell,
    getGridCell,
    setPattern,
    getPattern,

    // Direct access to drum machine (if needed)
    drumMachine: DrumMachine,
  }
}
