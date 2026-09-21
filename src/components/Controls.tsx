// Controls — presentational execution controls for the Visualiser.
//
// Renders the Run/Play, Next, Previous, Reset controls plus the Speed control.
// This component owns no state; it reflects the props and forwards user actions
// through the callbacks. All styling is applied via className hooks (styling is
// handled in a separate task).
//
// Requirements:
//  - 5.1 Run/Play starts auto-advance.
//  - 5.2 Next advances one step.
//  - 5.3 Previous returns to the preceding step.
//  - 5.4 Speed_Control sets the auto-advance interval.
//  - 5.5 Reset returns to the initial pre-run state.

export interface ControlsProps {
  isPlaying: boolean
  canStepBack: boolean // currentStepIndex > 0
  canStepForward: boolean // currentStepIndex < steps.length - 1
  speedMs: number
  onRun: () => void // Run/Play → auto-advance (5.1)
  onNext: () => void // (5.2)
  onPrev: () => void // (5.3)
  onSpeedChange: (ms: number) => void // (5.4)
  onReset: () => void // (5.5)
}

// Selectable auto-play intervals (ms). Lower is faster.
const SPEED_OPTIONS: readonly { label: string; ms: number }[] = [
  { label: 'Slow', ms: 1200 },
  { label: 'Normal', ms: 700 },
  { label: 'Fast', ms: 300 },
]

export function Controls({
  isPlaying,
  canStepBack,
  canStepForward,
  speedMs,
  onRun,
  onNext,
  onPrev,
  onSpeedChange,
  onReset,
}: ControlsProps) {
  return (
    <div className="controls">
      <button
        type="button"
        className="controls__run"
        onClick={onRun}
        // While playing, there is nothing further to auto-advance to once the
        // final step is reached; disable Run/Play when it cannot move forward.
        disabled={isPlaying || !canStepForward}
        aria-pressed={isPlaying}
      >
        {isPlaying ? 'Playing…' : 'Run'}
      </button>

      <button
        type="button"
        className="controls__prev"
        onClick={onPrev}
        disabled={!canStepBack}
      >
        Previous
      </button>

      <button
        type="button"
        className="controls__next"
        onClick={onNext}
        disabled={!canStepForward}
      >
        Next
      </button>

      <button type="button" className="controls__reset" onClick={onReset}>
        Reset
      </button>

      <label className="controls__speed">
        <span className="controls__speed-label">Speed</span>
        <select
          className="controls__speed-select"
          value={speedMs}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        >
          {SPEED_OPTIONS.map((option) => (
            <option key={option.ms} value={option.ms}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
