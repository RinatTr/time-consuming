import React from 'react'
import './BarPagination.css'

/**
 * BarPagination
 * Prev/Next navigation for multi-bar sequencer
 * Disabled when playing because the playhead automatically advances activeBarIndex
 * via the auto-follow logic in handleStepChange (useAudioSequencer.js).
 */
export function BarPagination({ barCount, activeBarIndex, onPrev, onNext, isPlaying }) {
  const canPrev = activeBarIndex > 0 && !isPlaying
  const canNext = activeBarIndex < barCount - 1 && !isPlaying

  return (
    <div className="bar-pagination">
      <button
        className="bar-nav-btn"
        onClick={onPrev}
        disabled={!canPrev}
        title="Previous bar"
      >
        ←
      </button>

      <span className="bar-counter">
        {activeBarIndex + 1} | {barCount}
      </span>

      <button
        className="bar-nav-btn"
        onClick={onNext}
        disabled={!canNext}
        title="Next bar"
      >
        →
      </button>
    </div>
  )
}

export default BarPagination
