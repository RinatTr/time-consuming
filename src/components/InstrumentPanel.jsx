import React, { useState } from 'react'
import { useAudioSequencerContext } from '../context/AudioSequencerContext'
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
    <path d="M12.8,21.8L12.8,21.8c-1.7-1.4-2.3-3.8-1.5-5.9l4.1-10.7C16.3,3,19,2.3,20.8,3.8l0,0c1.4,1.2,1.6,3.3,0.5,4.7l-1.1,1.5l1.4,6.2c0.4,1.9-0.2,3.9-1.7,5.1l-0.4,0.4C17.5,23.4,14.7,23.4,12.8,21.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="14" y1="29" x2="14" y2="22.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="19" y1="22.1" x2="19" y2="29" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="9.6" y1="14.9" x2="11.4" y2="15.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="10.6" y1="11.9" x2="12.5" y2="12.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="11.6" y1="8.9" x2="13.6" y2="9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12.6" y1="5.9" x2="14.8" y2="6.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

const GuitarIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16h8M12 20h8M12 12h8" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const instruments = [
  { id: 'snare', label: 'Snare', Icon: SnareIcon },
  { id: 'hihat', label: 'Hi-Hat', Icon: HiHatIcon },
  { id: 'bass', label: 'Bass', Icon: BassIcon },
  { id: 'kick', label: 'Kick', Icon: KickIcon },
  { id: 'keys', label: 'Keys', Icon: KeyboardIcon },
  { id: 'guitar', label: 'Guitar', Icon: GuitarIcon },
]

export default function InstrumentPanel() {
  const { drumMachine, isPlaying, roleAssignment, setInstrumentRole } = useAudioSequencerContext()
  const [activeInstrument, setActiveInstrument] = useState(null)

  const handleInstrumentClick = async (instrumentId) => {
    try {
      // Ensure audio is initialized (lazy init on first interaction)
      if (!drumMachine.isInitialized) {
        await drumMachine.initialize()
      }

      // Trigger the sound preview
      drumMachine.triggerInstrument(instrumentId)

      // Visual feedback: highlight the clicked instrument briefly
      setActiveInstrument(instrumentId)
      setTimeout(() => setActiveInstrument(null), 200)
    } catch (error) {
      console.error(`Failed to preview instrument "${instrumentId}":`, error)
    }
  }

  const handleRoleToggle = (instrumentId, e) => {
    e.stopPropagation()
    const currentRole = roleAssignment[instrumentId]
    const newRole = currentRole === 'host' ? 'guest' : 'host'
    setInstrumentRole(instrumentId, newRole)
  }

  return (
    <aside className="instrument-panel">
      {/* <div className="panel-header">Instruments</div> */}
      <ul className="instrument-list">
        {instruments.map(({ id, label, Icon }) => {
          const role = roleAssignment[id] || 'host'
          return (
            <li
              key={id}
              className={`instrument-row ${activeInstrument === id ? 'active' : ''} role--${role}`}
              onClick={() => handleInstrumentClick(id)}
              title={`Click to preview ${label}`}
            >
              <div className="instrument-icon">
                <Icon />
              </div>
              <span className="instrument-label">{label}</span>
              <button
                className={`role-toggle role-toggle--${role}`}
                onClick={(e) => handleRoleToggle(id, e)}
                disabled={isPlaying}
                aria-label={`Toggle ${label} role: ${role}`}
                title={`Current: ${role}. Click to toggle.`}
              >
                {role === 'host' ? 'Host' : 'Guest'}
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
