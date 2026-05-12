import React, { createContext, useContext, useEffect, useRef } from 'react'
import DrumMachine from '../audio/DrumMachine'
import { useAudioSequencer } from '../hooks/useAudioSequencer'

/**
 * AudioSequencerContext
 * Provides shared audio sequencer state to all components.
 * Prevents multiple instances of the hook state across components.
 *
 * This provider owns the DrumMachine instance lifetime. Constructing it here
 * (rather than at module scope) ensures React's cleanup — including HMR hot
 * reloads and StrictMode double-invocation in dev — properly disposes the audio
 * graph before rebuilding it. See DrumMachine.js export comment for full rationale.
 */
const AudioSequencerContext = createContext(null)

export function AudioSequencerProvider({ children }) {
  const drumMachineRef = useRef(null)

  // Construct the DrumMachine instance once and dispose it on unmount.
  // useRef ensures the same instance is passed to useAudioSequencer on every
  // render without triggering re-renders itself.
  if (drumMachineRef.current === null) {
    drumMachineRef.current = new DrumMachine()
  }

  useEffect(() => {
    const dm = drumMachineRef.current
    return () => {
      dm?.dispose()
      drumMachineRef.current = null
    }
  }, [])

  const sequencerState = useAudioSequencer(drumMachineRef.current)

  return (
    <AudioSequencerContext.Provider value={sequencerState}>
      {children}
    </AudioSequencerContext.Provider>
  )
}

export function useAudioSequencerContext() {
  const context = useContext(AudioSequencerContext)
  if (!context) {
    throw new Error('useAudioSequencerContext must be used within AudioSequencerProvider')
  }
  return context
}
