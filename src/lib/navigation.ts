// Pure navigation reducers for the step-index engine.
// Extracted from App so they can be tested without React (see design "State Model").
//
// The engine models execution as a single `currentStepIndex` moving across an
// immutable `steps` list. Next/Previous only move the index (clamped to the
// valid range); Reset returns to the pre-run state.

import type { Step } from './types'

// Advance the index by one step, clamped to the last valid index.
// Requirement 5.2: activating Next advances execution by one step.
export function next(i: number, length: number): number {
  return Math.min(i + 1, length - 1)
}

// Retreat the index by one step, clamped to the first index.
// Requirement 5.3: activating Previous returns to the immediately preceding step.
export function prev(i: number): number {
  return Math.max(i - 1, 0)
}

// The pre-run state the Visualiser returns to on Reset.
// `steps: null` puts the Code_Panel back into Pseudocode_Mode and the
// Array_View back to the original parsed array; the index is 0 and auto-play
// is stopped.
export interface ResetState {
  steps: Step[] | null
  currentStepIndex: number
  isPlaying: boolean
}

// Return the pre-run state: index 0, steps cleared, playback stopped.
// Requirement 5.5: Reset returns the Array_View to the initial Parsed_Array
// and the Code_Panel to Pseudocode_Mode.
export function reset(): ResetState {
  return {
    steps: null,
    currentStepIndex: 0,
    isPlaying: false,
  }
}
