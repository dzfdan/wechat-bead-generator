const test = require('node:test');
const assert = require('node:assert/strict');

const { SIZE_OPTIONS, EXPORT_SCALE, GRID_STROKE_COLOR } = require('../../utils/constants');

test('exports the fixed bead sizes and render defaults', () => {
  assert.deepEqual(
    SIZE_OPTIONS.map((item) => item.value),
    [32, 48, 64]
  );
  assert.equal(EXPORT_SCALE, 24);
  assert.equal(GRID_STROKE_COLOR, '#d0d7de');
});
