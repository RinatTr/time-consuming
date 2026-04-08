import React, { useCallback } from 'react'
import { useAudioSequencer } from '../hooks/useAudioSequencer'
import './TransportBar.css'

export default function TransportBar() {
  const { isPlaying, bpm, play, stop, updateBPM } = useAudioSequencer()

  const handlePlayClick = useCallback(async () => {
    try {
      await play()
    } catch (error) {
      console.error('Failed to start playback:', error)
    }
  }, [play])

  const handleStopClick = useCallback(() => {
    stop()
  }, [stop])

  const handleBpmIncrease = useCallback(() => {
    updateBPM(bpm + 1)
  }, [bpm, updateBPM])

  const handleBpmDecrease = useCallback(() => {
    updateBPM(bpm - 1)
  }, [bpm, updateBPM])

  return (
    <div className="transport-bar">
      <div className="bpm-control">
        <span className="bpm-label">BPM:</span>
        <span className="bpm-value">{bpm}</span>
        <div className="bpm-arrows">
          <button
            className="arrow-btn"
            onClick={handleBpmIncrease}
            aria-label="Increase BPM"
          >
            ▲
          </button>
          <button
            className="arrow-btn"
            onClick={handleBpmDecrease}
            aria-label="Decrease BPM"
          >
            ▼
          </button>
        </div>
      </div>

      <button
        className="transport-btn transport-btn--stop"
        onClick={handleStopClick}
        disabled={!isPlaying}
        aria-label="Stop"
      >
        <svg viewBox="0 0 16 16" fill="currentColor">
          <rect x="2" y="2" width="12" height="12" rx="1" />
        </svg>
      </button>

      <button
        className="transport-btn transport-btn--play"
        onClick={handlePlayClick}
        disabled={isPlaying}
        aria-label="Play"
      >
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
        </svg>
      </button>
    </div>
  )
}
