# MARD Palette Migration

## Context

The project currently uses a custom internal bead palette with project-specific codes such as `R01`, `S02`, `H04`, and `K01`. Those codes appear throughout the generation pipeline: palette selection, grid cells, usage summaries, tests, and the result page.

The user wants the bead image color codes changed to MARD official codes based on the `mard.md` color table in the repository. They explicitly chose to change both the internal palette identity and the displayed result codes, not just the UI labels.

## Goals

- Replace the current internal bead palette identifiers with MARD official codes.
- Replace the current internal bead names with MARD official Chinese names.
- Update the palette color values to the selected MARD color values.
- Keep the current nearest-color matching behavior and output data shape unchanged.
- Ensure result grids, usage summaries, page rendering, and tests all consistently use MARD codes after the migration.

## Non-Goals

- Adding dual-code compatibility between legacy codes and MARD codes.
- Changing the overall grid generation algorithm.
- Adding user-selectable brand switching between multiple bead systems.
- Importing the entire MARD catalog if the project only needs a focused working subset.

## Decision

Use a full internal migration to MARD codes and names.

This means the project's working palette entries themselves will become MARD entries. The generator should continue to choose the nearest color from the active palette, but the palette entries it chooses from will now use MARD code/name/hex/rgb data.

This is preferable to a display-only translation layer because display-only translation would leave internal data inconsistent with what users see, which is exactly what the user does not want.

## Mapping Strategy

The migration should use a hybrid rule:

1. Start from the current working palette entries in `utils/palette.js`.
2. For most entries, choose the nearest MARD color from `mard.md` using RGB distance.
3. For portrait-critical entries, use explicit manual overrides where pure nearest-color mapping would harm readability.
4. Replace the current entry's `code`, `name`, `hex`, and `rgb` with the selected MARD values.
5. Keep the palette list focused to the current working subset rather than expanding immediately to the entire MARD catalog.

This preserves the existing palette size and general generation behavior while switching the identity and actual swatches to MARD.

## Why this strategy

- It keeps the migration bounded and testable.
- It avoids introducing a much larger palette explosion in the same change.
- It preserves the current portrait-oriented project behavior as much as possible while moving to the MARD system.
- It prevents obvious portrait regressions where lips or hair shadow would collapse into less useful skin or brown matches under pure automatic mapping.

## Manual Override Scope

Manual correction is allowed only for portrait-critical palette roles.

The initial override scope is:
- skin highlight / light skin
- skin midtone
- skin shadow
- lip tone
- hair shadow

All other palette entries should continue to use nearest MARD mapping without special-case handling.

The goal is to keep overrides narrow and explicit rather than turning the migration into a subjective full-hand remap.

## Expected Effects

After migration:
- generated grid cells should carry MARD `code`
- generated grid cells should carry MARD official Chinese `name`
- usage summaries should aggregate by MARD `code`
- result page usage rows should display MARD code and name
- all tests that assert exact color identity should use MARD values
- portrait-critical categories should still map to visually useful MARD colors rather than collapsing into clearly worse automatic matches

## Affected Files

Primary logic:
- `utils/palette.js`

Affected data consumers:
- `utils/bead-generator.js`
- `pages/result/index.wxml`

Tests likely requiring updates:
- `tests/utils/palette.test.js`
- `tests/utils/bead-generator.test.js`
- `tests/pages/index.test.js`
- `tests/pages/result.test.js`
- any other tests asserting exact color codes or names

Reference source:
- `mard.md`

## Data Model Constraints

The output shape should stay the same.

Grid cells and usage entries should still look like:
- `code`
- `name`
- `hex`
- optional `label`
- optional `count`

Only the values should change to MARD-based values.

## Migration Boundaries

The change should not introduce fallback aliases such as:
- legacy code plus MARD code
- display code plus internal code
- compatibility remapping tables for old test fixtures unless strictly needed during transition inside the same change

The desired end state is one code system only: MARD.

## Testing Strategy

The migration should be test-first.

Update or add tests in this order:

1. Palette tests
   - verify selected sample RGB values now resolve to expected MARD colors
   - verify manually corrected portrait categories resolve to their chosen MARD entries

2. Generator tests
   - verify `buildBeadGrid` and `buildResultModel` now emit MARD codes and names

3. Page tests
   - verify result payload rendering still works with MARD-coded data

4. Full suite
   - confirm no remaining tests rely on legacy codes

## Verification

After implementation, verify:
- no production code still depends on legacy palette codes like `R01`, `K01`, `W01`, `S02`, or `H04`
- result page still renders usage rows correctly with MARD values
- palette tests pass with MARD expectations
- generator and page tests pass with MARD expectations
- full `npm test` passes

## Risks

- Exact test fixtures will change broadly because many assertions currently hard-code legacy codes.
- Nearest-color mapping may shift slightly because MARD values are not identical to the current custom palette.
- Some existing portrait-friendly tuning may become slightly different after swapping to true MARD swatches.
- Manual overrides could drift into arbitrary taste if the allowed scope is not kept narrow.

## Mitigation

- Keep the palette subset size close to the current one.
- Update tests in a targeted way, focusing on the sample values already used by the project.
- Verify the full suite after migration so no legacy-code assumptions remain hidden.
- Restrict manual overrides to the explicitly approved portrait-critical roles only.
