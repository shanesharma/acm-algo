# Requirements Document

## Introduction

The Two-Pointer Visualiser is an interactive single-page web application that teaches the two-pointer reversal algorithm. A user enters a comma-separated test case, then watches two pointers converge from the left and right ends of the array, swapping elements until the array is reversed. The interface highlights the active pointer indices, animates each swap, and displays a synchronized code panel. Before running, the code panel shows simplified pseudocode; during a run, it shows executable Python with the currently executing line highlighted and the live left and right values inline. The user controls execution through manual stepping, auto-play with adjustable speed, and reset, and can copy the Python code to the clipboard.

## Glossary

- **Visualiser**: The overall two-pointer visualiser application that renders the array, controls, and code panel.
- **Array_View**: The component that renders the array elements as a row of cells.
- **Cell**: A single element of the array as rendered in the Array_View.
- **Left_Pointer**: The pointer that starts at the first index (index 0) of the array and moves toward higher indices.
- **Right_Pointer**: The pointer that starts at the last index of the array and moves toward lower indices.
- **Active_Index**: An array index currently referenced by the Left_Pointer or the Right_Pointer.
- **Swap_Animation**: The visual transition applied to the two Cells whose values are exchanged during a swap step.
- **Code_Panel**: The component displayed beneath the Array_View that shows algorithm code.
- **Pseudocode_Mode**: The Code_Panel state, active before a run begins, that displays simplified pseudocode.
- **Python_Mode**: The Code_Panel state, active once a run begins, that displays executable Python with line highlighting.
- **Current_Line**: The single line of Python in Python_Mode that corresponds to the current execution step.
- **Test_Case_Input**: The text field where the user enters comma-separated values.
- **Run_Control**: The Run/Play control that starts auto-play execution.
- **Step_Control**: The Next and Previous controls used for manual stepping.
- **Speed_Control**: The control that sets the auto-play interval between steps.
- **Reset_Control**: The control that returns the Visualiser to its initial pre-run state.
- **Copy_Control**: The control that copies the Python code to the system clipboard.
- **Iteration**: A single step of the algorithm consisting of comparing pointer positions and performing a swap when applicable.
- **Parsed_Array**: The array of values produced by parsing the Test_Case_Input.

## Requirements

### Requirement 1

**User Story:** As a learner, I want to enter a test case as comma-separated values, so that I can visualise the algorithm on my own data.

#### Acceptance Criteria

1. THE Test_Case_Input SHALL accept a comma-separated string of values.
2. WHEN the user submits a Test_Case_Input containing at least one non-empty value between commas, THE Visualiser SHALL produce a Parsed_Array where each element equals one trimmed value from the input in input order.
3. IF the Test_Case_Input is empty or contains no non-empty value, THEN THE Visualiser SHALL display an inline error message and disable the Run_Control.
4. WHILE the Test_Case_Input is invalid, THE Visualiser SHALL keep the Run_Control disabled.
5. WHEN the user corrects an invalid Test_Case_Input to a valid value, THE Visualiser SHALL remove the inline error message and enable the Run_Control.

### Requirement 2

**User Story:** As a learner, I want the array rendered on a clean background with highlighted pointers, so that I can see which elements are being compared.

#### Acceptance Criteria

1. THE Visualiser SHALL render with a white background.
2. WHEN a Parsed_Array is produced, THE Array_View SHALL render one Cell for each element of the Parsed_Array.
3. WHILE a run is active, THE Array_View SHALL highlight each Cell at an Active_Index in yellow.
4. WHILE a run is active, THE Array_View SHALL display the Cell at the Left_Pointer index and the Cell at the Right_Pointer index as the two Active_Index Cells.

### Requirement 3

**User Story:** As a learner, I want to see a swap animation when two elements exchange positions, so that I can follow how the array changes.

#### Acceptance Criteria

1. WHEN an Iteration exchanges the values at the Left_Pointer index and the Right_Pointer index, THE Array_View SHALL play a Swap_Animation on both Cells.
2. WHEN a Swap_Animation completes, THE Array_View SHALL display the exchanged values at the Left_Pointer index and the Right_Pointer index.
3. WHERE the Left_Pointer index equals or has crossed the Right_Pointer index, THE Visualiser SHALL stop performing further Iterations.

### Requirement 4

**User Story:** As a learner, I want the code panel to show simplified pseudocode before I run and real Python during the run, so that I can connect the concept to executable code.

#### Acceptance Criteria

1. WHILE no run has started, THE Code_Panel SHALL display Pseudocode_Mode with simplified pseudocode.
2. WHEN a run begins, THE Code_Panel SHALL switch to Python_Mode displaying executable Python code.
3. WHILE in Python_Mode, THE Code_Panel SHALL highlight the Current_Line that corresponds to the current execution step.
4. WHILE in Python_Mode, THE Code_Panel SHALL display the current Left_Pointer value and the current Right_Pointer value inline.
5. WHILE iterations progress, THE Code_Panel SHALL expand to accommodate the displayed execution state.

### Requirement 5

**User Story:** As a learner, I want manual and automatic execution controls, so that I can move through the algorithm at my own pace.

#### Acceptance Criteria

1. WHEN the user activates the Run_Control, THE Visualiser SHALL auto-advance through Iterations at the interval defined by the Speed_Control.
2. WHEN the user activates the Next control, THE Visualiser SHALL advance the execution by one step.
3. WHEN the user activates the Previous control, THE Visualiser SHALL return the execution to the immediately preceding step.
4. WHEN the user changes the Speed_Control, THE Visualiser SHALL apply the new interval to subsequent auto-advance steps.
5. WHEN the user activates the Reset_Control, THE Visualiser SHALL return the Array_View to the initial Parsed_Array and the Code_Panel to Pseudocode_Mode.

### Requirement 6

**User Story:** As a learner, I want to copy the Python code, so that I can reuse the solution outside the visualiser.

#### Acceptance Criteria

1. WHEN the user activates the Copy_Control, THE Visualiser SHALL write the Python code to the system clipboard.
2. WHEN the Python code is written to the system clipboard, THE Visualiser SHALL display a confirmation that the code was copied.
3. IF writing to the system clipboard fails, THEN THE Visualiser SHALL display an inline error message indicating the copy did not complete.
