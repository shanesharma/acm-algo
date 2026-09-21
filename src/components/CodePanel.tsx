// Code_Panel — presentational component.
// Before a run it shows Pseudocode_Mode (4.1); during a run it shows Python_Mode
// (4.2), highlighting the Current_Line (4.3) and rendering the live pointer values
// inline (4.4). It grows naturally as the execution caption appears (4.5) and
// exposes the Copy_Control plus copy confirmation/error messaging (6.1, 6.2, 6.3).
//
// This component is presentational: the actual clipboard write happens in App via
// the onCopy callback. Here we only trigger it and render copyStatus. Styling is
// handled separately via the className hooks below.

import { PSEUDOCODE, PYTHON } from '../lib/code'
import type { CellValue } from '../lib/types'

export interface CodePanelProps {
  mode: 'pseudocode' | 'python'
  currentLine: number // used only in python mode
  leftValue: CellValue | null
  rightValue: CellValue | null
  onCopy: () => void
  copyStatus: 'idle' | 'copied' | 'error'
}

export function CodePanel({
  mode,
  currentLine,
  leftValue,
  rightValue,
  onCopy,
  copyStatus,
}: CodePanelProps) {
  const isPython = mode === 'python'
  const source = isPython ? PYTHON : PSEUDOCODE
  const lines = source.split('\n')

  // Inline pointer-value caption (4.4). Report whichever pointer values are
  // currently live. During initialization only `left` may be set; mid-run both
  // are set; once the pointers have crossed neither is set and we report that
  // the run has completed instead.
  let caption: string
  if (leftValue !== null && rightValue !== null) {
    caption = `left = "${leftValue}"   right = "${rightValue}"`
  } else if (leftValue !== null) {
    caption = `left = "${leftValue}"   right = —`
  } else if (rightValue !== null) {
    caption = `left = —   right = "${rightValue}"`
  } else {
    caption = 'pointers have crossed — array reversed'
  }

  return (
    <section className="code-panel" aria-label="Algorithm code">
      <header className="code-panel__header">
        <span className="code-panel__mode">
          {isPython ? 'Python' : 'Pseudocode'}
        </span>
        <button
          type="button"
          className="code-panel__copy"
          onClick={onCopy}
        >
          Copy
        </button>
      </header>

      <pre className="code-panel__code">
        {lines.map((line, index) => {
          const isCurrent = isPython && index === currentLine
          return (
            <div
              key={index}
              className={
                isCurrent
                  ? 'code-panel__line code-panel__line--current'
                  : 'code-panel__line'
              }
              aria-current={isCurrent ? 'true' : undefined}
            >
              {line === '' ? '\u00A0' : line}
            </div>
          )
        })}
      </pre>

      {isPython && (
        <div className="code-panel__caption">{caption}</div>
      )}

      {copyStatus === 'copied' && (
        <div className="code-panel__status code-panel__status--copied" role="status">
          Copied to clipboard
        </div>
      )}
      {copyStatus === 'error' && (
        <div className="code-panel__status code-panel__status--error" role="alert">
          Copy failed — please try again
        </div>
      )}
    </section>
  )
}

export default CodePanel
