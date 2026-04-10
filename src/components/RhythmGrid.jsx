import React, { useMemo } from 'react'
import { useAudioSequencerContext } from '../context/AudioSequencerContext'
import { usePlayheadTracking } from '../hooks/usePlayheadTracking'
import { calculatePhraseGroupings, getHostGroupings, getGuestBlockBoundaries, getHostBlockBoundaries } from '../audio/phraseCalculator'
import './RhythmGrid.css'

const STEPS_PER_BAR = 16

/**
 * For each grouping size, create an array of nub positions (1-indexed for display).
 * This is used to render individual nubs within each block.
 */
function buildGroupNubs(groupSizes) {
  const groups = []
  for (const size of groupSizes) {
    const nubs = Array.from({ length: size }, (_, i) => i + 1)
    groups.push(nubs)
  }
  return groups
}

function RhythmGridComponent() {
  const { currentStep, barCount, activeBarIndex } = useAudioSequencerContext()

  // Local playhead: only show playhead if in the current bar
  const localPlayhead = currentStep % STEPS_PER_BAR
  const playheadInThisBar = Math.floor(currentStep / STEPS_PER_BAR) === activeBarIndex

  usePlayheadTracking(localPlayhead, playheadInThisBar)

  // Memoize groupings calculation - only recompute when barCount or activeBarIndex change
  const memoizedGroupings = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`  → useMemo triggered: recalculating for bar ${activeBarIndex}`)
    }
    const allBarGroupings = calculatePhraseGroupings(barCount, 3, STEPS_PER_BAR)
    const guestGroupingsForBar = allBarGroupings[activeBarIndex] || []
    const hostGroupingsForBar = getHostGroupings()

    if (process.env.NODE_ENV === 'development') {
      console.log(`  → allBarGroupings:`, allBarGroupings)
      console.log(`  → guestGroupingsForBar[${activeBarIndex}]:`, guestGroupingsForBar)
    }

    return { allBarGroupings, guestGroupingsForBar, hostGroupingsForBar }
  }, [barCount, activeBarIndex])

  const { allBarGroupings, guestGroupingsForBar, hostGroupingsForBar } = memoizedGroupings

  // Build nubs for each group (for visual representation within blocks)
  const guestGroupNubs = useMemo(() => buildGroupNubs(guestGroupingsForBar), [guestGroupingsForBar])
  const hostGroupNubs = useMemo(() => buildGroupNubs(hostGroupingsForBar), [hostGroupingsForBar])

  // Calculate beat positions within this bar's view
  const guestBeats = useMemo(() => getGuestBlockBoundaries(guestGroupingsForBar), [guestGroupingsForBar])
  const hostBeats = useMemo(() => getHostBlockBoundaries(), [])

  return (
    <div className="rhythm-grid-wrapper">
      <div className="rhythm-grid" data-current-step={playheadInThisBar ? localPlayhead : -1}>

        {/* ── Column guide lines ── */}
        <div className="column-guides" aria-hidden="true">
          {Array.from({ length: STEPS_PER_BAR }).map((_, i) => (
            <div
              key={i}
              className={`col-guide ${guestBeats.has(i) ? 'beat-guest' : ''} ${hostBeats.has(i) ? 'beat-host' : ''} ${
                playheadInThisBar && i === localPlayhead ? 'playhead' : ''
              }`}
            />
          ))}
        </div>

        {/* ── Track rows ── */}
        <div className="tracks">

          {/* Empty rows: Snare, Hi-Hat */}
          {['snare', 'hihat'].map(id => (
            <div key={id} className="track-row track-row--empty">
              <div className="track-cells">
                {Array.from({ length: STEPS_PER_BAR }).map((_, i) => (
                  <div key={i} className="cell cell--empty" />
                ))}
              </div>
            </div>
          ))}

          {/* Guest row (3/16 per bar) */}
          <div className="track-row track-row--guest">
            <div className="track-cells">
              {guestGroupingsForBar.length > 0 ? (
                guestGroupingsForBar.map((groupSize, gi) => {
                  const nubs = guestGroupNubs[gi] || []
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`  [GUEST BLOCK ${gi}] size=${groupSize}, nubs=${nubs.length}`)
                  }
                  return (
                    <div
                      key={gi}
                      className="block block--guest"
                      style={{ '--span': groupSize }}
                    >
                      {gi === 0 && (
                        <div className="meter-badge meter-badge--guest">
                          <span>3/16</span>
                        </div>
                      )}
                      <div className="block-nubs">
                        {nubs.map((step, si) => (
                          <div key={si} className="nub nub--guest" />
                        ))}
                      </div>
                      <div className="block-body" />
                    </div>
                  )
                })
              ) : (
                <div className="cell cell--empty" />
              )}
            </div>
          </div>

          {/* Kick row — empty */}
          <div className="track-row track-row--empty">
            <div className="track-cells">
              {Array.from({ length: STEPS_PER_BAR }).map((_, i) => (
                <div key={i} className="cell cell--empty" />
              ))}
            </div>
          </div>

          {/* Host row (4/4) */}
          <div className="track-row track-row--host">
            <div className="track-cells">
              {hostGroupingsForBar.map((groupSize, gi) => {
                const nubs = hostGroupNubs[gi] || []
                return (
                  <div
                    key={gi}
                    className="block block--host"
                    style={{ '--span': groupSize }}
                  >
                    {gi === 0 && (
                      <div className="meter-badge meter-badge--host">
                        <span>4/4</span>
                      </div>
                    )}
                    <div className="block-nubs">
                      {nubs.map((step, si) => (
                        <div key={si} className="nub nub--host" />
                      ))}
                    </div>
                    <div className="block-body" />
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* ── Step number ruler ── */}
        <div className="step-ruler">
          {Array.from({ length: STEPS_PER_BAR }).map((_, i) => (
            <div key={i} className={`step-num ${i === 0 ? 'step-num--active' : ''}`}>
              {i + 1}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default RhythmGridComponent
