# Implementation Plan: Two-Pointer Visualiser

## Overview

Implementation follows the layered design: pure logic first (`parse.ts`, `steps.ts`, `code.ts`, navigation reducers), each validated by fast-check property tests, then the presentational React components, then the `App` state/timer/clipboard wiring, and finally styling. The plan starts by adding Vitest + fast-check so property tests can run alongside implementation, and ends by replacing the boilerplate in `src/App.tsx` and wiring everything together. TypeScript is used throughout (React 19 + Vite), matching the existing project.

## Tasks

- [x] 1. Set up testing framework and shared types
  - [x] 1.1 Add Vitest + fast-check and test scripts
    - Add `vitest`, `fast-check`, `jsdom`, and `@testing-library/react` as dev dependencies
    - Add a `"test": "vitest run"` script to `package.json` (single-run, not watch)
    - Configure the Vitest environment (`jsdom`) in `vite.config.ts` (or `vitest.config.ts`) with globals enabled
    - _Requirements: (test infrastructure for all property/example tests)_

  - [x] 1.2 Define shared data types
    - Create `src/lib/types.ts` with `CellValue`, `StepKind`, `Step`, `ParseSuccess`, `ParseFailure`, `ParseResult`
    - _Requirements: 1.2, 2.2, 3.2, 4.3_

- [x] 2. Implement the input parsing layer
  - [x] 2.1 Implement `parseTestCase`
    - Create `src/lib/parse.ts` implementing `parseTestCase(raw)`: split on commas, trim tokens, drop empty tokens, return `ok:true` with values in order or `ok:false` with a non-empty error message
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 2.2 Write property test — parse preserves trimmed tokens in order
    - **Property 1: Parse preserves trimmed tokens in order**
    - **Validates: Requirements 1.2**
    - Tag: Feature: two-pointer-visualiser, Property 1; min 100 iterations

  - [ ]* 2.3 Write property test — empty inputs are rejected
    - **Property 2: Empty inputs are rejected**
    - **Validates: Requirements 1.3**
    - Tag: Feature: two-pointer-visualiser, Property 2; min 100 iterations

- [x] 3. Implement the code source layer
  - [x] 3.1 Add pseudocode, Python source, and line map
    - Create `src/lib/code.ts` exporting `PSEUDOCODE`, `PYTHON`, and the `LINE` map (`def`, `while`, `swap`, `advance`, `return`) as zero-based indices into `PYTHON.split('\n')`
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Implement the step-generation layer
  - [x] 4.1 Implement `generateSteps` and `swapAt`
    - Create `src/lib/steps.ts` implementing `generateSteps(input)`: emit `init`, then per iteration `compare`/`swap`/`advance` while `left < right`, then `done`; each step carries an immutable array snapshot, `left`, `right`, `swapping`, and `lineNumber` from `LINE`
    - Implement `swapAt` as a pure, non-mutating swap helper
    - _Requirements: 2.2, 2.3, 2.4, 3.2, 3.3, 4.3, 4.4_

  - [ ]* 4.2 Write property test — cell count matches array length
    - **Property 3: Cell count matches array length**
    - **Validates: Requirements 2.2**
    - Tag: Feature: two-pointer-visualiser, Property 3; min 100 iterations

  - [ ]* 4.3 Write property test — step integrity (active indices and inline values)
    - **Property 4: Step integrity — active indices and inline values are self-consistent**
    - **Validates: Requirements 2.3, 2.4, 4.4**
    - Tag: Feature: two-pointer-visualiser, Property 4; min 100 iterations

  - [ ]* 4.4 Write property test — swap steps exchange exactly the two pointer values
    - **Property 5: Swap steps exchange exactly the two pointer values**
    - **Validates: Requirements 3.2**
    - Tag: Feature: two-pointer-visualiser, Property 5; min 100 iterations

  - [ ]* 4.5 Write property test — termination and full reversal
    - **Property 6: Termination and full reversal**
    - **Validates: Requirements 3.3**
    - Tag: Feature: two-pointer-visualiser, Property 6; min 100 iterations

  - [ ]* 4.6 Write property test — every step maps to a valid Python line
    - **Property 7: Every step maps to a valid Python line**
    - **Validates: Requirements 4.3**
    - Tag: Feature: two-pointer-visualiser, Property 7; min 100 iterations

