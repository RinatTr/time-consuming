import React, { createContext, useContext } from 'react'
import { useAudioSequencer } from '../hooks/useAudioSequencer'

/**
 * AudioSequencerContext
 * Provides shared audio sequencer state to all components
 * Prevents multiple instances of the hook state across components
 */
const AudioSequencerContext = createContext(null)

export function AudioSequencerProvider({ children }) {
  const sequencerState = useAudioSequencer()

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
