import React from 'react'
import { calculatePhraseGroupings } from '../audio/phraseCalculator'

export function PhraseTest() {
  const test1 = calculatePhraseGroupings(1)
  const test2 = calculatePhraseGroupings(2)
  const test3 = calculatePhraseGroupings(3)
  const test4 = calculatePhraseGroupings(4)

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f0f0f0', margin: '2rem', borderRadius: '8px' }}>
      <h2>Phrase Calculation Test</h2>
      <pre>{JSON.stringify({ test1, test2, test3, test4 }, null, 2)}</pre>
      <p>Expected:</p>
      <pre>{`test1: [[3,3,3,3,3,1]]
test2: [[3,3,3,3,3,1], [2,3,3,3,3,2]]
test3: [[3,3,3,3,3,1], [2,3,3,3,3,2], [1,3,3,3,3,3]]
test4: [[3,3,3,3,3,1], [2,3,3,3,3,2], [1,3,3,3,3,3], [3,3,3,3,3,1]]`}</pre>
    </div>
  )
}

export default PhraseTest
