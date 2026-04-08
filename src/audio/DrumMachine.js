import * as Tone from 'tone'

/**
 * DrumMachine - Audio engine for the polyrhythmic sequencer
 * Manages Tone.js setup, sound synthesis, sequencing, and transport control
 */
class DrumMachine {
  constructor() {
    this.isInitialized = false
    this.isPlaying = false
    this.currentStep = 0
    this.stepCallbacks = [] // Callbacks for UI playhead updates

    // Sound sources
    this.synths = {
      kick: null,
      snare: null,
      hihat: null,
      guest: null, // Guest = Bass in your UI
      host: null,   // Host = Keyboard in your UI
    }

    // Sequence tracking
    this.sequence = null
    this.gridState = {
      kick: new Array(16).fill(false),
      snare: new Array(16).fill(false),
      hihat: new Array(16).fill(false),
      guest: new Array(16).fill(false),
      host: new Array(16).fill(false),
    }
  }

  /**
   * Initialize the audio context and create synths
   * Must be called after a user gesture (e.g., Play button click)
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      // Initialize Tone.js audio context
      await Tone.start()
      console.log('Tone.js audio context started')

      // Set up Transport
      Tone.Transport.bpm.value = 120
      Tone.Transport.timeSignature = [4, 4]

      // Create sound sources
      this.createSynths()

      this.isInitialized = true
      console.log('DrumMachine initialized')
    } catch (error) {
      console.error('Failed to initialize DrumMachine:', error)
      throw error
    }
  }

  /**
   * Create all synthesizers and drums
   */
  createSynths() {
    // Kick drum - deep, punchy bass
    this.synths.kick = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.1,
      },
    }).toDestination()

    // Snare - noise-based
    this.synths.snare = new Tone.NoiseSynth({
      type: 'pink',
      envelope: {
        attack: 0.001,
        decay: 0.15,
        sustain: 0,
        release: 0.05,
      },
    }).toDestination()

    // Hi-Hat - short, bright noise
    this.synths.hihat = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 0.05,
        release: 0.01,
      },
      harmonicity: 12,
      resonance: 3000,
      volume: -10,
    }).toDestination()

    // Guest (Bass) - low synth pad
    this.synths.guest = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.5,
      },
    }).toDestination()

    // Host (Keyboard) - bright melodic synth
    this.synths.host = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.3,
      },
    }).toDestination()
  }

  /**
   * Trigger a drum sound by instrument name
   */
  triggerDrum(instrumentName) {
    if (!this.isInitialized) return

    const synth = this.synths[instrumentName]
    if (!synth) {
      console.warn(`Instrument not found: ${instrumentName}`)
      return
    }

    const now = Tone.now()

    switch (instrumentName) {
      case 'kick':
        synth.triggerAttackRelease('C1', '0.5', now)
        break
      case 'snare':
        synth.triggerAttackRelease('32n', now)
        break
      case 'hihat':
        synth.triggerAttackRelease('16n', now)
        break
      case 'guest':
        // Bass - play a low note
        synth.triggerAttackRelease('C2', '0.25', now)
        break
      case 'host':
        // Keyboard - play a melodic note
        synth.triggerAttackRelease('G3', '0.25', now)
        break
      default:
        break
    }
  }

  /**
   * Set the state of a grid cell (step/instrument)
   */
  setGridCell(instrumentName, step, isActive) {
    if (this.gridState[instrumentName] === undefined) return
    this.gridState[instrumentName][step] = isActive
  }

  /**
   * Get the state of a grid cell
   */
  getGridCell(instrumentName, step) {
    return this.gridState[instrumentName]?.[step] ?? false
  }

  /**
   * Create and start the 16-step sequence
   */
  startSequence() {
    if (!this.isInitialized) return

    // Stop any existing sequence
    if (this.sequence) {
      this.sequence.dispose()
    }

    // Create 16-step sequence
    const steps = Array.from({ length: 16 }, (_, i) => i)
    this.sequence = new Tone.Sequence(
      (time, step) => {
        this.currentStep = step
        this.notifyStepChange(step)

        // Trigger all active instruments for this step
        Object.keys(this.gridState).forEach((instrumentName) => {
          if (this.gridState[instrumentName][step]) {
            Tone.Transport.schedule(() => {
              this.triggerDrum(instrumentName)
            }, time)
          }
        })
      },
      steps,
      '16n' // 16th note subdivisions
    )

    this.sequence.start(0)
  }

  /**
   * Start playback
   */
  play() {
    if (!this.isInitialized) {
      console.warn('DrumMachine not initialized. Call initialize() first.')
      return
    }

    if (!this.isPlaying) {
      this.startSequence()
      Tone.Transport.start()
      this.isPlaying = true
      console.log('Playback started')
    }
  }

  /**
   * Stop playback
   */
  stop() {
    if (this.isPlaying) {
      Tone.Transport.stop()
      Tone.Transport.position = 0
      this.currentStep = 0
      this.notifyStepChange(0)
      this.isPlaying = false
      console.log('Playback stopped')
    }
  }

  /**
   * Set BPM
   */
  setBPM(bpm) {
    if (this.isInitialized) {
      Tone.Transport.bpm.value = Math.max(20, Math.min(300, bpm))
    }
  }

  /**
   * Get current BPM
   */
  getBPM() {
    return Tone.Transport.bpm.value
  }

  /**
   * Register a callback for step changes (for UI playhead tracking)
   */
  onStepChange(callback) {
    this.stepCallbacks.push(callback)
  }

  /**
   * Notify all listeners of step change
   */
  notifyStepChange(step) {
    this.stepCallbacks.forEach((callback) => callback(step))
  }

  /**
   * Dispose and clean up
   */
  dispose() {
    if (this.sequence) {
      this.sequence.dispose()
    }
    Object.values(this.synths).forEach((synth) => {
      if (synth) synth.dispose()
    })
    if (this.isPlaying) {
      this.stop()
    }
  }

  /**
   * Get playback state
   */
  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      bpm: this.getBPM(),
    }
  }

  /**
   * Update grid state for multiple steps at once
   */
  setGridPattern(instrumentName, pattern) {
    if (this.gridState[instrumentName]) {
      this.gridState[instrumentName] = [...pattern]
    }
  }

  /**
   * Get grid state for an instrument
   */
  getGridPattern(instrumentName) {
    return this.gridState[instrumentName] ? [...this.gridState[instrumentName]] : []
  }
}

// Export singleton instance
export default new DrumMachine()
