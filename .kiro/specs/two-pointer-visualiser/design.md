# Design Document

## Overview

The Two-Pointer Visualiser is a single-page React application (React 19 + Vite + TypeScript) that animates the two-pointer array reversal algorithm. The core design decision is a **precomputed step model**: when the user runs a valid test case, the app generates the complete list of execution steps up front. Every control — Next, Previous, auto-play, and Reset — is then just a matter of moving a single `currentStepIndex` across that immutable list. Rendering is a pure function of the step at that index, so the UI has no hidden animation state to keep in sync.

This keeps the interactive logic (parsing, step generation, navigation) as pure, testable functions, and confines side effects (timers, clipboard) to a thin layer of React hooks and event handlers.

The existing boilerplate in `src/App.tsx` is replaced. Styling uses plain CSS (no UI framework) to satisfy the white-background and yellow-highlight requirements.

## Architecture

```
App (Visualiser root)
├── state: rawInput, parseResult, steps[], currentStepIndex, mode, speed,
│          isPlaying, copyStatus
│
├── Test_Case_Input        ← rawInput, parse error, onChange, onRun
├── Array_View             ← current step (array snapshot, left, right, swapping)
├── Controls               ← Run/Play, Next, Previous, Reset, Speed, isPlaying
└── Code_Panel             ← mode, current step (lineNumber, left/right values), onCopy, copyStatus
```

Data flow is one-directional: user actions update `App` state; derived render data (`steps[currentStepIndex]`) flows down to the presentational components. Only `App` owns state; the four children are presentational and receive props plus callbacks.

### Layering

| Layer | Responsibility | Purity |
| --- | --- | --- |
| `parse.ts` | Parse + validate the comma-separated input | Pure |
| `steps.ts` | Generate the full step list for a parsed array | Pure |
| `code.ts` | Canonical pseudocode + Python source and step→line mapping | Pure data |
| `App.tsx` | State, timers, clipboard, wiring | Side effects |
| `*View.tsx` | Presentation | Pure render |

Separating the pure layers from `App` is what makes the logic unit-testable without a DOM.

## Components and Interfaces

### Data Types

```typescript
// A single value cell; values are strings (input is free-form comma-separated text).
type CellValue = string

// The kinds of step the engine emits.
type StepKind = 'init' | 'compare' | 'swap' | 'advance' | 'done'

interface Step {
  kind: StepKind
  // Snapshot of the array AS OF this step (post-swap for swap steps).
  array: CellValue[]
  // Pointer positions for this step. For 'done', left >= right.
  left: number
  right: number
  // True only on 'swap' steps; drives the Swap_Animation.
  swapping: boolean
  // Index into the Python source lines to highlight (Requirement 4.3).
  lineNumber: number
}

interface ParseSuccess {
  ok: true
  values: CellValue[]
}

interface ParseFailure {
  ok: false
  error: string
}

type ParseResult = ParseSuccess | ParseFailure
```

### `parse.ts`

```typescript
// Requirements 1.2, 1.3
export function parseTestCase(raw: string): ParseResult {
  // Split on commas, trim each token.
  const tokens = raw.split(',').map((t) => t.trim())
  // Keep only non-empty tokens, preserving input order.
  const values = tokens.filter((t) => t.length > 0)
  if (values.length === 0) {
    return { ok: false, error: 'Enter at least one value, separated by commas.' }
  }
  return { ok: true, values }
}
```

Note on order: requirement 1.2 says each element equals a trimmed value in input order. Empty gaps (e.g. `a,,b`) are dropped rather than treated as blank cells, which is what makes a "no non-empty value" input (`,,` or whitespace) fail validation per 1.3.

### `steps.ts`

The generator walks the two pointers from the ends inward, emitting a `compare` step, then a `swap` step (when the values differ or unconditionally — see below), then an `advance` step, terminating with a `done` step when `left >= right`.

