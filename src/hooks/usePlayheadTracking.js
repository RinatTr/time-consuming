import { useEffect, useRef } from 'react'

/**
 * usePlayheadTracking - Custom hook for updating the visual playhead position
 * Smoothly tracks the current step being played
 */
export function usePlayheadTracking(currentStep) {
  const playheadRef = useRef(null)

  useEffect(() => {
    // Find the playhead element
    const playheadElement = document.querySelector('.col-guide.playhead')

    if (playheadElement) {
      // Calculate the position of this step in the grid
      const columnGuides = document.querySelectorAll('.col-guide')
      if (columnGuides[currentStep]) {
        const targetElement = columnGuides[currentStep]

        // Smooth scroll into view if needed
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })

        // Update playhead styling if you want to highlight it differently
        // You could add a data-attribute or class here
      }
    }
  }, [currentStep])

  return playheadRef
}
