import { useEffect, useRef } from 'react'

/**
 * usePlayheadTracking - Custom hook for smooth scrolling the current step into view
 * Only scrolls when the playhead is visible in the current bar.
 *
 * @param {number} localPlayhead - The playhead position within the current bar (0-15)
 * @param {boolean} playheadInThisBar - True if the global playhead is in the active bar
 */
export function usePlayheadTracking(localPlayhead, playheadInThisBar) {
  const columnGuidesRef = useRef(null)

  useEffect(() => {
    // Cache the column guides on first mount
    if (!columnGuidesRef.current) {
      columnGuidesRef.current = document.querySelectorAll('.col-guide')
    }
  }, [])

  useEffect(() => {
    // Only scroll if the playhead is visible in this bar and the index is valid
    if (!playheadInThisBar || localPlayhead < 0 || !columnGuidesRef.current) {
      return
    }

    const targetElement = columnGuidesRef.current[localPlayhead]
    if (targetElement) {
      // Smooth scroll into view if needed
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [localPlayhead, playheadInThisBar])
}