```typescript
// Requirements 2.2, 2.3, 3.2, 3.3, 4.3
export function generateSteps(input: CellValue[]): Step[] {
  const steps: Step[] = []
  let arr = [...input]
  let left = 0
  let right = arr.length - 1

  // init: show the untouched array before any pointer work.
  steps.push({ kind: 'init', array: [...arr], left, right, swapping: false,
               lineNumber: LINE.def })

  while (left < right) {
    // compare: pointers positioned, no mutation yet.
    steps.push({ kind: 'compare', array: [...arr], left, right, swapping: false,
                 lineNumber: LINE.while })

    // swap: exchange the two values, snapshot reflects the swap.
    arr = swapAt(arr, left, right)
    steps.push({ kind: 'swap', array: [...arr], left, right, swapping: true,
                 lineNumber: LINE.swap })

    // advance: move pointers toward each other.
    left += 1
    right -= 1
    steps.push({ kind: 'advance', array: [...arr], left, right, swapping: false,
                 lineNumber: LINE.advance })
  }

  // done: pointers have met or crossed; array is fully reversed.
  steps.push({ kind: 'done', array: [...arr], left, right, swapping: false,
               lineNumber: LINE.return })
  return steps
}

function swapAt(arr: CellValue[], i: number, j: number): CellValue[] {
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  return copy
}
```

Design choices:
- **Unconditional swap.** Standard in-place reversal swaps at every step regardless of whether the values already match; this keeps the animation rhythm predictable and the final array is always the exact reverse of the input (validated by property 6).
- **Immutable snapshots.** Each step carries its own `array` copy, so navigating backward is free — no need to re-run or undo anything. This is the key enabler for Previous and Reset.
- **Termination.** The loop condition `left < right` guarantees no swap occurs once pointers meet or cross (Requirement 3.3). Odd-length arrays leave the middle element untouched.

### `code.ts`

Holds the two canonical code strings and the line map used by `lineNumber`.

```typescript
export const PSEUDOCODE = `set left to first index
set right to last index
while left < right:
    swap values at left and right
    move left forward, right backward
