import React, { useCallback } from 'react'
import { useAudioSequencerContext } from '../context/AudioSequencerContext'
import { BarCountSelector } from './BarCountSelector'
import './TransportBar.css'

export default function TransportBar() {
  const {
    isPlaying,
    bpm,
    play,
    stop,
    updateBPM,
    barCount,
    updateBarCount,
    groupingOption,
    updateGroupingOption,
    hostMeter,
    updateHostMeter,
    subdivision,
    updateSubdivision,
  } = useAudioSequencerContext()

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
    // Clamp BPM between 0 and 260
    if (bpm >= 260) return
    updateBPM(bpm + 1)
  }, [bpm, updateBPM])

  const handleBpmDecrease = useCallback(() => {
    // Clamp BPM between 0 and 260
    if (bpm <= 0) return
    updateBPM(bpm - 1)
  }, [bpm, updateBPM])

  const handleBpmInputChange = useCallback(
    (e) => {
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
    },
    [updateBPM]
  )

  const handleBpmInputBlur = useCallback(
    (e) => {
      const value = e.target.value
      // If empty on blur, reset to current BPM
      if (value === '') {
        e.target.value = bpm
        return
      }

      let numValue = parseInt(value, 10)
      numValue = Math.min(Math.max(numValue, 0), 260)
      updateBPM(numValue)
    },
    [bpm, updateBPM]
  )
  const handleBarCountIncrease = useCallback(() => {
    if (barCount >= 4) return
    updateBarCount(barCount + 1)
  }, [barCount, updateBarCount])

  const handleBarCountDecrease = useCallback(() => {
    if (barCount <= 1) return
    updateBarCount(barCount - 1)
  }, [barCount, updateBarCount])

  const handleSelectBarCount = useCallback(
    (n) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TransportBar] handleSelectBarCount called with n=${n}`)
      }
      updateBarCount(n)
    },
    [updateBarCount]
  )

  const handleSelectGrouping = useCallback(
    (n) => {
      updateGroupingOption(n)
    },
    [updateGroupingOption]
  )

  const handleSelectMeter = useCallback(
    (meter) => {
      if (meter === '6/8') {
        // If switching to 6/8, force subdivision to 16th
        updateSubdivision('16th')
      }
      updateHostMeter(meter)
    },
    [updateHostMeter]
  )

  const handleSelectSubdivision = useCallback(
    (sub) => {
      updateSubdivision(sub)
    },
    [updateSubdivision]
  )

  return (
    <div className="transport-wrapper">
      {/* Config Selectors */}
      <div className="config-selectors">
        {/* Grouping Option Selector */}
        <div className="selector-group">
          <span className="selector-label">Guest:</span>
          <div className="button-group">
            {[3, 4, 5].map((opt) => (
              <button
                key={opt}
                className={`selector-btn ${groupingOption === opt ? 'selected' : ''}`}
                onClick={() => handleSelectGrouping(opt)}
                disabled={isPlaying}
                aria-label={`Host Beat ${opt}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Host Meter Selector */}
        <div className="selector-group">
          <span className="selector-label">Host:</span>
          <div className="button-group">
            {['4/4', '5/4', '6/8'].map((meter) => (
              <button
                key={meter}
                className={`selector-btn ${hostMeter === meter ? 'selected' : ''}`}
                onClick={() => handleSelectMeter(meter)}
                disabled={isPlaying}
                aria-label={`${meter} meter`}
              >
                {meter}
              </button>
            ))}
          </div>
        </div>

        {/* Subdivision Selector */}
        <div className="selector-group">
          <span className="selector-label">Subdivision:</span>
          <div className="button-group">
            <button
              className={`selector-btn ${subdivision === '16th' ? 'selected' : ''}`}
              onClick={() => handleSelectSubdivision('16th')}
              disabled={isPlaying}
              aria-label="16th note subdivision"
            >
              16th
            </button>
            <button
              className={`selector-btn ${subdivision === '8th-triplet' ? 'selected' : ''}`}
              onClick={() => handleSelectSubdivision('8th-triplet')}
              disabled={isPlaying || hostMeter === '6/8'} // Disable triplets if 6/8 is selected
              aria-label="8th triplet subdivision"
            >
              8th Triplet
            </button>
          </div>
        </div>
      </div>

      {/* Transport Controls */}
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
        {/* Bar Count Selector */}
        <BarCountSelector
          barCount={barCount}
          onSelectBarCount={handleSelectBarCount}
          isLocked={isPlaying}
          handlebarCountDecrease={handleBarCountDecrease}
          handlebarCountIncrease={handleBarCountIncrease}
        />
      </div>
    </div>
  )
}
