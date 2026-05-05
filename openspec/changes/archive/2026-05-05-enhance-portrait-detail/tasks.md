## 1. Palette and preprocessing refinement

- [x] 1.1 Add targeted portrait palette regressions for lip, skin-shadow, and blonde hair separation in `tests/utils/palette.test.js`
- [x] 1.2 Expand or tune the relevant portrait colors in `utils/palette.js` so face and hair tones do not collapse into the same bucket
- [x] 1.3 Add portrait-oriented preprocessing regressions in `tests/utils/image-preprocess.test.js` for preserving contrast around facial and hair-shadow transitions
- [x] 1.4 Adjust `utils/image-preprocess.js` conservatively so smoothing and channel balancing keep more facial and hair-layer contrast

## 2. Cleanup and generation detail preservation

- [x] 2.1 Add cleanup regressions in `tests/utils/grid-cleanup.test.js` for eye, lip, hair-shadow, and accessory-detail preservation plus negative noise cases
- [x] 2.2 Tighten `utils/grid-cleanup.js` so portrait-detail clusters survive without broadly preserving unrelated centered noise
- [x] 2.3 Add generator regressions in `tests/utils/bead-generator.test.js` confirming preview and board grids both retain the improved portrait-detail output
- [x] 2.4 Update `utils/bead-generator.js` if needed so the result model continues to separate `previewGridRows` and `gridRows` while carrying improved portrait detail through both paths

## 3. Result verification and flow safety

- [x] 3.1 Add result-page regressions in `tests/pages/result.test.js` that verify preview and guide still consume the correct grid fields after portrait-detail changes
- [x] 3.2 Update `pages/result/index.js` only if needed to preserve the compact-preview vs. centered-board split after the new detail pipeline changes
- [x] 3.3 Run the full test suite and confirm portrait-detail enhancement does not reintroduce the removed pegboard output or break the two-output result flow
