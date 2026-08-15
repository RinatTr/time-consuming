import React, { useMemo } from 'react'
import { useAudioSequencerContext } from '../context/AudioSequencerContext'
import './RhythmGrid.css'

const INSTRUMENTS = [
  { id: 'keys', label: 'Keys' },
  { id: 'guitar', label: 'Guitar' },
  { id: 'bass', label: 'Bass' },
  { id: 'hihat', label: 'Hi-Hat' },
  { id: 'snare', label: 'Snare' },
  { id: 'kick', label: 'Kick' },
]

/**
 * Convert grouping sizes into render-ready blocks with a local step offset.
 *
 * Example:
 * [4, 4, 4, 4] -> offsets 0, 4, 8, 12.
 */
function buildBlocks(groupSizes) {
  let offset = 0

  return (groupSizes || []).map((size) => {
    const block = {
      size,
      offset,
      nubs: Array.from(
        { length: size },
        (_, i) => i
      ),
    }

    offset += size

    return block
  })
}

/**
 * Six-track rhythm grid.
 *
 * - One visible bar at a time.
 * - One row per instrument, in InstrumentPanel order.
 * - Each row independently uses Host or Guest grouping based on roleAssignment.
 * - Every row displays its real pattern.
 * - Only the selected instrument is editable.
 * - During playback, activeBarIndex auto-follows transport in useAudioSequencer.
 * - While stopped, pagination changes display only and never moves currentStep.
 *
 * Playhead:
 * - currentStep still advances at the smallest subdivision.
 * - The visual playhead snaps to the Host/main-beat block containing currentStep.
 * - It remains at that Host block's start until the next Host beat begins.
 * - The highlighted region spans the complete Host block width.
 */
