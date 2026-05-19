import React from 'react'
import './BarCountSelector.css'

/**
 * BarCountSelector
 * Inline buttons: 1|2|3|4 bars
 * Disabled after first play (barCount is locked)
 */
export function BarCountSelector({ barCount, isLocked, handlebarCountDecrease, handlebarCountIncrease }) {
  // the bpm css classes are reused and hacky, will refactor to separate.
  return (
    <div className="bpm-control" >
          <span className="bpm-label">Bars:</span>
          <span className="bpm-value">{barCount}</span>
          <div className="bpm-arrows">
            <button
              disabled={isLocked}
              className="arrow-btn"
              onClick={handlebarCountIncrease}
              aria-label="Increase barCount"
            >
              ▲
            </button>
            <button
              disabled={isLocked}
              className="arrow-btn"
              onClick={handlebarCountDecrease}
              aria-label="Decrease barCount"
            >
              ▼
            </button>
          </div>
        </div>
  )
}

export default BarCountSelector
