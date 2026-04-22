import React from 'react'
import './BarCountSelector.css'

/**
 * BarCountSelector
 * Inline buttons: 1|2|3|4 bars
 * Disabled after first play (barCount is locked)
 */
export function BarCountSelector({ barCount, isLocked, handlebarCountDecrease, handlebarCountIncrease }) {
  // const options = [1, 2, 3, 4]

  return (
    <div className="bpm-control">
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
  // return (
  //   <div className="bar-count-selector">
  //     <label className="bar-count-label">Bars:</label>
  //     <div className="bar-count-buttons">
  //       {options.map((option) => (
  //         <button
  //           key={option}
  //           className={`bar-count-btn ${barCount === option ? 'active' : ''}`}
  //           onClick={() => onSelectBarCount(option)}
  //           disabled={isLocked}
  //           title={isLocked ? 'Bar count locked during playback' : `Select ${option} bar(s)`}
  //         >
  //           {option}
  //         </button>
  //       ))}
  //     </div>
  //   </div>
  // )
}

export default BarCountSelector
