import React from 'react'
import InstrumentPanel from './components/InstrumentPanel'
import RhythmGrid from './components/RhythmGrid'
import TransportBar from './components/TransportBar'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">2D Rhythmic Grid with Meter Labels</h1>
      </header>

      <div className="app-workspace">
        <InstrumentPanel />
        <div className="grid-area">
          <RhythmGrid />
          <TransportBar />
        </div>
      </div>
    </div>
  )
}
