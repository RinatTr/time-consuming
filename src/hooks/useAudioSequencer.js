import { useEffect, useState, useRef, useCallback } from 'react'
import { generatePhrase } from '../audio/phraseGenerator'
import { PARTS_LIBRARY } from '../audio/partsLibrary'
import { getNoteValue } from '../audio/phraseCalculator'

const INSTRUMENT_IDS = ['kick', 'snare', 'hihat', 'bass', 'keys', 'guitar']

const DEFAULT_CONFIG = {
  barCount: 1,
  groupingOption: 3,
  hostMeter: '4/4',
  subdivision: '16th',
}

const DEFAULT_ROLE_ASSIGNMENT = {
  kick: 'host',
  snare: 'host',
  hihat: 'guest',
  bass: 'host',
  keys: 'guest',
  guitar: 'guest',
}

/**
 * Generate both role variants for every instrument for one musical config.
 * These generated patterns become the mutable in-memory working copies for
 * the current page session.
 */
function createPatternSession(config, roleAssignment) {
  const allHostRoles = Object.fromEntries(
    INSTRUMENT_IDS.map((instrumentId) => [instrumentId, 'host'])
  )

  const allGuestRoles = Object.fromEntries(
    INSTRUMENT_IDS.map((instrumentId) => [instrumentId, 'guest'])
  )

  const hostResult = generatePhrase(config, PARTS_LIBRARY, allHostRoles)
  const guestResult = generatePhrase(config, PARTS_LIBRARY, allGuestRoles)

  const workingPatterns = {}
  const activePatterns = {}

  INSTRUMENT_IDS.forEach((instrumentId) => {
    workingPatterns[instrumentId] = {
      host: [...hostResult.patterns[instrumentId]],
      guest: [...guestResult.patterns[instrumentId]],
    }

    const activeRole = roleAssignment[instrumentId] || 'host'

    activePatterns[instrumentId] = [
      ...workingPatterns[instrumentId][activeRole],
    ]
  })

  return {
    workingPatterns,
    activePatterns,
    groupings: hostResult.groupings,
    stepsPerBar: hostResult.stepsPerBar,
  }
}

function loadPatternsIntoDrumMachine(drumMachine, patterns) {
  Object.entries(patterns).forEach(([instrumentId, pattern]) => {
    drumMachine.setGridPattern(instrumentId, pattern)
  })
}

/**
 * useAudioSequencer - Custom hook for managing drum machine state and playback
 * Handles initialization, playback control, BPM updates, bar selection,
 * parametric phrase generation, and per-role working pattern persistence.
 *
 * Pattern persistence rules:
 * - Every instrument has a separate Host and Guest working pattern.
 * - Nub edits mutate only the currently active role's working pattern.
 * - Role toggles restore the saved working pattern for the new role.
 * - Play/Stop never regenerate patterns.
 * - Config changes reset all Host/Guest working patterns to generated defaults.
 * - Refresh/remount naturally resets the in-memory working patterns.
 *
 * @param {DrumMachine} drumMachine - The DrumMachine instance owned by AudioSequencerProvider.
 *   Passed as a parameter (not imported) so the provider controls the instance lifecycle,
 *   preventing HMR hot-reload from orphaning the audio graph. See DrumMachine.js for rationale.
 */
