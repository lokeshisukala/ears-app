## Problem
The "Patient Boarding?" modal is appearing at the wrong time (e.g. after dismissing, or while not actually arrived at the patient). Root causes in `src/pages/Index.tsx`:

1. `handleBoardingNo` schedules an unconditional `setTimeout(() => setBoardingOpen(true), 5000)`. It re-opens the modal 5s later even if the mission has moved on (driver started a new dispatch, EARS went offline, mission was cancelled, etc.).
2. `PatientBoardingModal` itself has no guard against `missionState` — it relies purely on `boardingOpen`, so any stray `true` flips it on.
3. The re-prompt timer is never cleared when the component unmounts or mission state changes, so old timers keep firing.

## Fix Plan

Edit only `src/pages/Index.tsx`:

- Track the re-prompt timer in a `useRef<number | null>` so we can cancel it.
- In `handleBoardingNo`, clear any existing timer, then schedule a new one that **checks `missionState === "arrived_patient"` and `serverOnline`** before re-opening.
- In `handleBoardingYes`, `handleVitalsSubmit`, `handleDone`, and the accident handler, clear the pending re-prompt timer.
- Add a `useEffect` that auto-closes `boardingOpen` whenever `missionState` is not `arrived_patient` (defensive guard so the modal can never appear out-of-phase).
- Clear the timer on unmount.

No other files change. No business-logic / routing changes — purely a UI/state guard fix for the stray modal.