function RhythmGridComponent() {
  const {
    currentStep,
    isPlaying,
    barCount,
    activeBarIndex,
    goToBar,
    currentGroupings,
    currentStepsPerBar,
    selectedInstrument,
    roleAssignment,
    patterns,
    setGridCell,
  } = useAudioSequencerContext()

  const safeStepsPerBar = Math.max(
    1,
    currentStepsPerBar || 1
  )

  /*
   * Transport position still progresses by subdivision.
   */
  const playheadBarIndex = Math.floor(
    currentStep / safeStepsPerBar
  )

  const localPlayhead =
    currentStep % safeStepsPerBar

  const playheadInDisplayedBar =
    playheadBarIndex === activeBarIndex

  /*
   * Host blocks define the visual/main-beat grid.
   *
   * Examples might be:
   * 4/4 16ths      -> [4, 4, 4, 4]
   * 4/4 triplets   -> [3, 3, 3, 3]
   *
   * We do not hardcode those values here — the generated
   * currentGroupings.host remains the source of truth.
   */
  const hostBlocks = useMemo(
    () =>
      buildBlocks(
        currentGroupings.host || []
      ),
    [currentGroupings.host]
  )

  const guestBlocks = useMemo(
    () =>
      buildBlocks(
        currentGroupings.guest?.[
          activeBarIndex
        ] || []
      ),
    [
      currentGroupings.guest,
      activeBarIndex,
    ]
  )

  /*
   * Determine which Host/main-beat block currently contains
   * the transport step.
   *
   * The visual playhead only changes when this index changes.
   */
  const activeHostBeatIndex = useMemo(() => {
    if (hostBlocks.length === 0) {
      return -1
    }

    const index = hostBlocks.findIndex(
      ({ offset, size }) =>
        localPlayhead >= offset &&
        localPlayhead < offset + size
    )

    /*
     * Normally there will always be a match because the
     * Host blocks span the full bar. Fall back to the first
     * block defensively.
     */
    return index >= 0 ? index : 0
  }, [hostBlocks, localPlayhead])

  const barStartStep =
    activeBarIndex *
    safeStepsPerBar

  const handleNubClick = (
    instrumentId,
    absoluteStep
  ) => {
    if (
      selectedInstrument !== instrumentId
    ) {
      return
    }

    const current =
      patterns[instrumentId]?.[
        absoluteStep
      ] ?? false

    setGridCell(
      instrumentId,
      absoluteStep,
      !current
    )
  }

  return (
    <div className="rhythm-grid-phrase">
      <div
        className="bar-pair"
        data-bar={activeBarIndex}
        data-active="true"
      >
        <div className="bar-pair-rows">
          {/*
           * Smallest-unit column guides remain visible,
           * but they no longer own the playhead highlight.
           */}
          <div
            className="column-guides"
            aria-hidden="true"
          >
            {Array.from({
              length: safeStepsPerBar,
            }).map((_, stepIdx) => (
              <div
                key={stepIdx}
                className="col-guide"
              />
            ))}
          </div>

          {INSTRUMENTS.map(
            ({ id, label }) => {
              const role =
                roleAssignment[id] ||
                'host'

              const blocks =
                role === 'guest'
                  ? guestBlocks
                  : hostBlocks

              const isSelected =
                selectedInstrument === id

              return (
                <div
                  key={id}
                  className={`track-row track-row--${role}${
                    isSelected
                      ? ' track-row--selected'
                      : ''
                  }`}
                  data-instrument={id}
                  data-role={role}
                  data-selected={
                    isSelected
                  }
                  aria-label={`${label} ${role} pattern`}
                >
                  <div className="track-cells">
                    {blocks.length > 0 ? (
                      blocks.map(
                        (
                          {
                            size,
                            offset,
                            nubs,
                          },
                          blockIndex
                        ) => (
                          <div
                            key={`${id}-${blockIndex}`}
                            className={`block block--${role}`}
                            style={{
                              '--span':
                                size,
                            }}
                          >
                            <div className="block-nubs">
                              {nubs.map(
                                (
                                  localStepInBlock
                                ) => {
                                  const absoluteStep =
                                    barStartStep +
                                    offset +
                                    localStepInBlock

                                  const isActive =
                                    patterns[
                                      id
                                    ]?.[
                                      absoluteStep
                                    ] ===
                                    true

                                  const isInactive =
                                    !isActive

                                  return (
                                    <div
                                      key={
                                        localStepInBlock
                                      }
                                      className={`nub nub--${role}${
                                        isActive
                                          ? ' nub--active'
                                          : ''
                                      }${
                                        isInactive
                                          ? ' nub--inactive'
                                          : ''
                                      }`}
                                      onClick={
                                        isSelected
                                          ? () =>
                                              handleNubClick(
                                                id,
                                                absoluteStep
                                              )
                                          : undefined
                                      }
                                      style={
                                        isSelected
                                          ? {
                                              cursor:
                                                'pointer',
                                            }
                                          : undefined
                                      }
                                      aria-label={
                                        isSelected
                                          ? `${label} step ${
                                              offset +
                                              localStepInBlock +
                                              1
                                            } ${
                                              isActive
                                                ? 'on'
                                                : 'off'
                                            }`
                                          : undefined
                                      }
                                    />
                                  )
                                }
                              )}
                            </div>

                            <div className="block-body" />
                          </div>
                        )
                      )
                    ) : (
                      <div className="cell cell--empty" />
                    )}
                  </div>
                </div>
              )
            }
          )}

          {/*
           * Host-beat playhead overlay.
           *
           * This deliberately uses the same:
           * - flex-grow spans
           * - 2px gap
           * - 4px horizontal padding
           *
           * as .track-cells.
           *
           * Therefore the highlight lines up exactly with Host
           * block boundaries rather than approximating them
           * with percentage positioning.
           */}
          {playheadInDisplayedBar &&
            activeHostBeatIndex >= 0 && (
              <div
                className="playhead-host-grid"
                aria-hidden="true"
              >
                <div className="playhead-host-grid-inner">
                  {hostBlocks.map(
                    (
                      { size },
                      blockIndex
                    ) => {
                      const isCurrentBeat =
                        blockIndex ===
                        activeHostBeatIndex

                      return (
                        <div
                          key={blockIndex}
                          className={`playhead-host-slot${
                            isCurrentBeat
                              ? ' playhead-host-slot--active'
                              : ''
                          }`}
                          style={{
                            '--span':
                              size,
                          }}
                        >
                          {isCurrentBeat && (
                            <div className="playhead-beat-line" />
                          )}
                        </div>
                      )
                    }
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {barCount > 1 && (
        <nav
          className="bar-pagination"
          aria-label="Bar pages"
        >
          {Array.from({
            length: barCount,
          }).map((_, barIndex) => {
            const isCurrentPage =
              barIndex ===
              activeBarIndex

            return (
              <button
                key={barIndex}
                type="button"
                className={`bar-page-btn${
                  isCurrentPage
                    ? ' bar-page-btn--active'
                    : ''
                }`}
                onClick={() =>
                  goToBar(barIndex)
                }
                disabled={isPlaying}
                aria-current={
                  isCurrentPage
                    ? 'page'
                    : undefined
                }
                aria-label={`Show bar ${
                  barIndex + 1
                }`}
              >
                {barIndex + 1}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

export default RhythmGridComponent