return the reversed array`

export const PYTHON = `def reverse(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
    return arr`

// Zero-based indices into PYTHON.split('\n').
export const LINE = {
  def: 0,
  while: 2,
  swap: 3,
  advance: 4,
  return: 6,
} as const
```

The `Code_Panel` in Python_Mode also renders the live pointer values inline (Requirement 4.4), e.g. a caption line `left = arr[{left}] = "{array[left]}"  right = arr[{right}] = "{array[right]}"` derived from the current step. For the `done` step where pointers have crossed, the caption reports completion instead of indices.

### `Test_Case_Input`

```typescript
interface TestCaseInputProps {
  value: string
  error: string | null      // null when valid; message when invalid (1.3)
  disabled: boolean         // disabled while a run is active
  onChange: (raw: string) => void
  onRun: () => void         // gated: only callable when valid
}
```

Behavior: on every change `App` re-parses and stores the result. When `parseResult.ok` is false, the error is shown inline and the Run control is disabled (1.3, 1.4); when the user corrects the input the error clears and Run re-enables (1.5).

### `Array_View`

```typescript
interface ArrayViewProps {
  array: CellValue[]
  left: number
  right: number
  running: boolean
  swapping: boolean
}
```

Renders one `Cell` per element (2.2). While `running`, the cells at `left` and `right` get the `active` class (yellow highlight, 2.3, 2.4). On a `swapping` step the two active cells also get a `swap` class that triggers the CSS transition (3.1).

### `Controls`

```typescript
interface ControlsProps {
  isPlaying: boolean
  canStepBack: boolean      // currentStepIndex > 0
  canStepForward: boolean   // currentStepIndex < steps.length - 1
  speedMs: number
  onRun: () => void         // Run/Play → auto-advance (5.1)
  onNext: () => void        // (5.2)
  onPrev: () => void        // (5.3)
  onSpeedChange: (ms: number) => void  // (5.4)
  onReset: () => void       // (5.5)
}
```

### `Code_Panel`

```typescript
interface CodePanelProps {
  mode: 'pseudocode' | 'python'
  currentLine: number       // used only in python mode
  leftValue: CellValue | null
  rightValue: CellValue | null
  onCopy: () => void
  copyStatus: 'idle' | 'copied' | 'error'
}
```

Before a run, `mode` is `pseudocode` (4.1); when a run begins it switches to `python` (4.2), highlighting `currentLine` (4.3) and showing the inline pointer values (4.4). The panel uses `min-height` plus natural flow so it grows as the inline execution caption appears (4.5). Copy status renders a confirmation or an inline error (6.2, 6.3).

## State Model — The Step-Index Engine

`App` holds:

```typescript
const [rawInput, setRawInput] = useState('')
const [parseResult, setParseResult] = useState<ParseResult>(parseTestCase(''))
const [steps, setSteps] = useState<Step[] | null>(null)   // null = pre-run (pseudocode)
const [currentStepIndex, setCurrentStepIndex] = useState(0)
const [speedMs, setSpeedMs] = useState(700)
const [isPlaying, setIsPlaying] = useState(false)
const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

const mode: 'pseudocode' | 'python' = steps === null ? 'pseudocode' : 'python'
const currentStep = steps ? steps[currentStepIndex] : null
```

Everything the UI shows during a run is `steps[currentStepIndex]`. The controls only mutate the index (and `steps`/`isPlaying`):

- **Run/Play** — `generateSteps(parseResult.values)` if not already generated, set `isPlaying = true`. An effect drives auto-advance.
- **Next** — `setCurrentStepIndex((i) => Math.min(i + 1, steps.length - 1))` (5.2).
- **Previous** — `setCurrentStepIndex((i) => Math.max(i - 1, 0))` (5.3).
- **Speed** — `setSpeedMs(ms)`; the auto-advance effect depends on `speedMs`, so a change re-arms the timer at the new interval (5.4).
- **Reset** — `setSteps(null); setCurrentStepIndex(0); setIsPlaying(false)`, restoring the original parsed array view and pseudocode mode (5.5).

### Auto-play effect

```typescript
useEffect(() => {
  if (!isPlaying || !steps) return
  if (currentStepIndex >= steps.length - 1) {
    setIsPlaying(false)      // stop at the final step
    return
  }
  const id = setTimeout(
    () => setCurrentStepIndex((i) => i + 1),
    speedMs,
  )
  return () => clearTimeout(id)
}, [isPlaying, steps, currentStepIndex, speedMs])
```

Because the effect re-runs on `currentStepIndex` and `speedMs`, each tick schedules the next one and speed changes take effect immediately. Manual Next/Previous during play simply reschedule the timer.

## Swap Animation Approach

Swaps are animated purely with CSS transitions, keyed off the `swapping` flag on the current step:

- Each `Cell` is `position: relative` with `transition: transform 300ms ease, background-color 150ms ease`.
- On a `swap` step, the left active cell gets `transform: translateX(<gap toward right>)` and the right cell the mirrored translate, so they visibly slide toward each other's slots.
- The next step (`advance`) carries the post-swap snapshot with `swapping: false`, so the transforms release and the cells settle showing the exchanged values (3.2).

Because the value snapshot already reflects the swap on the `swap` step, the animation is decorative rather than load-bearing — correctness never depends on the transition firing, which keeps the logic testable headlessly. `prefers-reduced-motion` disables the transform for accessibility.

## Styling

- Root background is white (`#ffffff`) (2.1).
- `Cell.active` uses a yellow highlight (`background-color: #ffe066`) against the white surface (2.3). Non-active cells keep a neutral border on white.
- Python `Current_Line` highlight uses a subtle band; the active pointer values render in an inline caption beneath the code.

## Copy-to-Clipboard

```typescript
// Requirements 6.1, 6.2, 6.3
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(PYTHON)
    setCopyStatus('copied')
    window.setTimeout(() => setCopyStatus('idle'), 2000)
  } catch {
    setCopyStatus('error')
  }
}
```

`copyStatus` drives the confirmation (`copied`) or inline error (`error`) message in `Code_Panel`. The confirmation auto-dismisses; the error persists until the next copy attempt. If `navigator.clipboard` is unavailable the call throws and is handled by the same `catch`, producing the error message.

## Input Parsing / Validation and Run Gating

- On every keystroke, `App` calls `parseTestCase(rawInput)` and stores the result.
- Invalid → inline error shown, Run disabled (1.3, 1.4).
- Valid → error cleared, Run enabled (1.5).
- `onRun` is only wired to fire when `parseResult.ok`, so Run cannot start on invalid input even if the disabled state were bypassed.

## Error Handling

| Condition | Handling | Requirement |
| --- | --- | --- |
| Empty / whitespace / commas-only input | Inline error, Run disabled | 1.3, 1.4 |
| Input corrected to valid | Error cleared, Run enabled | 1.5 |
| Clipboard write rejects or API missing | Inline copy error message | 6.3 |
| Navigation at boundaries | Index clamped to `[0, length-1]`, no throw | 5.2, 5.3 |

There are no network calls or persistence, so these are the complete failure surfaces.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Parse preserves trimmed tokens in order

*For any* list of non-empty tokens whose trimmed forms are non-empty, joining them with commas (with arbitrary surrounding whitespace around each token) and passing the result to `parseTestCase` yields `ok: true` with `values` equal to the trimmed tokens in the original order.

**Validates: Requirements 1.2**

### Property 2: Empty inputs are rejected

*For any* string that contains no non-empty token between commas (the empty string, whitespace-only strings, and strings composed only of commas and whitespace), `parseTestCase` returns `ok: false` with a non-empty error message.

**Validates: Requirements 1.3**

### Property 3: Cell count matches array length

*For any* parsed array, the `init` step's `array` (the snapshot the Array_View renders one Cell per) has length equal to the parsed array's length.

**Validates: Requirements 2.2**

### Property 4: Step integrity — active indices and inline values are self-consistent

*For any* parsed array and *for any* step in the generated step list, the step's active pointer indices are exactly `left` and `right`, and the inline values displayed for those pointers equal `array[left]` and `array[right]` of that step's snapshot (for steps where `left < right`).

**Validates: Requirements 2.3, 2.4, 4.4**

### Property 5: Swap steps exchange exactly the two pointer values

*For any* parsed array and *for any* `swap` step, the step's snapshot equals the immediately preceding step's snapshot with the values at indices `left` and `right` exchanged and all other positions unchanged.

**Validates: Requirements 3.2**

### Property 6: Termination and full reversal

*For any* parsed array, every `swap` step satisfies `left < right`, and the final (`done`) step's snapshot equals the exact reverse of the input array.

**Validates: Requirements 3.3**

### Property 7: Every step maps to a valid Python line

*For any* parsed array and *for any* generated step, the step's `lineNumber` is a valid index into `PYTHON.split('\n')` and equals the line designated for that step's kind.

**Validates: Requirements 4.3**

### Property 8: Navigation round-trip and boundary clamping

*For any* generated step list and *for any* index `i`, advancing then retreating returns to `i` when `i` is not at the upper boundary, and neither operation ever produces an index outside `[0, length - 1]`.

**Validates: Requirements 5.2, 5.3**

### Property 9: Reset restores the original array

*For any* parsed array and *for any* sequence of Next/Previous navigation, performing Reset returns the view to a snapshot equal to the original parsed array (the pre-run state).

**Validates: Requirements 5.5**

## Testing Strategy

No test framework is currently installed. The pure layers (`parse.ts`, `steps.ts`, `code.ts`) carry all of the algorithmic correctness and are the highest-value test targets, so the recommendation is to add **Vitest** — it integrates directly with the existing Vite config, needs minimal setup, and supports both example and property-based tests.

Recommended setup:
- Add `vitest` as a dev dependency and a `"test": "vitest run"` script (use `vitest run` for single execution rather than watch mode).
- Add `fast-check` for property-based tests (it is the standard PBT library in the TS/JS ecosystem).

**Property tests** (Vitest + fast-check, minimum 100 iterations each) cover the pure logic:
- Properties 1–2 against `parse.ts`.
- Properties 3–7 against `steps.ts` / `code.ts`, generating random arrays of strings (including odd/even lengths, duplicate values, and empty-string-adjacent tokens).
- Properties 8–9 against the navigation reducers (extracted as pure `next`/`prev`/`reset` helpers so they test without React).

Each property test is tagged: **Feature: two-pointer-visualiser, Property {number}: {property_text}**.

**Example / component tests** cover the side-effecting and UI-state behavior that is not input-varying:
- Run gating and error display (1.4, 1.5), mode transitions (4.1, 4.2), auto-play with fake timers (5.1, 5.4), and clipboard success/failure with a mocked `navigator.clipboard` (6.1, 6.2, 6.3). These would use Vitest with a jsdom environment and a lightweight renderer (e.g. `@testing-library/react`).

**Not property-tested** (per the classification prework): white background (2.1), panel expansion (4.5), and the swap animation playback (3.1) are visual/CSS concerns verified manually or via snapshot; clipboard and timer behaviors are example tests because they exercise external APIs rather than input-varying logic.
