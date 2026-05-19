import React from 'react'
import { AudioSequencerProvider } from './context/AudioSequencerContext'
import InstrumentPanel from './components/InstrumentPanel'
import RhythmGrid from './components/RhythmGrid'
import TransportBar from './components/TransportBar'
import RotationPrompt from './components/RotationPrompt'
import './App.css'

export default function App() {
  return (
    <AudioSequencerProvider>
      <div className="app">
        <RotationPrompt />
        <header className="app-header">
          <h1 className="app-title">PLAYGROUND</h1>
        </header>
        <div className="app-body">
          <InstrumentPanel />
          <main className="grid-area">
            <RhythmGrid />
          </main>
        </div>
        <TransportBar />
      </div>
    </AudioSequencerProvider>
  )
}
