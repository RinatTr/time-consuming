import React, { useState } from 'react'
import './TransportBar.css'

export default function TransportBar() {
  const [bpm, setBpm] = useState(120)

  return (
    <div className="transport-bar">
      <div className="bpm-control">
        <span className="bpm-label">BPM:</span>
        <span className="bpm-value">{bpm}</span>
        <div className="bpm-arrows">
          <button
            className="arrow-btn"
            onClick={() => setBpm(b => Math.min(300, b + 1))}
            aria-label="Increase BPM"
          >
            ▲
          </button>
          <button
            className="arrow-btn"
            onClick={() => setBpm(b => Math.max(20, b - 1))}
            aria-label="Decrease BPM"
          >
            ▼
          </button>
        </div>
      </div>

      <button className="transport-btn transport-btn--stop" aria-label="Stop">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <rect x="2" y="2" width="12" height="12" rx="1" />
        </svg>
      </button>

      <button className="transport-btn transport-btn--play" aria-label="Play">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
        </svg>
      </button>
    </div>
  )
}
