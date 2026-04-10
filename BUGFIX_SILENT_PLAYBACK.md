# Bug Fix: Silent Playback When barCount Set Before First Play

## Problem Summary
Changing `barCount` via the UI bar selector before pressing Play results in silent playback on the first play. The pattern works correctly on subsequent plays after pressing stop-play again.

## Root Causes

### Root Cause #1: Expansion Runs on Empty Data
- `initializeBarCount` can be called from the UI at any time (bar selector changed)
- `DrumMachine.gridState` starts as all-false arrays during module initialization
- The real polyrhythmic pattern isn't loaded until `initializeAudio` runs
- `initializeAudio` only runs on the **first Play press**
- Result: If bar expansion happens before Play, it tiles 64 silent steps (all-false) instead of real notes

### Root Cause #2: loadPattern Clobbers Expansion
- When Play is finally pressed, `initializeAudio` calls `loadPattern('polyrhythmic', DrumMachine)`
- `loadPattern` unconditionally overwrites every instrument's `gridState` with a fresh 16-step array
- This destroys whatever multi-bar expansion `initializeBarCount` had already written
- Result: The expanded pattern is replaced with a single 16-step pattern

### Why Play-Stop Workaround Works
1. First Play: `initializeAudio` → `DrumMachine.initialize()` → `loadPattern()` populates gridState
2. `isInitialized = true` is set
3. First Stop
4. Second Play: skips `initializeAudio` (already initialized), so `loadPattern` never runs again
5. The expanded state remains untouched → plays correctly

## Solutions Implemented

### Fix #1: Pre-initialize Audio on Bar Count Change
**File:** `src/hooks/useAudioSequencer.js`

```javascript
const initializeBarCount = useCallback(async (n) => {
  // ... validation ...
  
  // NEW: If audio context hasn't been initialized, do it now
  // A bar selector click is a valid user gesture for AudioContext startup
  if (!isInitialized) {
    await initializeAudio()
  }
  
  // NOW gridState is populated with real pattern data before expansion
  const polyPattern = generatePolyrhythmicPattern(n, 3, 16)
  DrumMachine.setGridPattern(instrumentName, polyPattern)
  // ... rest of expansion ...
}, [isPlaying, isInitialized])  // Added isInitialized to deps
```

**Impact:** `initializeBarCount` now ensures the pattern data is loaded before expanding, preventing silent initialization.

### Fix #2: Move Initialized Flag After Pattern Load
**File:** `src/hooks/useAudioSequencer.js`

```javascript
const initializeAudio = async () => {
  if (initializingRef.current || isInitialized) return
  
  initializingRef.current = true
  try {
    await DrumMachine.initialize()
    setBpm(DrumMachine.getBPM())
    loadPattern('polyrhythmic', DrumMachine)
    
    // MOVED: Set flag AFTER pattern is loaded
    // This closes the race window where another call might read uninitialized state
    setIsInitialized(true)
  } catch (error) {
    console.error('Failed to initialize audio:', error)
    initializingRef.current = false
  }
}
```

**Impact:** The `isInitialized` flag is only true once `gridState` is actually populated with real pattern data, preventing race conditions.

### Fix #3: Handle Async initializeBarCount in UI
**File:** `src/components/TransportBar.jsx`

```javascript
const handleSelectBarCount = useCallback((n) => {
  // initializeBarCount is now async
  // Fire and forget with error handling
  initializeBarCount(n).catch((error) => {
    console.error('Error initializing bar count:', error)
  })
}, [initializeBarCount])
```

**Impact:** The UI handler gracefully handles the async nature of bar count initialization without blocking the UI thread.

## Testing Scenario

### Before Fix:
1. Open app
2. Click bar selector → 2 bars
3. Click Play
4. Result: **Silent (or only host patterns play)**

### After Fix:
1. Open app
2. Click bar selector → 2 bars
3. Audio context initializes in background
4. Click Play
5. Result: **Full polyrhythmic pattern plays across 2 bars**

## Technical Details

- `initializeBarCount` dependency array now includes `isInitialized` to trigger callback recreation when init state changes
- No additional state variables needed
- Leverages existing `initializeAudio` logic with proper sequencing
- Audio context initialization via bar selector is a valid user gesture (browser requirement)
- All promises are properly handled to avoid unhandled rejections

## Future Considerations

1. **UI Feedback:** Consider disabling bar selector during async initialization
2. **Pattern Persistence:** When user-grid-edits are implemented, this logic will need refinement to preserve edits during resize
3. **Error Recovery:** Current error handling is basic; may need more granular feedback
