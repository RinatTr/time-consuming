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

  const handleBpmInputChange = useCallback((e) => {
    const value = e.target.value
    // Allow only numeric input
    if (!/^\d*$/.test(value)) return
    
    // Allow empty string for user to clear and type
    if (value === '') {
      e.target.value = ''
      return
    }
    
    let numValue = parseInt(value, 10)
    // Clamp value between 0 and 260
    numValue = Math.min(Math.max(numValue, 0), 260)
    updateBPM(numValue)
  }, [updateBPM])

  const handleBpmInputBlur = useCallback((e) => {
    const value = e.target.value
    // If empty on blur, reset to current BPM
    if (value === '') {
      e.target.value = bpm
      return
    }
    
    let numValue = parseInt(value, 10)
    numValue = Math.min(Math.max(numValue, 0), 260)
    updateBPM(numValue)
  }, [bpm, updateBPM])

  return (
    <div className="transport-bar">
      <div className="bpm-control">
        <span className="bpm-label">BPM:</span>
        <input
          type="text"
          className="bpm-value"
          value={bpm}
          onChange={handleBpmInputChange}
          onBlur={handleBpmInputBlur}
          inputMode="numeric"
          maxLength="3"
        />
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
