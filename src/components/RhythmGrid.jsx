import React from 'react'
import './RhythmGrid.css'

const TOTAL_STEPS = 16

/* Bass: 3/16 grouping → groups of 3 steps */
const BASS_GROUPS = [3, 3, 3, 3, 3, 1] // 5 full groups + 1 leftover across 16

/* Keyboard: 4/4 grouping → groups of 4 */
const KB_GROUPS = [4, 4, 4, 4]

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

const bassGroups = buildGroups(BASS_GROUPS)
const kbGroups   = buildGroups(KB_GROUPS)

/* Column beat markers — which steps are "beat 1" of a bar/group */
const bassBeats = new Set(bassGroups.map(g => g[0]))
const kbBeats   = new Set(kbGroups.map(g => g[0]))

export default function RhythmGrid() {
  return (
    <div className="rhythm-grid-wrapper">
      <div className="rhythm-grid">

        {/* ── Column guide lines ── */}
        <div className="column-guides" aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`col-guide ${bassBeats.has(i + 1) ? 'beat-bass' : ''} ${kbBeats.has(i + 1) ? 'beat-kb' : ''} ${i === 0 ? 'playhead' : ''}`}
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

          {/* Bass row (3/16) */}
          <div className="track-row track-row--bass">
            <div className="track-cells">
              {bassGroups.map((group, gi) => (
                <div
                  key={gi}
                  className="block block--bass"
                  style={{ '--span': group.length }}
                >
                  <div className="block-nubs">
                    {group.map((step, si) => (
                      <div key={si} className="nub nub--bass" />
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

          {/* Keyboard row (4/4) */}
          <div className="track-row track-row--keyboard">
            <div className="track-cells">
              {kbGroups.map((group, gi) => (
                <div
                  key={gi}
                  className="block block--keyboard"
                  style={{ '--span': group.length }}
                >
                  <div className="block-nubs">
                    {group.map((step, si) => (
                      <div key={si} className="nub nub--keyboard" />
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
