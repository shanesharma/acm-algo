// Array_View presentational component for the two-pointer visualiser.
// Implementation mirrors the "Array_View" section of the design document.
// Requirements 2.2, 2.3, 2.4, 3.1.

import type { CSSProperties } from 'react'
import type { CellValue } from '../lib/types'

export interface ArrayViewProps {
  array: CellValue[]
  left: number
  right: number
  running: boolean
  swapping: boolean
  // Indices whose values were just committed this step; they get the
  // Place_Effect settle animation.
  placed: number[]
}

// Cell footprint must match the CSS: min-width 48px + 12px gap. On a swap the
// left and right cells travel this many pixels toward each other's slot so the
// exchange reads as real movement rather than an in-place bounce (Req 3.1).
const CELL_ADVANCE = 60 // 48px cell + 12px gap

// Renders one Cell per element (2.2). While `running`, the cells at the
// `left` and `right` pointer indices get the `active` class for the yellow
// highlight (2.3, 2.4). On a `swapping` step those active cells slide toward
// each other's position: the left cell moves right, the right cell moves left,
// covering the exact gap between them so they visibly trade places (3.1).
// The distance is handed to CSS via the `--swap-shift` custom property so the
// animation adapts to how far apart the pointers are.
export function ArrayView({
  array,
  left,
  right,
  running,
  swapping,
  placed,
}: ArrayViewProps) {
  const distance = (right - left) * CELL_ADVANCE

  return (
    <div className="array-view">
      {array.map((value, index) => {
        const isActive = running && (index === left || index === right)
        const isSwapping = isActive && swapping
        const isPlaced = placed.includes(index)
        const isLeft = index === left
        const className = [
          'cell',
          isActive ? 'active' : '',
          isSwapping ? 'swap' : '',
          isPlaced ? 'place' : '',
        ]
          .filter(Boolean)
          .join(' ')

        // Left cell shifts right (+), right cell shifts left (−).
        const style: CSSProperties | undefined = isSwapping
          ? ({
              '--swap-shift': `${isLeft ? distance : -distance}px`,
            } as CSSProperties)
          : undefined

        return (
          <div key={index} className={className} style={style}>
            {value}
          </div>
        )
      })}
    </div>
  )
}
