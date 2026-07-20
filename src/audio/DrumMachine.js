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

// Short fade applied to every player to prevent clicks/pops when a sample is
// cut off early — either by a same-instrument retrigger, or by the tempo-aware
// max-duration cap in triggerInstrument(). This is the standard Tone.js approach
// for avoiding discontinuities when stopping a sample before its natural end.
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

    // One Tone.Player per instrument — each sample is triggered as a single
    // mono one-shot voice (no polyphony needed; each sample already contains
    // everything it needs to represent that instrument's hit).
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
   * Initialize the audio context, create sample players, and wait for all
   * sample buffers to finish loading.
   * Must be called after a user gesture (e.g., Play button click).
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      await Tone.start()
      Tone.getTransport().bpm.value = 100
      Tone.getTransport().timeSignature = [4, 4]
      this.createSynths()
      await this.loadSamples()

      // Monitor AudioContext state transitions (Phase 3 — Lifecycle / Fail-Safety).
      // 'suspended': browser autoplay policy or tab backgrounded.
      // 'interrupted': OS-level interruption (phone call, system alert) — Chrome 2024+.
      // Store the handler ref so dispose() can remove it and prevent listener leaks
      // if initialize() is called again after dispose().
      const rawCtx = Tone.getContext().rawContext
      this._stateChangeHandler = () => {
        if (rawCtx.state === 'interrupted' || rawCtx.state === 'suspended') {
          if (this.isPlaying) {
            Tone.getTransport().pause()
            // NOTE: do not set this.isPlaying = false here — the context may
            // resume automatically (e.g. tab re-focus). The caller should listen
            // for this event and update UI accordingly, then call play() again.
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
   * Create all sample players and routing nodes.
   *
   * Output chain (skill: Phase 7 — Fail-Safe Chain Architecture):
   *   All players → masterLimiter (-2 dBFS) → masterMeter → Destination
   *
   * No per-instrument effects (filters/chorus/distortion) are applied — the
   * samples already carry their intended tonal character, so players connect
   * straight into the limiter.
   *
   * Volumes default to 0 dB (neutral) since there's no loudness spec for the
   * samples yet. Use setInstrumentVolume() to tune per-instrument levels later.
   */
  createSynths() {
    // --- Master output chain (built first so players can .connect() into it) ---
    this.nodes.masterLimiter = new Tone.Limiter(-2).toDestination()
    // Meter passively taps the limiter for signal-health diagnostics (dBFS)
    this.nodes.masterMeter = new Tone.Meter({ normalRange: false })
    this.nodes.masterLimiter.connect(this.nodes.masterMeter)

    // Signal health monitor (Phase 7 — Fail-Safe Chain Architecture).
    // Runs on the main thread every 2s — well outside the audio render budget.
    // Catches NaN/Inf (feedback loop, uninitialized buffer) and near-clip conditions
    // that the limiter handles but should still be visible during development.
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

    // --- One Tone.Player per instrument ---
    // fadeOut/fadeIn are set here so every stop (whether from a retrigger cutoff
    // or the tempo-aware max-duration cap) ramps instead of hard-cutting.
    Object.keys(this.synths).forEach((instrumentName) => {
      this.synths[instrumentName] = new Tone.Player({
        fadeOut: FADE_OUT_SECONDS,
        fadeIn: FADE_IN_SECONDS,
        volume: 0,
      }).connect(this.nodes.masterLimiter)
    })
  }

  /**
   * Load all sample buffers and wait for them to finish.
   * Failures are logged per-instrument and do not block the other samples
   * from loading — a missing/broken sample just means that instrument stays
   * silent (triggerInstrument() checks player.loaded before playing).
   */
  async loadSamples() {
    const loadPromises = Object.entries(SAMPLE_FILES).map(([instrumentName, url]) => {
      const player = this.synths[instrumentName]
      return player.load(url).catch((error) => {
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
   *   Passed by the sequencer as the current step interval, so a sample's natural
   *   length can never outlast the step it was triggered on and pile up against
   *   the next retrigger at fast tempos. Manual/preview triggers omit this and
   *   play the sample to its natural length.
   */
  triggerInstrument(instrumentName, time = Tone.now(), maxDuration = null) {
    if (!this.isInitialized) return

    const player = this.synths[instrumentName]
    if (!player) {
      console.warn(`Instrument not found: ${instrumentName}`)
      return
    }
    if (!player.loaded) {
      console.warn(`[DrumMachine] Sample not yet loaded for "${instrumentName}", skipping trigger`)
      return
    }

    // Cut off any still-playing previous hit before retriggering (mono one-shot
    // behavior). The player's fadeOut ramps amplitude down over FADE_OUT_SECONDS
    // instead of hard-stopping, avoiding an audible click/pop on the cutoff.
    if (player.state === 'started') {
      player.stop(time + 0.001)
    }
    player.start(time)

    // Tempo-aware safeguard: cap playback to maxDuration when the sample is
    // longer than the step it was triggered on. Uses the same fadeOut ramp,
    // so shortening a long sample at fast tempos still sounds clean.
    if (maxDuration && player.buffer?.duration > maxDuration) {
      player.stop(time + maxDuration)
    }
  }

  /**
   * Set the volume (in dB) for a single instrument's sample player.
   * No loudness spec exists yet for the samples — this is the hook for tuning
   * per-instrument levels later without touching playback logic.
   */
  setInstrumentVolume(instrumentName, volumeDb) {
    const player = this.synths[instrumentName]
    if (player) {
      player.volume.value = volumeDb
    }
  }

  /**
   * Get the current volume (in dB) for an instrument's sample player.
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
        // Update playhead via Tone.Draw — defers UI callback out of
        // the audio scheduling path to avoid blocking the scheduler
        Tone.getDraw().schedule(() => {
          this.currentStep = step
          this.notifyStepChange(step)
        }, time)

        // Recomputed every step so it tracks the *current* BPM if tempo changes
        // mid-playback — this is the tempo-aware max-duration cap passed into
        // triggerInstrument() below.
        const stepDuration = Tone.Time(noteValue).toSeconds()
        // const stepDuration = 0.1

        // Trigger active instruments using the scheduled time directly —
        // no secondary schedule() wrapper needed inside a Sequence callback
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
      // Start 100ms in the future — avoids scheduling race at t=0
      // (Tone.js wiki: values under 100ms are not perceptible)
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
   * Dispose and clean up all sample players and routing nodes.
   * Safe to call multiple times. After dispose(), initialize() can be called
   * again to rebuild the graph from scratch.
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
    Object.values(this.synths).forEach((player) => player?.dispose())
    Object.values(this.nodes).forEach((node) => node?.dispose())
    // Reset refs so disposed nodes are not double-disposed on a second call
    Object.keys(this.synths).forEach((k) => (this.synths[k] = null))
    Object.keys(this.nodes).forEach((k) => (this.nodes[k] = null))
    // Allow re-initialization (e.g. after a hot reload or session reset)
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

// Export the class, not a pre-constructed instance.
//
// WHY: `export default new DrumMachine()` creates the instance at module evaluation
// time and ties its lifetime to the module's scope. In React dev mode, Vite/webpack
// HMR re-evaluates modules on every hot reload — but Tone.js's AudioContext and
// internal graph survive in the browser's audio thread. The result is that the new
// JS instance loses its references to the still-running audio nodes, orphaning them
// in the graph while the new instance builds a second set on top. This causes
// doubled voices, accumulated polyphony, and growing render-budget pressure that
// manifests as distortion and audio glitches that worsen over a dev session.
//
// Instead, construct and own the instance inside AudioSequencerProvider (or an
// equivalent React context / singleton hook) using a ref + useEffect cleanup:
//
//   const drumMachine = useRef(null)
//   useEffect(() => {
//     drumMachine.current = new DrumMachine()
//     return () => drumMachine.current?.dispose()
//   }, [])
//
// This ties the instance lifecycle to the React tree, not the module scope,
// so HMR and StrictMode double-invocation both clean up correctly.
export { DrumMachine }
export default DrumMachine