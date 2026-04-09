import React from 'react'
import { AudioSequencerProvider } from './context/AudioSequencerContext'
import InstrumentPanel from './components/InstrumentPanel'
import RhythmGrid from './components/RhythmGrid'
import TransportBar from './components/TransportBar'
import './App.css'

export default function App() {
  return (
    <AudioSequencerProvider>
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Playground</h1>
        </header>

        <div className="app-workspace">
          <InstrumentPanel />
          <div className="grid-area">
            <RhythmGrid />
            <TransportBar />
          </div>
        </div>
      </div>
    </AudioSequencerProvider>
  )
}
