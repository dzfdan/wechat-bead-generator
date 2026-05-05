const test = require('node:test');
const assert = require('node:assert/strict');

const { BEAD_PALETTE, pickNearestBeadColor } = require('../../utils/palette');

test('includes an expanded portrait-friendly bead palette', () => {
  const codes = BEAD_PALETTE.map((item) => item.code);

  assert.equal(BEAD_PALETTE.length >= 24, true);
  assert.deepEqual(
    codes.slice(0, 6),
    ['W01', 'W02', 'W03', 'K01', 'K02', 'N01']
  );
  assert.equal(codes.includes('S01'), true);
  assert.equal(codes.includes('P04'), true);
  assert.equal(codes.includes('H03'), true);
});

test('returns the nearest bead color for a bright red pixel', () => {
  const result = pickNearestBeadColor({ r: 250, g: 40, b: 50 });

  assert.equal(result.code, 'R01');
  assert.equal(result.name, 'Cherry Red');
});

test('returns the best portrait skin tone for a warm fair pixel', () => {
  const result = pickNearestBeadColor({ r: 244, g: 214, b: 198 });

  assert.equal(result.code, 'S02');
});

test('returns a soft pink instead of flattening into white', () => {
  const result = pickNearestBeadColor({ r: 244, g: 198, b: 215 });

  assert.equal(result.code, 'P02');
});

test('returns a deep outline color for dark brown shadow pixels', () => {
  const result = pickNearestBeadColor({ r: 78, g: 58, b: 52 });

  assert.equal(result.code, 'H03');
});

test('returns white for a near-white pixel', () => {
  const result = pickNearestBeadColor({ r: 245, g: 244, b: 240 });

  assert.equal(result.code, 'W01');
});

test('returns a deeper lip tone instead of flattening warm lip pixels into skin', () => {
  const result = pickNearestBeadColor({ r: 210, g: 118, b: 128 });

  assert.equal(result.code, 'R03');
});

test('returns a darker skin-shadow tone for jaw and nose-shadow pixels', () => {
  const result = pickNearestBeadColor({ r: 184, g: 132, b: 118 });

  assert.equal(result.code, 'S05');
});

test('returns a hair-shadow tone instead of collapsing blonde shadows into mid blonde', () => {
  const result = pickNearestBeadColor({ r: 176, g: 148, b: 108 });

  assert.equal(result.code, 'H04');
});
