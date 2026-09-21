// Shared data types for the two-pointer visualiser.
// Definitions mirror the "Data Types" section of the design document.

// A single value cell; values are strings (input is free-form comma-separated text).
export type CellValue = string

// The kinds of step the engine emits.
export type StepKind = 'init' | 'compare' | 'swap' | 'advance' | 'done'

export interface Step {
  kind: StepKind
  // Snapshot of the array AS OF this step (post-swap for swap steps).
  array: CellValue[]
  // Pointer positions for this step. For 'done', left >= right.
  left: number
  right: number
  // True only on 'swap' steps; drives the Swap_Animation.
  swapping: boolean
  // The two indices whose values were just committed into place on this step.
  // Set only on 'advance' steps (the moment the swap is applied); drives the
  // Place_Effect settle animation. Empty on every other step.
  placed: number[]
  // Index into the Python source lines to highlight (Requirement 4.3).
  lineNumber: number
}

export interface ParseSuccess {
  ok: true
  values: CellValue[]
}

export interface ParseFailure {
  ok: false
  error: string
}

export type ParseResult = ParseSuccess | ParseFailure
