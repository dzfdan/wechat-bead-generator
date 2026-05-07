# MARD Palette Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the project's internal custom bead codes with MARD official codes, names, and swatches while preserving the current result data shape, portrait readability, and generation flow.

**Architecture:** Keep the existing nearest-color matching pipeline and result model, but swap the palette entries themselves to MARD-based entries selected from `mard.md`. Use nearest RGB mapping for most colors, then apply a very narrow set of explicit portrait overrides for skin highlight, skin midtone, skin shadow, lip tone, and hair shadow so the MARD migration does not degrade portrait outputs.

**Tech Stack:** Node.js tests, JavaScript utility modules, WeChat Mini Program page templates, Markdown color reference table

---

### Task 1: Add failing palette expectations for MARD output and portrait overrides

**Files:**
- Modify: `tests/utils/palette.test.js`
- Modify: `utils/palette.js`
- Reference: `mard.md`

- [ ] **Step 1: Replace legacy expected codes with MARD targets in palette tests**

Update the direct palette expectations so representative sample pixels now resolve to MARD colors instead of legacy codes.

Use assertions in this shape:

```js
assert.equal(result.code, 'F4');
assert.equal(result.name, '正红');
```

Cover these categories already present in the suite:
- bright red
- warm fair skin
- soft pink
- dark brown or black shadow
- near-white
- lip tone
- skin shadow
- hair shadow

For the portrait-critical entries, assert the manually corrected MARD choices rather than the pure nearest-color outcomes.

- [ ] **Step 2: Run palette tests to verify failure**

Run:

```bash
node --test tests/utils/palette.test.js
```

Expected: FAIL because `utils/palette.js` still returns legacy codes and names.

- [ ] **Step 3: Implement the focused MARD palette in `utils/palette.js`**

Replace the current `BEAD_PALETTE` entries with a focused MARD-backed subset derived from `mard.md`.

For most entries, use nearest MARD matches and store entries in this shape:

```js
{ code: 'H2', name: '米白', hex: '#F5F1E6', rgb: [245, 241, 230] }
```

For portrait-critical palette roles, use explicit overrides only for:
- skin highlight
- skin midtone
- skin shadow
- lip tone
- hair shadow

Preserve:
- `BEAD_PALETTE`
- `getLuma`
- `weightedDistanceSquared`
- `pickNearestBeadColor`

Do not add dual-code compatibility fields.

- [ ] **Step 4: Run palette tests to verify pass**

Run:

```bash
node --test tests/utils/palette.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/utils/palette.test.js utils/palette.js
git commit -m "feat: migrate palette codes to mard"
```

### Task 2: Update generator and index expectations to MARD output

**Files:**
- Modify: `tests/utils/bead-generator.test.js`
- Modify: `tests/pages/index.test.js`
- Modify: `utils/bead-generator.js` only if required

- [ ] **Step 1: Replace legacy code fixtures in generator tests**

Update hard-coded expectations in `tests/utils/bead-generator.test.js` from legacy codes like `R01`, `W01`, `B01`, and `K01` to the new MARD codes emitted by the migrated palette.

Update expectations in these areas:
- `buildBeadGrid`
- `summarizeUsage`
- `buildResultModel`
- portrait-detail regression cases that currently assert exact codes

- [ ] **Step 2: Replace legacy result expectations in index page tests**

Update `tests/pages/index.test.js` assertions that currently expect legacy codes in `currentResult.gridRows` and `currentResult.usage`.

Use the same new MARD values that the generator now emits.

- [ ] **Step 3: Run generator and index tests to verify failure**

Run:

```bash
node --test tests/utils/bead-generator.test.js tests/pages/index.test.js
```

Expected: FAIL until all expected codes and names are aligned with the migrated palette.

- [ ] **Step 4: Make minimal generator adjustments only if required**

If `utils/bead-generator.js` still works with the migrated palette values without structural changes, do not modify it.

If a minimal change is needed, keep the output shape unchanged:

```js
{
  code,
  name,
  hex,
  label,
  count
}
```

- [ ] **Step 5: Run generator and index tests to verify pass**

Run:

```bash
node --test tests/utils/bead-generator.test.js tests/pages/index.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/utils/bead-generator.test.js tests/pages/index.test.js utils/bead-generator.js
git commit -m "test: update generator expectations for mard"
```

### Task 3: Update result page fixtures to MARD-coded data

**Files:**
- Modify: `tests/pages/result.test.js`
- Modify: `pages/result/index.wxml` only if required

- [ ] **Step 1: Replace legacy fixture payload values in result page tests**

Update the `payload`, `previewGridRows`, `boardGridRows`, and any other inline fixtures so they use MARD codes and MARD official Chinese names instead of legacy values.

Fixture entries should now look like:

```js
{ code: 'F4', name: '正红', hex: '#FC283C', label: '1-1' }
```

Keep blank board cells unchanged.

- [ ] **Step 2: Run result page tests to verify failure**

Run:

```bash
node --test tests/pages/result.test.js
```

Expected: FAIL until all inline fixtures and exact expectations are aligned.

- [ ] **Step 3: Keep page template logic unchanged unless a real mismatch appears**

If `pages/result/index.wxml` already renders `item.code` and `item.name`, no production change is needed.

Only modify the page if the MARD migration creates a real rendering mismatch.

- [ ] **Step 4: Run result page tests to verify pass**

Run:

```bash
node --test tests/pages/result.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/pages/result.test.js pages/result/index.wxml
git commit -m "test: align result fixtures with mard palette"
```

### Task 4: Full regression verification and legacy-code sweep

**Files:**
- Verify: `utils/palette.js`
- Verify: `tests/utils/palette.test.js`
- Verify: `tests/utils/bead-generator.test.js`
- Verify: `tests/pages/index.test.js`
- Verify: `tests/pages/result.test.js`

- [ ] **Step 1: Search for remaining legacy code dependencies**

Search for legacy identifiers still referenced in production code and migrated tests, especially:

```text
R01
W01
K01
S02
H04
```

Expected: no remaining production dependency on legacy palette identity.

- [ ] **Step 2: Run focused migration tests**

Run:

```bash
node --test tests/utils/palette.test.js tests/utils/bead-generator.test.js tests/pages/index.test.js tests/pages/result.test.js
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests pass with zero failures.

- [ ] **Step 4: Review migration outcomes against spec**

Confirm these outcomes are true:

```text
- internal palette uses MARD code/name/hex/rgb values
- generated grid cells emit MARD codes
- usage summaries emit MARD codes
- result page fixtures render with MARD values
- only the approved portrait-critical roles use manual overrides
- no dual-code compatibility layer was introduced
```

- [ ] **Step 5: Commit**

```bash
git add utils/palette.js tests/utils/palette.test.js tests/utils/bead-generator.test.js tests/pages/index.test.js tests/pages/result.test.js pages/result/index.wxml
git commit -m "test: verify mard palette migration"
```
