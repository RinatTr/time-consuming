import * as Tone from 'tone'
import { getToneTimeSignature } from './phraseCalculator'

// Sample files live next to this module in ./samples. Importing with the `?url`
// suffix asks Vite to resolve each file to its correct dev-server/build URL —
// a bare relative string like './samples/x.mp3' would instead be resolved by
// the browser against the *page* URL at fetch time, not against this module's
// location, which is why that approach 404s.
import kickUrl from './samples/kick.mp3?url'
import snareUrl from './samples/snare.mp3?url'
import hihatUrl from './samples/hh.mp3?url'
import bassUrl from './samples/bassC.mp3?url'
import keysUrl from './samples/keys.mp3?url'
import guitarUrl from './samples/guitar.mp3?url'

const SAMPLE_FILES = {
  kick: kickUrl,
  snare: snareUrl,
  hihat: hihatUrl,
  bass: bassUrl,     // fixed to the C sample — matches prior hardcoded 'C2' trigger
  keys: keysUrl,     // full chord already voiced in the sample, triggered as-is
  guitar: guitarUrl, // full dyad already voiced in the sample, triggered as-is
}

// Short fade applied to every sampler to prevent clicks/pops when a sample is
// cut off early — either by a same-instrument retrigger, or by the tempo-aware
// max-duration cap in triggerInstrument().
const FADE_OUT_SECONDS = 0.02
const FADE_IN_SECONDS = 0.005

/**
 * DrumMachine - Audio engine for the polyrhythmic sequencer
 * Manages Tone.js setup, sample playback, sequencing, and transport control
 */
