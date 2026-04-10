# Playground

A browser-based polyrhythmic drum sequencer. Layer a 3-step guest pattern against a 4/4 host grid and hear how the two meters drift and realign across multiple bars.

## What it does

Playground lets you build drum patterns that pit two different meters against each other simultaneously — a classic polyrhythm technique used in everything from West African drumming to Steve Reich to boom-bap hip-hop.

- **5 instruments:** Kick, Snare, Hi-Hat, Bass, and Keys (Rhodes-style EP)
- **Polyrhythmic grid:** a 3/16 guest pattern runs continuously across the bar boundary, visually showing where each group lands relative to the 4/4 host
- **1–4 bar phrases:** extend the sequence to hear where the two meters finally realign
- **BPM control:** tap the arrows or type directly into the BPM field
- **Pattern presets:** Four On The Floor, Techno/House, Boom Bap, Polyrhythmic, and Random

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

Requires Node.js 18+. Built with React, Vite, and Tone.js.

## How to use it

1. **Select bar count** using the 1/2/3/4 buttons before pressing Play — this sets how many bars the phrase spans (locked once playback starts)
2. **Press Play** to start the sequencer
3. **Watch the grid** — the top row shows the 3/16 guest groupings for the current bar, the bottom row shows the steady 4/4 host. The groupings shift each bar as the 3-step stream crosses bar boundaries
4. **Navigate bars** with the ← → arrows (only available while stopped) to inspect how the patterns land in each bar
5. **Click an instrument** in the left panel to preview its sound at any time

## The polyrhythm explained

The sequencer runs two independent pulse streams at once:

| Stream | Division | Groups per bar |
|--------|----------|----------------|
| Host (Keys) | 4/4 | 4 × 4 steps |
| Guest (Snare) | 3/16 | 5 × 3 + remainder |

Because 3 doesn't divide evenly into 16, the guest groups straddle bar boundaries — the final group of one bar bleeds into the first group of the next. Over 3 bars (48 steps = 16 × 3 steps = 3 × 16), the patterns fully realign. Extending to 4 bars repeats the first bar's grouping.

## Project structure

```
src/
├── audio/
│   ├── DrumMachine.js          # Tone.js audio engine (singleton)
│   ├── patterns.js             # Preset pattern definitions
│   └── phraseCalculator.js     # Polyrhythm grouping math
├── components/
│   ├── RhythmGrid.jsx          # Main grid display
│   ├── InstrumentPanel.jsx     # Instrument list + preview
│   ├── TransportBar.jsx        # Play/stop, BPM, bar navigation
│   ├── BarCountSelector.jsx    # 1–4 bar selector
│   └── BarPagination.jsx       # Bar prev/next controls
├── context/
│   └── AudioSequencerContext.jsx
└── hooks/
    ├── useAudioSequencer.js    # Core state + playback logic
    └── usePlayheadTracking.js  # Visual playhead sync
```

## Tech stack

- **React** — UI and component state
- **Tone.js** — Web Audio scheduling, synthesis, and transport
- **Vite** — dev server and build

## Browser support

Requires Web Audio API support. Works in all modern browsers (Chrome, Firefox, Safari, Edge). Audio context requires a user gesture to start — clicking Play or any instrument pad initialises it.

## License

MIT
