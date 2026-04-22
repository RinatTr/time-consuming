import React, { useMemo } from 'react'
import { useAudioSequencerContext } from '../context/AudioSequencerContext'
import { usePlayheadTracking } from '../hooks/usePlayheadTracking'
import './RhythmGrid.css'

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
//Visual representation of the rhythm grid, showing host and guest groupings per bar, with a playhead indicator.
function RhythmGridComponent() {
  const { currentStep, barCount, activeBarIndex, currentGroupings, currentStepsPerBar } =
    useAudioSequencerContext()

  // Local playhead: steps within the active bar
  const localPlayhead = currentStep % currentStepsPerBar
  const playheadInThisBar = Math.floor(currentStep / currentStepsPerBar) === activeBarIndex

  usePlayheadTracking(localPlayhead, playheadInThisBar)

  // Memoize nub generation for guest and host groupings
  const { guestGroupNubsByBar, hostGroupNubs } = useMemo(() => {
    const guestByBar = (currentGroupings.guest || []).map((groupings) =>
      buildGroupNubs(groupings)
    )
    const host = buildGroupNubs(currentGroupings.host || [])
    return { guestGroupNubsByBar: guestByBar, hostGroupNubs: host }
  }, [currentGroupings])

  return (
    <div className="rhythm-grid-phrase">
      {/* Render each bar as a bar-pair (guest row + host row) */}
      {Array.from({ length: barCount }).map((_, barIndex) => {
        const isActiveBar = barIndex === activeBarIndex
        const guestGroupings = currentGroupings.guest?.[barIndex] || []
        const guestGroupNubs = guestGroupNubsByBar[barIndex] || []

        return (
          <div
            key={barIndex}
            className="bar-pair"
            data-bar={barIndex}
            data-active={isActiveBar}
          >
            <div className="bar-pair-rows">
              {/* Column guide lines — one per step in this bar */}
              <div className="column-guides" aria-hidden="true">
                {Array.from({ length: currentStepsPerBar }).map((_, stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`col-guide ${isActiveBar && stepIdx === localPlayhead ? 'playhead' : ''}`}
                  />
                ))}
              </div>

              {/* Guest row */}
              <div className="track-row track-row--guest">
                <div className="track-cells">
                  {guestGroupings.length > 0 ? (
                    guestGroupings.map((groupSize, gi) => {
                      const nubs = guestGroupNubs[gi] || []
                      return (
                        <div
                          key={gi}
                          className="block block--guest"
                          style={{ '--span': groupSize }}
                        >
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

              {/* Host row */}
              <div className="track-row track-row--host">
                <div className="track-cells">
                  {(currentGroupings.host || []).map((groupSize, gi) => {
                    const nubs = hostGroupNubs[gi] || []
                    return (
                      <div
                        key={gi}
                        className="block block--host"
                        style={{ '--span': groupSize }}
                      >
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

              {/* Step ruler
              <div className="step-ruler">
                {Array.from({ length: currentStepsPerBar }).map((_, stepIdx) => (
                  <div
                    key={stepIdx}
                    className={`step-num ${stepIdx === 0 ? 'step-num--active' : ''}`}
                  >
                    {stepIdx + 1}
                  </div>
                ))}
              </div> */}

              {/* Playhead — only rendered inside active bar-pair */}
              {isActiveBar && (
                <div
                  className="playhead-line"
                  style={{ left: `${(localPlayhead / currentStepsPerBar) * 100}%` }}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RhythmGridComponent