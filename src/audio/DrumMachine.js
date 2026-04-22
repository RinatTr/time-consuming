import * as Tone from 'tone'
import { getToneTimeSignature } from './phraseCalculator'

/**
 * DrumMachine - Audio engine for the polyrhythmic sequencer
 * Manages Tone.js setup, sound synthesis, sequencing, and transport control
 */
class DrumMachine {
  constructor() {
    this.isInitialized = false
    this.isPlaying = false
    this.currentStep = 0
    this.stepCallbacks = []

    this.synths = {
      kick: null,
      snare: null,
      snareBody: null, // internal — layered with snare, not a separate grid track
      hihat: null,
      bass: null,
      keys: null,
      guitar: null,
    }

    // Intermediate routing nodes that need explicit disposal
    this.nodes = {
      snareHPF: null,
      keysChorus: null,
      hihatHPF: null,
      guitarDistortion: null,
    }

    this.sequence = null
    this.gridState = {
      kick: new Array(80).fill(false),
      snare: new Array(80).fill(false),
      hihat: new Array(80).fill(false),
      bass: new Array(80).fill(false),
      keys: new Array(80).fill(false),
      guitar: new Array(80).fill(false),
    }
  }

  /**
   * Initialize the audio context and create synths.
   * the bpm and time signature are hard coded but configured through the ui controls
   * Must be called after a user gesture (e.g., Play button click).
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      await Tone.start()
      Tone.getTransport().bpm.value = 100
      Tone.getTransport().timeSignature = [4, 4]
      this.createSynths()
      this.isInitialized = true
      if (process.env.NODE_ENV === 'development') {
        console.log('DrumMachine initialized')
      }
    } catch (error) {
      console.error('Failed to initialize DrumMachine:', error)
      throw error
    }
  }

  /**
   * Create all synthesizers and routing nodes.
   */
  createSynths() {
    // --- Kick ---
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

    // --- Snare ---
    // HPF stored on this.nodes so it gets properly disposed
    this.nodes.snareHPF = new Tone.Filter({
      frequency: 1800,
      type: 'highpass',
      rolloff: -12,
    }).toDestination()

    // White noise layer — snare wire rattle
    this.synths.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.18,
        sustain: 0,
        release: 0.05,
      },
      volume: -6,
    }).connect(this.nodes.snareHPF)

    // Tonal body layer — shell resonance, triggered alongside snare noise
    this.synths.snareBody = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0,
        release: 0.01,
      },
      volume: -14,
    }).toDestination()

    // --- Hi-Hat --- 
    // HPF stored on this.nodes so it gets properly disposed
    this.nodes.hihatHPF = new Tone.Filter({
      frequency: 8000,
      type: 'highpass',
    }).toDestination()

    this.synths.hihat = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
            attack: 0.001,
            decay: 0.03,
            sustain: 0,
        },
        volume: -8,
          //send dry signal to HPF effect
        }).connect(this.nodes.hihatHPF)

    // --- Bass ---
    this.synths.bass = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.5,
      },
    }).toDestination()

    // --- Keys (EP) ---
    // Slow chorus for classic Rhodes shimmer — stored in this.nodes for disposal
    this.nodes.keysChorus = new Tone.Chorus({
      frequency: 3.5,  // slow, warm modulation
      delayTime: 0.5,
      depth: 0.4,
      wet: 0.4,
      // the start method is needed to trigger the LFO in Tone.Chorus
    }).toDestination().start()

    // fatsine layering 3 detuned sines — mimics the soft tine character of a Rhodes
    
    this.synths.keys = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsine',
        count: 3,   // 3 slightly detuned sine voices layered
        spread: 20, // subtle detune spread in cents
      },
      envelope: {
        attack: 0.02,  // slight bloom
        decay: 0.4,    // longer decay for EP character
        sustain: 0.2,
        release: 0.8,  // ring out naturally
      },
      volume: -8,
      //send dry signal to chorus
    }).connect(this.nodes.keysChorus)
    
      // --- Guitar ---
    this.nodes.guitarDistortion = new Tone.Distortion(0.14).toDestination();

    this.synths.guitar = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'fatsine',
        count: 3,   // layered voices to add richness
        spread: 15,
      },
      envelope: {
      attack: 0, // Tightened for the initial click
      decay: 0.1,    
      sustain: 0.2,
      release: 0.3,  
    },
      volume: -8,
      //send dry signal to distortion
    }).connect(this.nodes.guitarDistortion)
  }

  /**
   * Trigger a sequencer sound by instrument name.
   * Accepts an optional scheduled `time` from the Tone.js audio clock.
   * Falls back to Tone.now() for manual/preview triggers (e.g. pad clicks).
   */
  triggerInstrument(instrumentName, time = Tone.now()) {
    if (!this.isInitialized) return

    switch (instrumentName) {
      case 'kick':
        this.synths.kick.triggerAttackRelease('C1', '0.5', time)
        break
      case 'snare':
        // Both layers triggered at the same scheduled time
        this.synths.snare.triggerAttackRelease('16n', time)
        this.synths.snareBody.triggerAttackRelease(['D2', 'E3'], '32n', time)
        break
      case 'hihat': 
        this.synths.hihat.triggerAttackRelease('16n', time)
        break
      case 'bass':
        this.synths.bass.triggerAttackRelease('C2', '0.25', time)
        break
      case 'keys':
        this.synths.keys.triggerAttackRelease(['G3', 'Bb3', 'D4', 'F4'], '8n', time)
        break
      case 'guitar':
        this.synths.guitar.triggerAttackRelease(['G4', 'G5'], '8n', time)
        break
      default:
        console.warn(`Instrument not found: ${instrumentName}`)
        break
    }
  }

  /**
   * Set the state of a grid cell.
   */
  setGridCell(instrumentName, step, isActive) {
    if (this.gridState[instrumentName] === undefined) return
    this.gridState[instrumentName][step] = isActive
  }

  /**
   * Get the state of a grid cell.
   */
  getGridCell(instrumentName, step) {
    return this.gridState[instrumentName]?.[step] ?? false
  }

  /**
   * Create and start the sequence.
   * @param {number} stepCount - Number of steps to loop through (16, 32, 48, or 64 for multi-bar)
   * @param {string} noteValue - Tone.js note value ('16n' for 16th, '8t' for 8th-triplet, default '16n')
   */
  startSequence(stepCount = 16, noteValue = '16n') {
    if (!this.isInitialized) return

    if (this.sequence) {
      this.sequence.dispose()
    }

    const steps = Array.from({ length: stepCount }, (_, i) => i)

    this.sequence = new Tone.Sequence(
      (time, step) => {
        // Update playhead via Tone.Draw — defers UI callback out of
        // the audio scheduling path to avoid blocking the scheduler
        Tone.getDraw().schedule(() => {
          this.currentStep = step
          this.notifyStepChange(step)
        }, time)

        // Trigger active instruments using the scheduled time directly —
        // no secondary schedule() wrapper needed inside a Sequence callback
        Object.keys(this.gridState).forEach((instrumentName) => {
          if (this.gridState[instrumentName][step]) {
            this.triggerInstrument(instrumentName, time)
          }
        })
      },
      steps,
      noteValue
    )

    this.sequence.start(0)
  }

  /**
   * Start playback.
   * @param {number} stepCount - Number of steps to loop through (16, 32, 48, or 64 for multi-bar)
   * @param {string} noteValue - Tone.js note value ('16n' for 16th, '8t' for 8th-triplet, default '16n')
   */
  play(stepCount = 16, noteValue = '16n') {
    if (!this.isInitialized) {
      console.warn('DrumMachine not initialized. Call initialize() first.')
      return
    }

    if (!this.isPlaying) {
      this.startSequence(stepCount, noteValue)
      Tone.getTransport().start()
      this.isPlaying = true
      if (process.env.NODE_ENV === 'development') {
        console.log('Playback started')
      }
    }
  }

  /**
   * Stop playback.
   */
  stop() {
    if (this.isPlaying) {
      Tone.getTransport().stop()
      Tone.getTransport().position = 0
      this.currentStep = 0
      this.notifyStepChange(0)
      this.isPlaying = false
      if (process.env.NODE_ENV === 'development') {
        console.log('Playback stopped')
      }
    }
  }

  /**
   * Set BPM.
   */
  setBPM(bpm) {
    if (this.isInitialized) {
      Tone.getTransport().bpm.value = Math.max(20, Math.min(300, bpm))
    }
  }

  /**
   * Get current BPM.
   */
  getBPM() {
    return Tone.getTransport().bpm.value
  }

  /**
   * Set the Tone.js time signature.
   * @param {string} hostMeter - '4/4', '5/4', or '6/8'
   */
  setTimeSignature(hostMeter) {
    if (this.isInitialized) {
      Tone.getTransport().timeSignature = getToneTimeSignature(hostMeter)
    }
  }

  /**
   * Register a callback for step changes (UI playhead tracking).
   */
  onStepChange(callback) {
    this.stepCallbacks.push(callback)
  }

  /**
   * Remove a callback for step changes.
   */
  offStepChange(callback) {
    const index = this.stepCallbacks.indexOf(callback)
    if (index > -1) {
      this.stepCallbacks.splice(index, 1)
    }
  }

  /**
   * Notify all listeners of a step change.
   */
  notifyStepChange(step) {
    this.stepCallbacks.forEach((callback) => callback(step))
  }

  /**
   * Dispose and clean up all synths and routing nodes.
   */
  dispose() {
    if (this.isPlaying) this.stop()
    if (this.sequence) this.sequence.dispose()
    Object.values(this.synths).forEach((synth) => synth?.dispose())
    Object.values(this.nodes).forEach((node) => node?.dispose())
  }

  /**
   * Get playback state snapshot.
   */
  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentStep: this.currentStep,
      bpm: this.getBPM(),
    }
  }

  /**
   * Overwrite grid state for an instrument with a full pattern.
   */
  setGridPattern(instrumentName, pattern) {
    if (this.gridState[instrumentName]) {
      this.gridState[instrumentName] = [...pattern]
    }
  }

  /**
   * Get a copy of the grid pattern for an instrument.
   */
  getGridPattern(instrumentName) {
    return this.gridState[instrumentName] ? [...this.gridState[instrumentName]] : []
  }
}

export default new DrumMachine()