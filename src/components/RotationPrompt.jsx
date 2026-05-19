import React, { useState, useEffect } from 'react'
import './RotationPrompt.css'

const RotateIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8C18.7 8 8 18.7 8 32M32 56C45.3 56 56 45.3 56 32" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 32L20 24M56 32L44 40" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function RotationPrompt() {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches
      const isPortraitMode = window.matchMedia('(orientation: portrait)').matches
      setIsPortrait(isMobile && isPortraitMode)
    }

    checkOrientation()
    window.addEventListener('orientationchange', checkOrientation)
    window.addEventListener('resize', checkOrientation)

    return () => {
      window.removeEventListener('orientationchange', checkOrientation)
      window.removeEventListener('resize', checkOrientation)
    }
  }, [])

  if (!isPortrait) return null

  return (
    <div className="rotation-prompt-overlay">
      <div className="rotation-prompt-content">
        <div className="rotation-icon">
          <RotateIcon />
        </div>
        <p className="rotation-text">Rotate your device to landscape</p>
      </div>
    </div>
  )
}
