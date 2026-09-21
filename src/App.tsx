// App — the Visualiser root. Owns all state and confines side effects (the
// auto-play timer and the clipboard write) to hooks/handlers, per the design's
// "State Model — The Step-Index Engine" section.
//
// Execution is modelled as a single `currentStepIndex` moving across an
// immutable `steps` list generated up front. Everything the UI shows during a
// run is a pure function of `steps[currentStepIndex]`; the controls only mutate
// the index (plus `steps`/`isPlaying`).
//
// Requirements: 1.4, 1.5, 2.1, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5,
// 6.1, 6.2, 6.3.

import { useEffect, useState } from 'react'
import './App.css'

import { parseTestCase } from './lib/parse'
import { generateSteps } from './lib/steps'
import { next, prev, reset } from './lib/navigation'
import { PYTHON } from './lib/code'
import type { CellValue, ParseResult, Step } from './lib/types'

import { TestCaseInput } from './components/TestCaseInput'
import { ArrayView } from './components/ArrayView'
import { Controls } from './components/Controls'
import { CodePanel } from './components/CodePanel'

function App() {
  // rawInput drives Test_Case_Input; parseResult is recomputed on every change.
  // The visualiser starts empty; a run begins only when the user clicks
  // Run/Play (Requirement 5.1).
  const [rawInput, setRawInput] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult>(
    parseTestCase(''),
  )
  // steps === null is the pre-run state (Pseudocode_Mode); a step list means a
  // run has begun (Python_Mode).
  const [steps, setSteps] = useState<Step[] | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [speedMs, setSpeedMs] = useState(700)
  const [isPlaying, setIsPlaying] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  )

  // Derived render data ------------------------------------------------------

  // Pre-run shows pseudocode (4.1); once a run begins we switch to Python (4.2).
  const mode: 'pseudocode' | 'python' = steps === null ? 'pseudocode' : 'python'
  const currentStep = steps ? steps[currentStepIndex] : null

  // The array to render: the current step's snapshot during a run, otherwise
  // the freshly parsed values so the user previews their input before running.
  const displayArray: CellValue[] = currentStep
    ? currentStep.array
    : parseResult.ok
      ? parseResult.values
      : []

  const running = currentStep !== null
  const left = currentStep ? currentStep.left : -1
  const right = currentStep ? currentStep.right : -1
  const swapping = currentStep ? currentStep.swapping : false
  // Indices whose values just landed this step; drives the Place_Effect.
  const placed = currentStep ? currentStep.placed : []

  // Inline pointer values for the Code_Panel (4.4). Show a pointer's value
  // whenever that pointer references a real slot (index >= 0). During the first
  // init step the right pointer is unset (-1) so only left has a value; on the
  // `done` step the pointers have crossed and neither is valid, so the caption
  // falls back to the completion message.
  const leftValid =
    currentStep !== null && currentStep.kind !== 'done' && currentStep.left >= 0
  const rightValid =
    currentStep !== null &&
    currentStep.kind !== 'done' &&
    currentStep.right >= 0
  const leftValue: CellValue | null = leftValid
    ? currentStep!.array[currentStep!.left]
    : null
  const rightValue: CellValue | null = rightValid
    ? currentStep!.array[currentStep!.right]
    : null

  // Control-enable flags.
  const canStepBack = steps !== null && currentStepIndex > 0
  const canStepForward = steps !== null && currentStepIndex < steps.length - 1

  const inputError = parseResult.ok ? null : parseResult.error

  // Handlers -----------------------------------------------------------------

  // Re-parse on every change (1.4, 1.5). Editing the input abandons any active
  // run so the preview reflects the new values.
  const handleInputChange = (raw: string) => {
    setRawInput(raw)
    setParseResult(parseTestCase(raw))
    setSteps(null)
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }

  // Run/Play (5.1): generate the step list on first run, then start auto-play.
  // The auto-advance effect below drives the ticking.
  const handleRun = () => {
    if (!parseResult.ok) return
    if (steps === null) {
      setSteps(generateSteps(parseResult.values))
      setCurrentStepIndex(0)
    }
    setIsPlaying(true)
  }

  // Next / Previous only move the index, clamped to the valid range (5.2, 5.3).
  // Manual stepping pauses auto-play so the user stays in control.
  const handleNext = () => {
    if (steps === null) return
    setIsPlaying(false)
    setCurrentStepIndex((i) => next(i, steps.length))
  }

  const handlePrev = () => {
    if (steps === null) return
    setIsPlaying(false)
    setCurrentStepIndex((i) => prev(i))
  }

  // Speed change (5.4): the auto-advance effect depends on speedMs, so updating
  // it re-arms the timer at the new interval immediately.
  const handleSpeedChange = (ms: number) => {
    setSpeedMs(ms)
  }

  // Reset (5.5): return to the pre-run state — original parsed array preview and
  // Pseudocode_Mode.
  const handleReset = () => {
    const r = reset()
    setSteps(r.steps)
    setCurrentStepIndex(r.currentStepIndex)
    setIsPlaying(r.isPlaying)
  }

  // Copy-to-clipboard (6.1, 6.2, 6.3). On success show a confirmation that
  // auto-dismisses after ~2s; on rejection or a missing API show a persistent
  // inline error.
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PYTHON)
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setCopyStatus('error')
    }
  }

  // Auto-play effect ---------------------------------------------------------
  // Each tick schedules the next one; the effect re-runs on currentStepIndex and
  // speedMs so speed changes take effect immediately and playback stops cleanly
  // at the final step.
  useEffect(() => {
    if (!isPlaying || !steps) return
    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false) // stop at the final step
      return
    }
    const id = window.setTimeout(
      () => setCurrentStepIndex((i) => i + 1),
      speedMs,
    )
    return () => window.clearTimeout(id)
  }, [isPlaying, steps, currentStepIndex, speedMs])

  // Render -------------------------------------------------------------------

  return (
    <div className="visualiser">
      <TestCaseInput
        value={rawInput}
        error={inputError}
        disabled={running}
        onChange={handleInputChange}
        onRun={handleRun}
      />

      <ArrayView
        array={displayArray}
        left={left}
        right={right}
        running={running}
        swapping={swapping}
        placed={placed}
      />

      <Controls
        isPlaying={isPlaying}
        canStepBack={canStepBack}
        canStepForward={canStepForward}
        speedMs={speedMs}
        onRun={handleRun}
        onNext={handleNext}
        onPrev={handlePrev}
        onSpeedChange={handleSpeedChange}
        onReset={handleReset}
      />

      <CodePanel
        mode={mode}
        currentLine={currentStep ? currentStep.lineNumber : 0}
        leftValue={leftValue}
        rightValue={rightValue}
        onCopy={handleCopy}
        copyStatus={copyStatus}
      />
    </div>
  )
}

export default App
