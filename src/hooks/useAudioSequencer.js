import { useEffect, useState, useRef, useCallback } from 'react'
import DrumMachine from '../audio/DrumMachine'
import { generatePhrase } from '../audio/phraseGenerator'
import { PARTS_LIBRARY } from '../audio/partsLibrary'
import { getNoteValue } from '../audio/phraseCalculator'

/**
 * useAudioSequencer - Custom hook for managing drum machine state and playback
 * Handles initialization, playback control, BPM updates, bar selection, and parametric phrase generation
 */
export function useAudioSequencer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [bpm, setBpm] = useState(100)
  const [isInitialized, setIsInitialized] = useState(false)
  const [barCount, setBarCount] = useState(1)
  const [activeBarIndex, setActiveBarIndex] = useState(0)
  
  // New parametric state
  const [groupingOption, setGroupingOption] = useState(3)
  const [hostMeter, setHostMeter] = useState('4/4')
  const [subdivision, setSubdivision] = useState('16th')
  const [roleAssignment, setRoleAssignment] = useState({
    kick: 'host',
    snare: 'host',
    hihat: 'guest',
    bass: 'host',
    keys: 'guest',
    guitar: 'guest',
  })
  
  // Instrument selection and pattern editing state
  const [selectedInstrument, setSelectedInstrument] = useState(null)
  const [patterns, setPatterns] = useState({
    kick: new Array(80).fill(false),
    snare: new Array(80).fill(false),
    hihat: new Array(80).fill(false),
    bass: new Array(80).fill(false),
    keys: new Array(80).fill(false),
    guitar: new Array(80).fill(false),
  })

  /**
   * Toggle instrument selection (select if not selected, deselect if already selected)
   */
  const selectInstrument = useCallback((id) => {
    setSelectedInstrument(prev => prev === id ? null : id)
  }, [])
  
  useEffect(() => {
    if (!isInitialized) {
      //initialize for rhythm grid to display on first load
      initializeDisplay()
    }
  }, [barCount, groupingOption, hostMeter, subdivision, roleAssignment])

  const initializeDisplay = async () => {
    if (isInitialized) return
    
    const config = { barCount, groupingOption, hostMeter, subdivision }
    const result = generatePhrase(config, PARTS_LIBRARY, roleAssignment)
    
    setCurrentGroupings(result.groupings)
    setCurrentStepsPerBar(result.stepsPerBar)
  } 

  // Groupings and steps tracking and defaults for grid module rendering
  const [currentGroupings, setCurrentGroupings] = useState({host: [], guest: []})
  const [currentStepsPerBar, setCurrentStepsPerBar] = useState(16)
  
  const initializingRef = useRef(false)

  // DEBUG: Log all state updates
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[useAudioSequencer STATE] barCount=${barCount}, activeBarIndex=${activeBarIndex}, ` +
        `isPlaying=${isPlaying}, grouping=${groupingOption}, meter=${hostMeter}, subdivision=${subdivision}`
      )
    }
  }, [barCount, activeBarIndex, isPlaying, groupingOption, hostMeter, subdivision])

  const initializeAudio = async () => {
    if (initializingRef.current || isInitialized) return

    initializingRef.current = true
    try {
      await DrumMachine.initialize()
      setBpm(DrumMachine.getBPM())
      
      // Generate initial phrase with default config
      const config = { barCount, groupingOption, hostMeter, subdivision }
      const result = generatePhrase(config, PARTS_LIBRARY, roleAssignment)
      
      Object.entries(result.patterns).forEach(([id, pattern]) => {
        DrumMachine.setGridPattern(id, pattern)
      })
      setPatterns(result.patterns)
      
      DrumMachine.setTimeSignature(hostMeter)
      setCurrentGroupings(result.groupings)
      setCurrentStepsPerBar(result.stepsPerBar)
      
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      initializingRef.current = false
    }
  }

  /**
   * Regeneration effect: when config or role assignment changes (and not playing),
   * regenerate the phrase and load it into DrumMachine.
   */
  useEffect(() => {
    if (isPlaying) return
    if (!isInitialized) return

    const config = { barCount, groupingOption, hostMeter, subdivision }
    const result = generatePhrase(config, PARTS_LIBRARY, roleAssignment)

    Object.entries(result.patterns).forEach(([id, pattern]) => {
      DrumMachine.setGridPattern(id, pattern)
    })
    setPatterns(result.patterns)

    DrumMachine.setTimeSignature(hostMeter)
    setCurrentGroupings(result.groupings)
    setCurrentStepsPerBar(result.stepsPerBar)
  }, [barCount, groupingOption, hostMeter, subdivision, roleAssignment, isPlaying, isInitialized])

  /**
   * Navigate to a specific bar (only when stopped)
   */
  const goToBar = useCallback(
    (barIndex) => {
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
    },
    [isPlaying, barCount]
  )

  /**
   * Start playback
   */
  const play = async () => {
    if (!isInitialized) {
      await initializeAudio()
    }
    const stepCount = barCount * currentStepsPerBar
    const noteValue = getNoteValue(subdivision)
    DrumMachine.play(stepCount, noteValue)
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
    // BPM Clamped between 0 and 260 in UI
    DrumMachine.setBPM(newBpm)
    setBpm(newBpm)
  }

  /**
   * Set grid cell active/inactive
   */
  const setGridCell = useCallback((instrumentName, step, isActive) => {
    DrumMachine.setGridCell(instrumentName, step, isActive)
    setPatterns(prev => {
      const updated = [...prev[instrumentName]]
      updated[step] = isActive
      return { ...prev, [instrumentName]: updated }
    })
  }, [])

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

  /**
   * Update bar count (blocked during playback)
   */
  const updateBarCount = useCallback(
    (n) => {
      if (isPlaying || n < 1 || n > 4) return
      setBarCount(n)
      setActiveBarIndex(0)
    },
    [isPlaying]
  )

  /**
   * Update grouping option (blocked during playback)
   */
  const updateGroupingOption = useCallback(
    (n) => {
      if (isPlaying) return
      setGroupingOption(n)
    },
    [isPlaying]
  )

  /**
   * Update host meter (blocked during playback)
   */
  const updateHostMeter = useCallback(
    (meter) => {
      if (isPlaying) return
      setHostMeter(meter)
    },
    [isPlaying]
  )

  /**
   * Update subdivision (blocked during playback)
   */
  const updateSubdivision = useCallback(
    (sub) => {
      if (isPlaying) return
      setSubdivision(sub)
    },
    [isPlaying]
  )

  /**
   * Update a single instrument's role (blocked during playback)
   */
  const setInstrumentRole = useCallback(
    (instrumentId, role) => {
      if (isPlaying) return
      setRoleAssignment((prev) => ({ ...prev, [instrumentId]: role }))
    },
    [isPlaying]
  )

  // Memoize step change handler to prevent re-creating it on every render
  const handleStepChange = useCallback((globalStep) => {
    setCurrentStep(globalStep)

    // Auto-follow: update activeBarIndex during playback
    const newBarIndex = Math.floor(globalStep / currentStepsPerBar)
    setActiveBarIndex(newBarIndex)
  }, [currentStepsPerBar])

  // Subscribe to step changes for playhead tracking and auto-follow during playback
  useEffect(() => {
    DrumMachine.onStepChange(handleStepChange)

    return () => {
      DrumMachine.offStepChange(handleStepChange)
    }
  }, [handleStepChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    groupingOption,
    hostMeter,
    subdivision,
    roleAssignment,
    currentGroupings,
    currentStepsPerBar,
    selectedInstrument,
    patterns,

    // Control methods
    play,
    stop,
    updateBPM,

    // Multi-bar methods
    goToBar,
    updateBarCount,

    // Config update methods
    updateGroupingOption,
    updateHostMeter,
    updateSubdivision,
    setInstrumentRole,

    // Grid methods
    setGridCell,
    getGridCell,
    setPattern,
    getPattern,
    selectInstrument,

    // Direct access to drum machine (if needed)
    drumMachine: DrumMachine,
  }
}
