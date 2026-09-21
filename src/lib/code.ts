// Canonical code sources for the Code_Panel and the step -> line mapping.
// Contents mirror the "code.ts" section of the design document.
// Requirements 4.1 (pseudocode), 4.2 (Python), 4.3 (line mapping).

export const PSEUDOCODE = `set left to first index
set right to last index
while left < right:
    swap values at left and right
    move left forward, right backward
return the reversed array`

export const PYTHON = `def reverse(arr):
    left = 0
    right = len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
    return arr`

// Zero-based indices into PYTHON.split('\n').
export const LINE = {
  def: 0,
  initLeft: 1, // left = 0
  initRight: 2, // right = len(arr) - 1
  while: 3,
  swap: 4,
  advanceLeft: 5, // left += 1
  advanceRight: 6, // right -= 1
  return: 7,
} as const
