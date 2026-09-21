// Test_Case_Input — the text field where the user enters comma-separated values.
//
// This is a presentational component: App owns all state, re-parses on every
// change, and passes the current value plus the parse error down as props. The
// component renders the field, shows the inline error when present, and gates
// the Run trigger.
//
// Requirements:
//   1.1 — accept a comma-separated string of values.
//   1.3 — when invalid, show an inline error and disable Run.
//   1.4 — while invalid, keep Run disabled.
//   1.5 — when corrected to valid, clear the error and enable Run.

export interface TestCaseInputProps {
  value: string
  error: string | null // null when valid; message when invalid (1.3)
  disabled: boolean // disabled while a run is active
  onChange: (raw: string) => void
  onRun: () => void // gated: only callable when valid
}

export function TestCaseInput({
  value,
  error,
  disabled,
  onChange,
  onRun,
}: TestCaseInputProps) {
  // Run is gated on both the run-active `disabled` flag and validity: an error
  // means the input is invalid, so Run stays disabled (1.3, 1.4). When the
  // error clears (input corrected), Run re-enables (1.5).
  const runDisabled = disabled || error !== null

  // Submitting via Enter is a convenience for the primary action. It must obey
  // the same gate as the Run control so invalid input can never start a run.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !runDisabled) {
      onRun()
    }
  }

  const errorId = 'test-case-input-error'

  return (
    <div className="test-case-input">
      <label className="test-case-input__label" htmlFor="test-case-input-field">
        Test case
      </label>
      <div className="test-case-input__row">
        <input
          id="test-case-input-field"
          className="test-case-input__field"
          type="text"
          value={value}
          disabled={disabled}
          placeholder="e.g. a, b, c, d"
          aria-invalid={error !== null}
          aria-describedby={error !== null ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="test-case-input__run"
          disabled={runDisabled}
          onClick={onRun}
        >
          Run
        </button>
      </div>
      {error !== null && (
        <p id={errorId} className="test-case-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
