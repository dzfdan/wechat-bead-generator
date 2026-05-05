## Why

Current portrait output is still losing too much facial readability after quantization and cleanup. Eyes, lips, nose shadow, and hair layering flatten too aggressively, which makes the generated bead chart less useful as a likeness-preserving reference.

## What Changes

- Improve portrait-detail preservation so key facial features and hair shadows survive quantization and cleanup more reliably.
- Strengthen color separation for face and hair regions so highlights, midtones, and shadows are less likely to collapse into a single band.
- Adjust the reference-grid generation path so the chart remains readable while preserving the centered board composition added in the latest iteration.
- Add regression coverage for portrait-specific edge cases, especially fine facial detail and layered hair transitions.

## Capabilities

### New Capabilities
- `portrait-detail-enhancement`: Improve portrait-oriented bead generation so facial features and hair layering remain clearer in both the preview output and the reference grid.

### Modified Capabilities

## Impact

- Affected code: `utils/palette.js`, `utils/grid-cleanup.js`, `utils/bead-generator.js`, `utils/image-preprocess.js`, and related renderer/page tests.
- Affected behavior: portrait images should produce clearer faces and stronger hair depth without changing the basic two-output page flow.
- Affected systems: local image sampling, bead color mapping, cleanup heuristics, and reference-grid test coverage.
