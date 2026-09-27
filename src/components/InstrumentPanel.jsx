import React, { useState } from 'react'
import { useAudioSequencerContext } from '../context/AudioSequencerContext'
import './InstrumentPanel.css'

import hihatImg    from '../../assets/resize/instrument-hihat.png'
import keyboardImg from '../../assets/resize/instrument-keyboard.png'
import guitarImg   from '../../assets/resize/instrument-guitar.png'
import bassImg     from '../../assets/resize/instrument-bass.png'
import snareImg    from '../../assets/resize/instrument-snare.png'
import kickImg     from '../../assets/resize/instrument-kick.png'

const instruments = [
  { id: 'keys',   label: 'Keys',   img: keyboardImg },
  { id: 'guitar', label: 'Guitar', img: guitarImg   },
  { id: 'bass',   label: 'Bass',   img: bassImg     },
  { id: 'hihat',  label: 'Hi-Hat', img: hihatImg    },
  { id: 'snare',  label: 'Snare',  img: snareImg    },
  { id: 'kick',   label: 'Kick',   img: kickImg     },
]

export default function InstrumentPanel() {
  const { drumMachine, roleAssignment, setInstrumentRole, mutedInstruments, toggleInstrumentMute, selectedInstrument, selectInstrument } = useAudioSequencerContext()
  const [activeInstrument, setActiveInstrument] = useState(null)

  const handleIconClick = async (instrumentId) => {
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;
    try {
      if (!drumMachine.isInitialized) {
        await drumMachine.initialize()
      }
      drumMachine.triggerInstrument(instrumentId)
      setActiveInstrument(instrumentId)
      setTimeout(() => setActiveInstrument(null), 200)
    } catch (error) {
      console.error(`Failed to preview instrument "${instrumentId}":`, error)
    }
  }

  const handleMuteToggle = (instrumentId, e) => {
    e.stopPropagation()
    toggleInstrumentMute(instrumentId)
  }

  const handleRoleToggle = (instrumentId, e) => {
    e.stopPropagation()
    const currentRole = roleAssignment[instrumentId]
    const newRole = currentRole === 'host' ? 'guest' : 'host'
        console.log(`Toggling role for instrument "${instrumentId}", new role: ${newRole}, current role: ${currentRole}`)
    setInstrumentRole(instrumentId, newRole)
  }

  return (
    <aside className="instrument-panel">
      {/* <div className="panel-header">Instruments</div> */}
      <ul className="instrument-list">
        {instruments.map(({ id, label, img }) => {
          const role = roleAssignment[id] || 'host'
          const isSelected = selectedInstrument === id
          return (
            <li
              key={id}
              className={`instrument-row role--${role}${isSelected ? ' instrument-row--selected' : ''}`}
              onClick={() => selectInstrument(id)}
              title={`Click to select ${label}`}
            > 
            {/* // on mobile we want the img to not be clickable anymore and only used as background to the label */}
              <img
                className={`instrument-icon${activeInstrument === id ? ' active' : ''}`}
                src={img}
                alt={label}
                onClick={(e) => {
                  e.stopPropagation()
                  handleIconClick(id)
                }}
                title={`Click to preview ${label}`}
              />
              <span className="instrument-label">{label}</span>
              <button
                className={`mute-toggle${mutedInstruments[id] ? ' mute-toggle--muted' : ''}`}
                onClick={(e) => handleMuteToggle(id, e)}
                aria-pressed={mutedInstruments[id]}
                aria-label={`${mutedInstruments[id] ? 'Unmute' : 'Mute'} ${label}`}
                title={mutedInstruments[id] ? `${label} muted. Click to unmute.` : `${label} unmuted. Click to mute.`}
              >
                m
              </button>
              <button
                className={`role-toggle role-toggle--${role}`}
                onClick={(e) => handleRoleToggle(id, e)}
               /* disabled={isPlaying}*/
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