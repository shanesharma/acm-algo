// Step-generation layer for the two-pointer visualiser.
// Implementation mirrors the "steps.ts" section of the design document.
// Requirements 2.2, 2.3, 2.4, 3.2, 3.3, 4.3, 4.4.

import type { CellValue, Step } from './types'
import { LINE } from './code'

// Generate the full, immutable step list for a parsed array.
// Emits `init`, then per iteration `compare`/`swap`/`advance` while
// left < right, and terminates with `done` once the pointers meet or cross.
export function generateSteps(input: CellValue[]): Step[] {
  const steps: Step[] = []
  let arr = [...input]
  let left = 0
  let right = arr.length - 1

  // init-left: the `left = 0` line runs. Only the Left_Pointer exists yet, so
  // right is reported as -1 (unset) and only the left Cell highlights — the
  // pointer visibly initializes together with its line of code.
  steps.push({
    kind: 'init',
    array: [...arr],
    left,
    right: -1,
    swapping: false,
    placed: [],
    lineNumber: LINE.initLeft,
  })

  // init-right: the `right = len(arr) - 1` line runs. The Right_Pointer now
  // takes its position and both Cells highlight.
  steps.push({
    kind: 'init',
    array: [...arr],
    left,
    right,
    swapping: false,
    placed: [],
    lineNumber: LINE.initRight,
  })

  while (left < right) {
    // compare: pointers positioned, no mutation yet.
    steps.push({
      kind: 'compare',
      array: [...arr],
      left,
      right,
      swapping: false,
      placed: [],
      lineNumber: LINE.while,
    })

    // swap: snapshot the PRE-swap array so the two cells still show the values
    // that are about to trade places. The Swap_Animation slides those cells
    // toward each other's slot, so the letters the user sees moving are the
    // real ones. The values are not committed until the `advance` step below,
    // once the cells have returned to rest — otherwise the letters would
    // teleport to their swapped values while an empty box merely drifts.
    steps.push({
      kind: 'swap',
      array: [...arr],
      left,
      right,
      swapping: true,
      placed: [],
      lineNumber: LINE.swap,
    })

    // Commit the swap now. The two slots that received new values are reported
    // via `placed` on the first advance step below so the Place_Effect settle
    // plays exactly where the sliding cells came to rest.
    const placed = [left, right]
    arr = swapAt(arr, left, right)

    // advance-left: the `left += 1` line runs. The Left_Pointer steps forward
    // by one; the Right_Pointer holds. Pairing one pointer move with one line
    // keeps the highlight and the motion in sync.
    left += 1
    steps.push({
      kind: 'advance',
      array: [...arr],
      left,
      right,
      swapping: false,
      placed,
      lineNumber: LINE.advanceLeft,
    })

    // advance-right: the `right -= 1` line runs. The Right_Pointer steps back
    // by one. Values are already placed, so no further Place_Effect here.
    right -= 1
    steps.push({
      kind: 'advance',
      array: [...arr],
      left,
      right,
      swapping: false,
      placed: [],
      lineNumber: LINE.advanceRight,
    })
  }

  // done: pointers have met or crossed; array is fully reversed.
  steps.push({
    kind: 'done',
    array: [...arr],
    left,
    right,
    swapping: false,
    placed: [],
    lineNumber: LINE.return,
  })

  return steps
}

// Pure, non-mutating swap: returns a new array with the values at
// indices i and j exchanged and all other positions unchanged.
export function swapAt(arr: CellValue[], i: number, j: number): CellValue[] {
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j], copy[i]]
  return copy
}
