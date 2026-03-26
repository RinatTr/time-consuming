import React from 'react'
import './InstrumentPanel.css'

const SnareIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="16" cy="12" rx="12" ry="5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 12v8c0 2.76 5.37 5 12 5s12-2.24 12-5v-8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 16h24" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
    <path d="M8 20l3-8M24 20l-3-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const HiHatIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="16" cy="9" rx="11" ry="3.5" stroke="currentColor" strokeWidth="1.8" />
    <ellipse cx="16" cy="14" rx="11" ry="3.5" stroke="currentColor" strokeWidth="1.8" />
    <line x1="16" y1="17.5" x2="16" y2="26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <ellipse cx="16" cy="26" rx="5" ry="1.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const BassIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="26" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <rect x="6" y="10" width="4" height="6" rx="0.5" fill="currentColor" opacity="0.7" />
    <rect x="12" y="10" width="4" height="6" rx="0.5" fill="currentColor" opacity="0.7" />
    <rect x="18" y="10" width="4" height="6" rx="0.5" fill="currentColor" opacity="0.7" />
    <line x1="6" y1="19" x2="26" y2="19" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <line x1="6" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
  </svg>
)

const KickIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    <line x1="5" y1="16" x2="11" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.35" />
    <line x1="21" y1="16" x2="27" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.35" />
  </svg>
)

const KeyboardIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="9" width="26" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
    {[7, 11, 15, 19, 23].map((x, i) => (
      <rect key={i} x={x} y="9" width="2.5" height="8" rx="0.5" fill="currentColor" opacity="0.65" />
    ))}
    <line x1="3" y1="20" x2="29" y2="20" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
  </svg>
)

const instruments = [
  { id: 'snare',    label: 'Snare',    Icon: SnareIcon },
  { id: 'hihat',   label: 'Hi-Hat',   Icon: HiHatIcon },
  { id: 'bass',    label: 'Bass',     Icon: BassIcon,    meter: '3/16' },
  { id: 'kick',    label: 'Kick',     Icon: KickIcon },
  { id: 'keyboard',label: 'Keyboard', Icon: KeyboardIcon, meter: '4/4' },
]

export default function InstrumentPanel() {
  return (
    <aside className="instrument-panel">
      <div className="panel-header">Instruments (Drag &amp; Drop)</div>
      <ul className="instrument-list">
        {instruments.map(({ id, label, Icon, meter }) => (
          <li key={id} className={`instrument-row ${meter ? 'has-meter' : ''}`}>
            <div className="instrument-icon">
              <Icon />
            </div>
            <span className="instrument-label">{label}</span>
            {meter && (
              <div className="meter-badge">
                <span>{meter}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}
