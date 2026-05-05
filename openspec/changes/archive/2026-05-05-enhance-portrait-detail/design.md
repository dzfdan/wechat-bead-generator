## Context

The project already supports local image selection, portrait-friendly palette mapping, centered reference-board layout, and conservative subject-preserving cleanup. Even with those improvements, portrait outputs still lose too much visual identity in the face and hair regions because multiple subtle tones collapse into the same bucket during preprocessing, color matching, and cleanup.

The current system is intentionally lightweight and runs fully on-device inside a WeChat Mini Program. That constrains the solution: the change must remain plain JavaScript, avoid server-side processing, and build on the existing `image-preprocess`, `palette`, `grid-cleanup`, and `bead-generator` pipeline rather than introducing a heavy image-analysis dependency.

## Goals / Non-Goals

**Goals:**
- Preserve more facial detail, especially around eyes, lips, nose shadow, and jaw contour.
- Preserve more visible layering in light hair, shadow hair, and accessory edges.
- Improve portrait readability without changing the existing two-output result page structure.
- Keep the reference-board layout stable while improving the quality of the subject embedded inside it.
- Add regression coverage for portrait-specific detail-preservation behavior.

**Non-Goals:**
- Introducing ML-based face detection or segmentation.
- Adding user-facing tuning controls for portrait mode.
- Redesigning the reference-board layout or reintroducing the removed pegboard preview.
- Guaranteeing perfect likeness preservation for all portrait images.

## Decisions

### 1. Improve detail retention by tuning existing pipeline stages instead of adding a new analysis stage
The change will work inside the existing pipeline rather than inserting a new face-analysis module. The most valuable leverage points are already present:
- preprocessing before pixel sampling,
- palette mapping during quantization,
- cleanup heuristics after quantization.

This is preferable to adding a separate feature detector because the current app is intentionally local, dependency-light, and testable with simple Node unit tests.

Alternative considered:
- Add an explicit face-region detector and region-aware cleanup.
  - Rejected because it adds complexity, is harder to test locally, and is unnecessary for the current heuristic-driven quality target.

### 2. Increase useful portrait separation with targeted palette expansion, not wholesale color explosion
The project already has an expanded portrait palette, but the next gain should come from selectively improving the tones that matter most for face and hair readability: additional skin-shadow separation, lip separation, and blonde/hair-shadow separation.

This is preferable to broadly adding many colors because too many colors make bead outputs harder to use in practice and increase noise in the reference chart.

Alternative considered:
- Large palette expansion across many unrelated color families.
  - Rejected because it increases output complexity without focusing on the portrait-specific failure modes the user cares about.

### 3. Tighten cleanup around feature-like clusters while keeping background cleanup aggressive
The cleanup stage will continue to be heuristic-driven, but it will bias more strongly toward preserving clusters that resemble portrait details: compact dark eye detail, lip-adjacent contrast, and layered hair shadow transitions. Background-like outer regions will remain aggressively simplified.

This is preferable to disabling cleanup for centered details entirely because the current product still needs strong background simplification to keep the chart readable.

Alternative considered:
- Globally reduce cleanup strength.
  - Rejected because it would keep more detail, but also bring back noise and clutter in background areas.

### 4. Keep the result model split between preview data and reference-board data
The current result model already separates `previewGridRows` from `gridRows`. This pattern should remain, because portrait-detail improvements must help both views while allowing the preview to stay compact and the reference grid to keep blank margins.

Alternative considered:
- Recompute a preview-only compact grid inside the page layer.
  - Rejected because it duplicates logic and risks another preview/reference mismatch.

## Risks / Trade-offs

- More portrait-focused preservation may keep some unwanted interior noise alive -> Mitigation: keep new rules narrow and add negative regressions for false-preservation cases.
- Slightly richer portrait color separation can increase usage color count -> Mitigation: add only a few targeted tones for face/hair transitions instead of broad palette growth.
- Stronger face/hair preservation may make cleanup behavior harder to reason about -> Mitigation: add focused tests for eyes, lips, hair shadow clusters, and negative noise cases.
- Simple preprocessing changes can help one portrait type while hurting another -> Mitigation: prefer small, test-backed adjustments to contrast and smoothing rather than aggressive filtering.
