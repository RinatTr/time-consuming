import React from 'react'
import './RhythmGrid.css'

const TOTAL_STEPS = 16

/* Guest: 3/16 grouping → groups of 3 steps */
const GUEST_GROUPS = [3, 3, 3, 3, 3, 1] // 5 full groups + 1 leftover across 16

/* Host: 4/4 grouping → groups of 4 */
const HOST_GROUPS = [4, 4, 4, 4]

function buildGroups(groupSizes) {
  const groups = []
  let step = 1
  for (const size of groupSizes) {
    const steps = []
    for (let i = 0; i < size; i++) {
      steps.push(step++)
    }
    groups.push(steps)
  }
  return groups
}

const guestGroups = buildGroups(GUEST_GROUPS)
const hostGroups   = buildGroups(HOST_GROUPS)

/* Column beat markers — which steps are "beat 1" of a bar/group */
const guestBeats = new Set(guestGroups.map(g => g[0]))
const hostBeats   = new Set(hostGroups.map(g => g[0]))

export default function RhythmGrid() {
  return (
    <div className="rhythm-grid-wrapper">
      <div className="rhythm-grid">

        {/* ── Column guide lines ── */}
        <div className="column-guides" aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`col-guide ${guestBeats.has(i + 1) ? 'beat-guest' : ''} ${hostBeats.has(i + 1) ? 'beat-host' : ''} ${i === 0 ? 'playhead' : ''}`}
            />
          ))}
        </div>

        {/* ── Track rows ── */}
        <div className="tracks">

          {/* Empty rows: Snare, Hi-Hat */}
          {['snare', 'hihat'].map(id => (
            <div key={id} className="track-row track-row--empty">
              <div className="track-cells">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div key={i} className="cell cell--empty" />
                ))}
              </div>
            </div>
          ))}

          {/* Guest row (3/16) */}
          <div className="track-row track-row--guest">
            <div className="track-cells">
              {guestGroups.map((group, gi) => (
                <div
                  key={gi}
                  className="block block--guest"
                  style={{ '--span': group.length }}
                >
                  {gi === 0 && (
                    <div className="meter-badge meter-badge--guest">
                      <span>3/16</span>
                    </div>
                  )}
                  <div className="block-nubs">
                    {group.map((step, si) => (
                      <div key={si} className="nub nub--guest" />
                    ))}
                  </div>
                  <div className="block-body" />
                </div>
              ))}
            </div>
          </div>

          {/* Kick row — empty */}
          <div className="track-row track-row--empty">
            <div className="track-cells">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className="cell cell--empty" />
              ))}
            </div>
          </div>

          {/* Host row (4/4) */}
          <div className="track-row track-row--host">
            <div className="track-cells">
              {hostGroups.map((group, gi) => (
                <div
                  key={gi}
                  className="block block--host"
                  style={{ '--span': group.length }}
                >
                  {gi === 0 && (
                    <div className="meter-badge meter-badge--host">
                      <span>4/4</span>
                    </div>
                  )}
                  <div className="block-nubs">
                    {group.map((step, si) => (
                      <div key={si} className="nub nub--host" />
                    ))}
                  </div>
                  <div className="block-body" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Step number ruler ── */}
        <div className="step-ruler">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`step-num ${i === 0 ? 'step-num--active' : ''}`}>
              {i + 1}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