class DrumMachine {
  constructor() {
    this.isInitialized = false
    this.isPlaying = false
    this.currentStep = 0
    this.stepCallbacks = []

    // One Tone.Sampler per instrument. Each sample is mapped to 'C4'.
    // We enforce mono one-shot behavior by releasing previous voices on retrigger.
    this.synths = {
      kick: null,
      snare: null,
      hihat: null,
      bass: null,
      keys: null,
      guitar: null,
    }

    // Intermediate routing nodes that need explicit disposal.
    this.nodes = {
      // Fail-safe output chain (skill: Phase 7 — Minimum Safe Chain Topology)
      // All sample players route directly through masterLimiter → masterMeter → Destination.
      // Prevents digital clipping when multiple instruments fire simultaneously.
      masterLimiter: null,
      masterMeter: null,
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
   * Initialize the audio context, create routing, and wait for all
   * sample buffers to finish loading.
   * Must be called after a user gesture (e.g., Play button click).
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      await Tone.start()
      Tone.getTransport().bpm.value = 100
      Tone.getTransport().timeSignature = [4, 4]
      
      this.createRouting()
      await this.loadSamples()

      // Monitor AudioContext state transitions (Phase 3 — Lifecycle / Fail-Safety).
      // 'suspended': browser autoplay policy or tab backgrounded.
      // 'interrupted': OS-level interruption (phone call, system alert) — Chrome 2024+.
      const rawCtx = Tone.getContext().rawContext
      this._stateChangeHandler = () => {
        if (rawCtx.state === 'interrupted' || rawCtx.state === 'suspended') {
          if (this.isPlaying) {
            Tone.getTransport().pause()
          }
        }
      }
      rawCtx.addEventListener('statechange', this._stateChangeHandler)

      this._rawCtx = rawCtx
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
   * Create all routing nodes.
   *
   * Output chain (skill: Phase 7 — Fail-Safe Chain Architecture):
   *   All samplers → masterLimiter (-2 dBFS) → masterMeter → Destination
   */
  createRouting() {
    // --- Master output chain (built first so samplers can .connect() into it) ---
    this.nodes.masterLimiter = new Tone.Limiter(-2).toDestination()
    // Meter passively taps the limiter for signal-health diagnostics (dBFS)
    this.nodes.masterMeter = new Tone.Meter({ normalRange: false })
    this.nodes.masterLimiter.connect(this.nodes.masterMeter)

    // Signal health monitor (Phase 7 — Fail-Safe Chain Architecture).
    this._healthMonitorId = setInterval(() => {
      const level = this.nodes.masterMeter?.getValue()
      if (level === undefined || level === null) return
      const db = typeof level === 'number' ? level : Math.max(...level)
      if (!isFinite(db) || isNaN(db)) {
        console.error('[DrumMachine] NaN/Inf signal — possible feedback or uninitialized buffer')
      } else if (db > -2) {
        console.warn(`[DrumMachine] Output near limiter ceiling: ${db.toFixed(1)} dBFS`)
      }
    }, 2000)
  }

  /**
   * Instantiate Samplers and load all sample buffers.
   * Failures are logged per-instrument and do not block the other samples
   * from loading.
   */
  async loadSamples() {
    const loadPromises = Object.entries(SAMPLE_FILES).map(([instrumentName, url]) => {
      return new Promise((resolve, reject) => {
        const sampler = new Tone.Sampler({
          // Map each sample to a generic 'C4' trigger note
          urls: { C4: url },
          attack: FADE_IN_SECONDS,
          release: FADE_OUT_SECONDS,
          volume: 0,
          onload: () => resolve(),
          onerror: (err) => reject(err),
        })

        sampler.connect(this.nodes.masterLimiter)
        this.synths[instrumentName] = sampler

      }).catch((error) => {
        console.warn(`[DrumMachine] Failed to load sample for "${instrumentName}" (${url}):`, error)
      })
    })

    await Promise.all(loadPromises)
  }

  /**
   * Trigger a sequencer sound by instrument name.
   * Accepts an optional scheduled `time` from the Tone.js audio clock.
   * Falls back to Tone.now() for manual/preview triggers (e.g. pad clicks).
   *
   * @param {string} instrumentName
   * @param {number} [time] - scheduled Tone.js time
   * @param {number|null} [maxDuration] - optional cap (seconds) on playback length.
   */
  triggerInstrument(instrumentName, time = Tone.now(), maxDuration = null) {
    if (!this.isInitialized) return

    const sampler = this.synths[instrumentName]
    if (!sampler) {
      console.warn(`Instrument not found: ${instrumentName}`)
      return
    }
    if (!sampler.loaded) {
      console.warn(`[DrumMachine] Sample not yet loaded for "${instrumentName}", skipping trigger`)
      return
    }

    // Mono one-shot behavior: Gracefully fade out the previous hit 
    // over FADE_OUT_SECONDS if it's still ringing.
    sampler.triggerRelease('C4', time)

    // Start the new hit slightly after to avoid the release choking the new attack
    const triggerTime = time + 0.001

    if (maxDuration) {
      // Multiply the step duration so the sample rings out longer than a single step,
      // but still scales proportionally with the current BPM.
      // 2.0 = rings for two steps. 1.5 = rings for one and a half steps.
      const TAIL_MULTIPLIER = 1.25
      const scaledDuration = maxDuration * TAIL_MULTIPLIER
      
      sampler.triggerAttackRelease('C4', scaledDuration, triggerTime)
    } else {
      sampler.triggerAttack('C4', triggerTime)
    }
  }

  /**
   * Set the volume (in dB) for a single instrument's sampler.
   */
  setInstrumentVolume(instrumentName, volumeDb) {
    const sampler = this.synths[instrumentName]
    if (sampler) {
      sampler.volume.value = volumeDb
    }
  }

  /**
   * Get the current volume (in dB) for an instrument's sampler.
   */
  getInstrumentVolume(instrumentName) {
    return this.synths[instrumentName]?.volume.value ?? null
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
        // Update playhead via Tone.Draw
        Tone.getDraw().schedule(() => {
          this.currentStep = step
          this.notifyStepChange(step)
        }, time)

        const stepDuration = Tone.Time(noteValue).toSeconds()

        Object.keys(this.gridState).forEach((instrumentName) => {
          if (this.gridState[instrumentName][step]) {
            this.triggerInstrument(instrumentName, time, stepDuration)
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
   */
  play(stepCount = 16, noteValue = '16n') {
    if (!this.isInitialized) {
      console.warn('DrumMachine not initialized. Call initialize() first.')
      return
    }

    if (!this.isPlaying) {
      this.startSequence(stepCount, noteValue)
      Tone.getTransport().start('+0.1')
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
   * Dispose and clean up all sample players and routing nodes.
   */
  dispose() {
    if (this.isPlaying) this.stop()
    clearInterval(this._healthMonitorId)
    if (this._rawCtx && this._stateChangeHandler) {
      this._rawCtx.removeEventListener('statechange', this._stateChangeHandler)
      this._rawCtx = null
      this._stateChangeHandler = null
    }
    if (this.sequence) {
      this.sequence.dispose()
      this.sequence = null
    }
    Object.values(this.synths).forEach((sampler) => sampler?.dispose())
    Object.values(this.nodes).forEach((node) => node?.dispose())
    
    Object.keys(this.synths).forEach((k) => (this.synths[k] = null))
    Object.keys(this.nodes).forEach((k) => (this.nodes[k] = null))
    
    this.isInitialized = false
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

export { DrumMachine }
export default DrumMachine