- [x] 5. Extract pure navigation reducers
  - [x] 5.1 Implement `next`, `prev`, and `reset` helpers
    - Create `src/lib/navigation.ts` with pure index reducers: `next(i, length)` clamped to `length-1`, `prev(i)` clamped to `0`, and a `reset` helper returning the pre-run state (index 0, steps cleared)
    - _Requirements: 5.2, 5.3, 5.5_

  - [ ]* 5.2 Write property test — navigation round-trip and boundary clamping
    - **Property 8: Navigation round-trip and boundary clamping**
    - **Validates: Requirements 5.2, 5.3**
    - Tag: Feature: two-pointer-visualiser, Property 8; min 100 iterations

  - [ ]* 5.3 Write property test — reset restores the original array
    - **Property 9: Reset restores the original array**
    - **Validates: Requirements 5.5**
    - Tag: Feature: two-pointer-visualiser, Property 9; min 100 iterations

- [x] 6. Checkpoint - Ensure all pure-layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Build the presentational components
  - [x] 7.1 Implement `Test_Case_Input`
    - Create `src/components/TestCaseInput.tsx` with `TestCaseInputProps` (value, error, disabled, onChange, onRun); render the text field, inline error when present, and gate the Run trigger
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 7.2 Implement `Array_View`
    - Create `src/components/ArrayView.tsx` with `ArrayViewProps` (array, left, right, running, swapping); render one Cell per element, apply `active` class to the `left`/`right` cells while running, and add the `swap` class on swapping steps
    - _Requirements: 2.2, 2.3, 2.4, 3.1_

  - [x] 7.3 Implement `Controls`
    - Create `src/components/Controls.tsx` with `ControlsProps` (isPlaying, canStepBack, canStepForward, speedMs, onRun, onNext, onPrev, onSpeedChange, onReset); render Run/Play, Next, Previous, Reset, and the Speed control with enable/disable per props
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.4 Implement `Code_Panel`
    - Create `src/components/CodePanel.tsx` with `CodePanelProps` (mode, currentLine, leftValue, rightValue, onCopy, copyStatus); render pseudocode vs Python, highlight `currentLine`, show inline pointer values, expose the Copy control, and render copy confirmation/error
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3_

  - [ ]* 7.5 Write component tests for Test_Case_Input and Code_Panel
    - Test run gating + error display (1.4, 1.5) and Code_Panel pseudocode/python rendering and copy status messaging (4.1, 4.2, 6.2, 6.3)
    - _Requirements: 1.4, 1.5, 4.1, 4.2, 6.2, 6.3_

- [ ] 8. Wire App state, timers, and clipboard
  - [-] 8.1 Implement App state and derived render data
    - Rewrite `src/App.tsx` to own state (`rawInput`, `parseResult`, `steps`, `currentStepIndex`, `speedMs`, `isPlaying`, `copyStatus`); re-parse on every change; derive `mode`, `currentStep`, and control-enable flags; render the four components with props/callbacks
    - _Requirements: 1.4, 1.5, 2.1, 4.1, 4.2, 4.3, 4.4, 5.2, 5.3, 5.5_

  - [-] 8.2 Implement Run and auto-play effect
    - On Run, generate steps (if needed) and set `isPlaying`; add the `useEffect` auto-advance timer keyed on `isPlaying`/`steps`/`currentStepIndex`/`speedMs` that stops at the final step and re-arms on speed change
    - _Requirements: 5.1, 5.4_

  - [-] 8.3 Implement copy-to-clipboard handler
    - Add `handleCopy` using `navigator.clipboard.writeText(PYTHON)`, setting `copyStatus` to `copied` (auto-dismiss) on success and `error` on rejection/missing API
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 8.4 Write example tests for auto-play and clipboard
    - Use fake timers for auto-play at the speed interval (5.1, 5.4) and a mocked `navigator.clipboard` for success and failure paths (6.1, 6.2, 6.3)
    - _Requirements: 5.1, 5.4, 6.1, 6.2, 6.3_

- [x] 9. Styling
  - [x] 9.1 Implement visual styling
    - Update `src/App.css`/`src/index.css`: white root background, neutral cells on white, `Cell.active` yellow highlight (`#ffe066`), Python current-line highlight band, Code_Panel `min-height`/natural growth, swap `transform` transition, and a `prefers-reduced-motion` fallback
    - _Requirements: 2.1, 2.3, 3.1, 4.5_

- [ ] 10. Final checkpoint - Ensure all tests pass and the build succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (all test sub-tasks) and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Property tests (Vitest + fast-check, min 100 iterations, tagged per property) validate the pure layers; component/example tests cover run gating, mode transitions, auto-play, and clipboard.
- Checkpoints (tasks 6 and 10) ensure incremental validation.
- The existing `src/App.tsx` boilerplate is replaced in task 8.1.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1", "5.2", "5.3"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "7.1", "7.2", "7.3", "7.4", "9.1"] },
    { "id": 4, "tasks": ["7.5", "8.1"] },
    { "id": 5, "tasks": ["8.2", "8.3"] },
    { "id": 6, "tasks": ["8.4"] }
  ]
}
```