export function useAudioSequencer(drumMachine) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [bpm, setBpm] = useState(100)
  const [isInitialized, setIsInitialized] = useState(false)
  const [barCount, setBarCount] = useState(DEFAULT_CONFIG.barCount)
  const [activeBarIndex, setActiveBarIndex] = useState(0)

  // `currentStep` is transport position; `activeBarIndex` is the displayed page.
  // They normally track together during playback, but intentionally diverge
  // while stopped when the user pages through bars.
  const activeBarIndexRef = useRef(0)
  const isPlayingRef = useRef(false)

  // Parametric state
  const [groupingOption, setGroupingOption] = useState(
    DEFAULT_CONFIG.groupingOption
  )

  const [hostMeter, setHostMeter] = useState(
    DEFAULT_CONFIG.hostMeter
  )

  const [subdivision, setSubdivision] = useState(
    DEFAULT_CONFIG.subdivision
  )

  const [roleAssignment, setRoleAssignment] = useState(
    DEFAULT_ROLE_ASSIGNMENT
  )

  // Keep synchronous refs for callbacks that must update the audio engine
  // immediately, without waiting for React state to commit.
  const roleAssignmentRef = useRef(DEFAULT_ROLE_ASSIGNMENT)
  const configRef = useRef(DEFAULT_CONFIG)
  const bpmRef = useRef(100)

  // Build the initial display + both role-specific working copies immediately.
  // No Tone/audio initialization is needed for this.
  const initialPatternSessionRef = useRef(null)

  if (initialPatternSessionRef.current === null) {
    initialPatternSessionRef.current = createPatternSession(
      DEFAULT_CONFIG,
      DEFAULT_ROLE_ASSIGNMENT
    )
  }

  const initialPatternSession =
    initialPatternSessionRef.current

  // Canonical session memory for Host/Guest edits. A ref is used so rapid nub
  // edits and role changes always see the latest working copy synchronously.
  const workingPatternsRef = useRef(
    initialPatternSession.workingPatterns
  )

  // `patterns` contains only the currently active role pattern for each
  // instrument. RhythmGrid renders from this object.
  const [patterns, setPatterns] = useState(
    initialPatternSession.activePatterns
  )

  const patternsRef = useRef(
    initialPatternSession.activePatterns
  )

  // Groupings and steps tracking for grid rendering and playback.
  const [currentGroupings, setCurrentGroupings] = useState(
    initialPatternSession.groupings
  )

  const [currentStepsPerBar, setCurrentStepsPerBar] =
    useState(initialPatternSession.stepsPerBar)

  const currentStepsPerBarRef = useRef(
    initialPatternSession.stepsPerBar
  )

  // Instrument selection and pattern editing state
  const [selectedInstrument, setSelectedInstrument] =
    useState(null)

  // Prevent duplicate async audio initialization while samples are loading.
  const initializationPromiseRef = useRef(null)

  // The initial pattern session already corresponds to the initial config, so
  // the config-reset effect should only run after an actual config change.
  const didMountConfigEffectRef = useRef(false)

  /**
   * Toggle instrument selection
   * Select if not selected, deselect if already selected.
   */
  const selectInstrument = useCallback((id) => {
    setSelectedInstrument((prev) =>
      prev === id ? null : id
    )
  }, [])

  // DEBUG: Log all state updates
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[useAudioSequencer STATE] barCount=${barCount}, activeBarIndex=${activeBarIndex}, ` +
          `isPlaying=${isPlaying}, grouping=${groupingOption}, meter=${hostMeter}, subdivision=${subdivision}`
      )
    }
  }, [
    barCount,
    activeBarIndex,
    isPlaying,
    groupingOption,
    hostMeter,
    subdivision,
  ])

  /**
   * Initialize Tone/audio only.
   *
   * Critically, this does NOT generate a new phrase.
   *
   * It loads the already-current working patterns, preserving edits made
   * before the first Play.
   */
  const initializeAudio = async () => {
    if (isInitialized) return

    if (initializationPromiseRef.current) {
      await initializationPromiseRef.current
      return
    }

    initializationPromiseRef.current = (async () => {
      try {
        await drumMachine.initialize()

        drumMachine.setBPM(bpmRef.current)

        loadPatternsIntoDrumMachine(
          drumMachine,
          patternsRef.current
        )

        drumMachine.setTimeSignature(
          configRef.current.hostMeter
        )

        setIsInitialized(true)
      } catch (error) {
        console.error(
          'Failed to initialize audio:',
          error
        )

        throw error
      } finally {
        initializationPromiseRef.current = null
      }
    })()

    await initializationPromiseRef.current
  }

  /**
   * Config changes are the only regeneration/reset boundary after page load.
   *
   * Any bar count, guest grouping, host meter, or subdivision change discards
   * every saved Host/Guest edit for every instrument and creates fresh defaults.
   *
   * Role assignment itself is intentionally NOT a dependency here.
   * Role changes restore saved working patterns instead of regenerating them.
   */
  useEffect(() => {
    if (!didMountConfigEffectRef.current) {
      didMountConfigEffectRef.current = true
      return
    }

    const config = {
      barCount,
      groupingOption,
      hostMeter,
      subdivision,
    }

    configRef.current = config

    const nextSession = createPatternSession(
      config,
      roleAssignmentRef.current
    )

    workingPatternsRef.current =
      nextSession.workingPatterns

    patternsRef.current =
      nextSession.activePatterns

    currentStepsPerBarRef.current =
      nextSession.stepsPerBar

    setPatterns(nextSession.activePatterns)
    setCurrentGroupings(nextSession.groupings)
    setCurrentStepsPerBar(nextSession.stepsPerBar)

    // Keep the displayed page valid when bar count shrinks.
    // Other config changes preserve whichever bar the user was viewing.
    const clampedBarIndex = Math.min(
      activeBarIndexRef.current,
      Math.max(0, barCount - 1)
    )

    activeBarIndexRef.current =
      clampedBarIndex

    setActiveBarIndex(clampedBarIndex)

    // If audio was initialized already, immediately replace the engine's
    // active grids with the fresh defaults for the new config.
    if (drumMachine.isInitialized) {
      loadPatternsIntoDrumMachine(
        drumMachine,
        nextSession.activePatterns
      )

      drumMachine.setTimeSignature(hostMeter)
    }
  }, [
    barCount,
    groupingOption,
    hostMeter,
    subdivision,
    drumMachine,
  ])

  /**
   * Navigate to a specific bar
   * Only allowed when stopped.
   */
  const goToBar = useCallback(
    (barIndex) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[goToBar] called with barIndex=${barIndex}, isPlaying=${isPlaying}, barCount=${barCount}`
        )
      }

      if (
        isPlaying ||
        barIndex < 0 ||
        barIndex >= barCount
      ) {
        if (
          process.env.NODE_ENV === 'development'
        ) {
          console.log(
            `[goToBar] BLOCKED: isPlaying=${isPlaying}, barIndex in range=${
              barIndex >= 0 &&
              barIndex < barCount
            }`
          )
        }

        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[goToBar] Setting activeBarIndex to ${barIndex}`
        )
      }

      activeBarIndexRef.current = barIndex
      setActiveBarIndex(barIndex)
    },
    [isPlaying, barCount]
  )

  /**
   * Start playback.
   *
   * Play never regenerates or resets patterns.
   */
  const play = async () => {
    if (!isInitialized) {
      await initializeAudio()
    }

    const activeConfig = configRef.current

    const stepCount =
      activeConfig.barCount *
      currentStepsPerBarRef.current

    const noteValue = getNoteValue(
      activeConfig.subdivision
    )

    // Transport always starts from phrase step 0 after Stop.
    //
    // If the user was manually viewing another bar while stopped,
    // return the display to Bar 1 immediately when playback starts.
    // Subsequent step callbacks auto-follow.
    activeBarIndexRef.current = 0
    setActiveBarIndex(0)

    drumMachine.play(stepCount, noteValue)

    isPlayingRef.current = true
    setIsPlaying(true)
  }

  /**
   * Stop playback.
   *
   * Transport returns to phrase step 0, but the displayed bar remains the
   * last bar that was visible during playback.
   *
   * DrumMachine.stop() emits a step-0 notification, so isPlayingRef is
   * cleared first to prevent that callback from auto-following the display
   * back to Bar 1.
   */
  const stop = () => {
    isPlayingRef.current = false

    drumMachine.stop()

    setIsPlaying(false)
    setCurrentStep(0)
  }

  /**
   * Update BPM.
   */
  const updateBPM = (newBpm) => {
    // BPM clamped between 0 and 260 in UI.
    bpmRef.current = newBpm

    drumMachine.setBPM(newBpm)

    setBpm(newBpm)
  }

  /**
   * Set one grid cell active/inactive.
   *
   * The edit is written to:
   * 1. the current instrument+role working copy,
   * 2. the active React display pattern,
   * 3. DrumMachine.gridState for immediate playback effect.
   */
  const setGridCell = useCallback(
    (
      instrumentName,
      step,
      isActive
    ) => {
      const role =
        roleAssignmentRef.current[
          instrumentName
        ]

      const instrumentWorkingPatterns =
        workingPatternsRef.current[
          instrumentName
        ]

      if (
        !role ||
        !instrumentWorkingPatterns?.[role]
      ) {
        return
      }

      const updatedRolePattern = [
        ...instrumentWorkingPatterns[role],
      ]

      if (
        step < 0 ||
        step >= updatedRolePattern.length
      ) {
        return
      }

      updatedRolePattern[step] = isActive

      workingPatternsRef.current = {
        ...workingPatternsRef.current,

        [instrumentName]: {
          ...instrumentWorkingPatterns,

          [role]: updatedRolePattern,
        },
      }

      const nextPatterns = {
        ...patternsRef.current,

        [instrumentName]: [
          ...updatedRolePattern,
        ],
      }

      patternsRef.current = nextPatterns

      setPatterns(nextPatterns)

      // Works both before and after Tone initialization.
      //
      // Before first Play, initializeAudio() will still load the complete
      // active pattern set, so a pre-Play edit cannot be lost.
      drumMachine.setGridCell(
        instrumentName,
        step,
        isActive
      )
    },
    [drumMachine]
  )

  /**
   * Get grid cell state from the hook's active working pattern.
   *
   * This is the source of truth even before the audio engine has initialized.
   */
  const getGridCell = (
    instrumentName,
    step
  ) => {
    return (
      patternsRef.current[
        instrumentName
      ]?.[step] ?? false
    )
  }

  /**
   * Replace the entire active pattern for an instrument.
   *
   * The replacement belongs to the instrument's currently assigned role.
   */
  const setPattern = (
    instrumentName,
    pattern
  ) => {
    const role =
      roleAssignmentRef.current[
        instrumentName
      ]

    const instrumentWorkingPatterns =
      workingPatternsRef.current[
        instrumentName
      ]

    if (
      !role ||
      !instrumentWorkingPatterns?.[role]
    ) {
      return
    }

    const nextPattern = [...pattern]

    workingPatternsRef.current = {
      ...workingPatternsRef.current,

      [instrumentName]: {
        ...instrumentWorkingPatterns,

        [role]: nextPattern,
      },
    }

    const nextPatterns = {
      ...patternsRef.current,

      [instrumentName]: [
        ...nextPattern,
      ],
    }

    patternsRef.current = nextPatterns

    setPatterns(nextPatterns)

    drumMachine.setGridPattern(
      instrumentName,
      nextPattern
    )
  }

  /**
   * Get a copy of the active pattern for an instrument.
   */
  const getPattern = (
    instrumentName
  ) => {
    return patternsRef.current[
      instrumentName
    ]
      ? [
          ...patternsRef.current[
            instrumentName
          ],
        ]
      : []
  }

  /**
   * Update bar count.
   *
   * Blocked during playback.
   * The config-reset effect regenerates all Host/Guest working patterns.
   */
  const updateBarCount = useCallback(
    (n) => {
      if (
        isPlaying ||
        n < 1 ||
        n > 4
      ) {
        return
      }

      configRef.current = {
        ...configRef.current,
        barCount: n,
      }

      setBarCount(n)

      // Pagination is display-only.
      //
      // Preserve the current page when possible.
      // When shrinking the phrase, clamp to the last remaining bar.
      const nextBarIndex = Math.min(
        activeBarIndexRef.current,
        n - 1
      )

      activeBarIndexRef.current =
        nextBarIndex

      setActiveBarIndex(nextBarIndex)
    },
    [isPlaying]
  )

  /**
   * Update grouping option.
   *
   * Blocked during playback.
   * The config-reset effect regenerates all Host/Guest working patterns.
   */
  const updateGroupingOption =
    useCallback(
      (n) => {
        if (isPlaying) return

        configRef.current = {
          ...configRef.current,
          groupingOption: n,
        }

        setGroupingOption(n)
      },
      [isPlaying]
    )

  /**
   * Update host meter.
   *
   * Blocked during playback.
   * The config-reset effect regenerates all Host/Guest working patterns.
   */
  const updateHostMeter = useCallback(
    (meter) => {
      if (isPlaying) return

      configRef.current = {
        ...configRef.current,
        hostMeter: meter,
      }

      setHostMeter(meter)
    },
    [isPlaying]
  )

  /**
   * Update subdivision.
   *
   * Blocked during playback.
   * The config-reset effect regenerates all Host/Guest working patterns.
   */
  const updateSubdivision = useCallback(
    (sub) => {
      if (isPlaying) return

      configRef.current = {
        ...configRef.current,
        subdivision: sub,
      }

      setSubdivision(sub)
    },
    [isPlaying]
  )

  /**
   * Update one instrument's role.
   *
   * Role changes are allowed during playback.
   *
   * They never regenerate patterns.
   *
   * Instead, the saved working pattern for the destination role immediately
   * becomes both the displayed pattern and the DrumMachine pattern.
   */
  const setInstrumentRole = useCallback(
    (
      instrumentId,
      role
    ) => {
      if (
        role !== 'host' &&
        role !== 'guest'
      ) {
        return
      }

      const savedPattern =
        workingPatternsRef.current[
          instrumentId
        ]?.[role]

      if (!savedPattern) return

      const nextRoleAssignment = {
        ...roleAssignmentRef.current,

        [instrumentId]: role,
      }

      // Update ref synchronously so a nub click immediately following the
      // role switch belongs to the new role.
      roleAssignmentRef.current =
        nextRoleAssignment

      setRoleAssignment(
        nextRoleAssignment
      )

      const nextPatterns = {
        ...patternsRef.current,

        [instrumentId]: [
          ...savedPattern,
        ],
      }

      patternsRef.current = nextPatterns

      setPatterns(nextPatterns)

      // Immediate engine swap:
      //
      // Playback continues and subsequent sequencer evaluations read the
      // newly selected role pattern.
      drumMachine.setGridPattern(
        instrumentId,
        savedPattern
      )
    },
    [drumMachine]
  )

  // Memoize step change handler to prevent re-creating it on every render.
  //
  // currentStep always follows the transport.
  // The displayed page only auto-follows while playback is actually running.
  const handleStepChange = useCallback(
    (globalStep) => {
      // Ignore stop/reset notifications and any stale Tone.Draw callbacks
      // after playback has ended.
      //
      // stop() owns the stopped transport position (step 0).
      if (!isPlayingRef.current) return

      setCurrentStep(globalStep)

      const newBarIndex = Math.floor(
        globalStep /
          currentStepsPerBar
      )

      activeBarIndexRef.current =
        newBarIndex

      setActiveBarIndex(newBarIndex)
    },
    [currentStepsPerBar]
  )

  // Subscribe to step changes for playhead tracking and auto-follow.
  useEffect(() => {
    drumMachine.onStepChange(
      handleStepChange
    )

    return () => {
      drumMachine.offStepChange(
        handleStepChange
      )
    }
  }, [drumMachine, handleStepChange])

  // DrumMachine disposal is handled by AudioSequencerProvider's cleanup.
  // The hook does not own the instance lifetime.

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

    // Direct access to DrumMachine
    drumMachine,
  }
}